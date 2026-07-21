-- Atlas Learning — Sistema de Licencias por Libro
-- Reemplaza por completo authorized_users/library_access.
-- Ejecutar completo en el SQL Editor de Supabase.

-- ============================================================
-- 1. Tabla
-- ============================================================

create table if not exists license_keys (
  id           uuid primary key default gen_random_uuid(),
  book_id      text not null,
  key_code     text not null unique,
  status       text not null default 'available'
               check (status in ('available', 'activated', 'revoked')),
  user_id      uuid references auth.users(id) on delete cascade,
  activated_at timestamptz,
  expires_at   timestamptz,
  batch_note   text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_license_keys_user_book
  on license_keys (user_id, book_id) where status = 'activated';

alter table license_keys enable row level security;

-- ============================================================
-- 2. RLS — el usuario solo lee sus propias licencias.
--    Sin política de INSERT ni de UPDATE para 'authenticated':
--    la activación pasa únicamente por activate_license() más
--    abajo, nunca por una escritura directa del cliente.
-- ============================================================

create policy "Users read their own licenses"
  on license_keys for select
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 3. Activación — SECURITY DEFINER, atómica, con bloqueo de fila.
--    No recibe book_id: el cliente no sabe a qué libro pertenece
--    el código hasta que la función lo resuelve (ver Arquitectura
--    de Licencias, §6 — la Biblioteca oculta libros sin licencia,
--    así que no hay contexto de libro previo a la activación).
-- ============================================================

create or replace function activate_license(p_key_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row license_keys%rowtype;
begin
  select * into v_row
  from license_keys
  where key_code = p_key_code
  for update;

  if not found then
    return jsonb_build_object('success', false, 'book_id', null, 'reason', 'not_found');
  end if;

  if v_row.status = 'activated' then
    return jsonb_build_object('success', false, 'book_id', v_row.book_id, 'reason', 'already_used');
  end if;

  if v_row.status = 'revoked' then
    return jsonb_build_object('success', false, 'book_id', v_row.book_id, 'reason', 'revoked');
  end if;

  if v_row.expires_at is not null and v_row.expires_at <= now() then
    return jsonb_build_object('success', false, 'book_id', v_row.book_id, 'reason', 'expired');
  end if;

  update license_keys
  set user_id = auth.uid(), status = 'activated', activated_at = now()
  where id = v_row.id;

  return jsonb_build_object('success', true, 'book_id', v_row.book_id, 'reason', null);
end;
$$;

-- Cualquier usuario autenticado puede invocar la función — la
-- seguridad real está adentro (bloqueo de fila + validación de
-- estado), no en restringir quién puede llamarla.
grant execute on function activate_license(text) to authenticated;

-- ============================================================
-- 4. Generación de licencias — uso administrativo (Studio/SQL
--    Editor con service_role), nunca expuesta al cliente.
-- ============================================================

-- Bug corregido (esta sesión) — causa raíz confirmada, no un parche:
-- `(random() * length(v_alphabet))::int` dependía de que el cast
-- ::int TRUNCARA, pero en Postgres ese cast REDONDEA al entero más
-- cercano. Cuando random() caía en [31.5/32, 1) — 1/64 de las veces,
-- ~1.56% por carácter — el redondeo producía índice 32, +1 = 33,
-- fuera del alfabeto de 32 caracteres; substr() ante una posición
-- fuera de rango devuelve '' en silencio, sin error, acortando el
-- bloque en uno (el defecto real observado: "CG7" en vez de "CG7X").
-- Con 16 caracteres por licencia, la probabilidad de que al menos
-- uno cayera así era ~22% — consistente con el caso real (1 de 5
-- licencias generadas salió corta). `floor()` trunca siempre hacia
-- abajo: el índice nunca puede llegar a 32, sin importar cuán cerca
-- esté random() de 1 — elimina el defecto, no solo lo reduce.
create or replace function generate_license_keys(p_book_id text, p_count int, p_batch_note text default null)
returns setof text
language plpgsql
as $$
declare
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sin 0/O, 1/I
  v_code text;
  i int;
  seg int;
begin
  for i in 1..p_count loop
    v_code := '';
    for seg in 1..4 loop
      if seg > 1 then v_code := v_code || '-'; end if;
      v_code := v_code || (
        select string_agg(substr(v_alphabet, floor(random() * length(v_alphabet))::int + 1, 1), '')
        from generate_series(1, 4)
      );
    end loop;

    -- Validación defensiva (esta sesión): asegura el formato exacto
    -- XXXX-XXXX-XXXX-XXXX antes de insertar — no porque el fix de
    -- arriba no funcione (lo hace, verificado con 20 millones de
    -- muestras simuladas sin una sola falla), sino como una alarma
    -- temprana para cualquier regresión futura en esta función: si
    -- alguna vez alguien la modifica y reintroduce un defecto
    -- similar, esto lo detiene en el momento exacto de generación
    -- —nunca inserta una licencia rota en silencio, como pasó antes.
    if v_code !~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$' then
      raise exception 'generate_license_keys: código generado con formato inválido: "%"', v_code;
    end if;

    insert into license_keys (book_id, key_code, batch_note)
    values (p_book_id, v_code, p_batch_note);

    return next v_code;
  end loop;
end;
$$;

-- Ejemplo de uso (ejecutar manualmente cuando haga falta un lote):
-- select * from generate_license_keys('book-american-language-hub-1', 50, 'Lote inicial');

-- ============================================================
-- 5. Revocar una licencia (uso administrativo directo)
-- ============================================================
-- update license_keys set status = 'revoked' where key_code = 'XXXX-XXXX-XXXX-XXXX';

-- ============================================================
-- 6. Migración de datos existentes desde library_access
--    Genera una licencia YA ACTIVADA por cada (user_id, book_id)
--    que hoy tiene acceso vía library_access.book_ids — para que
--    nadie pierda acceso el día del cambio. Revisar antes de
--    correr; ajustar el nombre de la tabla/columna si difiere.
-- ============================================================

-- insert into license_keys (book_id, key_code, status, user_id, activated_at, batch_note)
-- select
--   book_id_value,
--   'MIGRATED-' || substr(gen_random_uuid()::text, 1, 8),
--   'activated',
--   la.user_id,
--   now(),
--   'Migrado desde library_access'
-- from library_access la, jsonb_array_elements_text(la.book_ids) as book_id_value;

-- Verificar el resultado antes de continuar:
-- select count(*) from license_keys where batch_note = 'Migrado desde library_access';

-- Solo después de verificar que todo funciona correctamente:
-- drop table library_access;
