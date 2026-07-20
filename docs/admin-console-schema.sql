-- Atlas Learning — Admin Console (Sprint 14)
-- Ejecutar completo en el SQL Editor de Supabase.
--
-- Puramente aditivo: ninguna tabla nueva, ninguna política existente
-- se toca ni se reemplaza. Postgres combina políticas RLS del mismo
-- comando con OR, así que un estudiante normal sigue viendo
-- exactamente lo mismo de siempre — estas políticas solo añaden lo
-- que un admin puede ver/tocar además de su propia fila.

-- ============================================================
-- 1. profiles.role — único campo nuevo de todo Sprint 14.
--    Sin este campo no hay forma de distinguir un admin de un
--    estudiante; vive en profiles porque ya es la tabla de
--    identidad de dominio (nunca en auth.users, que Auth no expone
--    para escritura de campos propios del dominio).
-- ============================================================

alter table profiles
  add column if not exists role text not null default 'student'
    check (role in ('student', 'admin'));

-- Alta del primer admin (manual, una sola vez, por SQL Editor):
-- update profiles set role = 'admin' where user_id = '<uuid del admin>';

-- ============================================================
-- 2. is_admin() — SECURITY DEFINER a propósito: si fuera una
--    política RLS normal sobre profiles consultando profiles, sería
--    recursiva (RLS de profiles evaluando una subconsulta a
--    profiles). SECURITY DEFINER evita el ciclo por completo.
-- ============================================================

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function is_admin() to authenticated;

-- ============================================================
-- 3. Políticas RLS aditivas — una lectura total + escritura donde
--    la consola realmente la necesita, tabla por tabla. Ninguna
--    reemplaza a las que ya existen (ver profiles-schema.sql,
--    license-keys-schema.sql, unit-attempt-limits-schema.sql,
--    worksheet-attempts-schema.sql).
-- ============================================================

-- profiles — Users: buscar/ver perfiles de cualquier estudiante.
create policy "Admins read all profiles"
  on profiles for select
  to authenticated
  using (is_admin());

-- license_keys — Licenses: ver todas + activar/revocar (UPDATE
-- directo de status; el flujo de activación del estudiante sigue
-- pasando únicamente por activate_license(), sin cambios).
create policy "Admins read all license keys"
  on license_keys for select
  to authenticated
  using (is_admin());

create policy "Admins update license keys"
  on license_keys for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- unit_attempt_limits — Worksheet Attempts: ver + editar
-- attempts_used directamente. Reemplaza el uso manual de
-- set_unit_attempts_by_name.sql, sin eliminar esa función (queda
-- como alternativa de SQL Editor si hiciera falta).
create policy "Admins read all unit attempt limits"
  on unit_attempt_limits for select
  to authenticated
  using (is_admin());

create policy "Admins update unit attempt limits"
  on unit_attempt_limits for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- worksheet_exercise_attempts — Worksheet Attempts: solo lectura
-- (conteo de "exercises_graded"); la consola nunca escribe aquí —
-- esta tabla no vuelve a controlar intentos (decisión confirmada).
create policy "Admins read all worksheet exercise attempts"
  on worksheet_exercise_attempts for select
  to authenticated
  using (is_admin());

-- reader_positions — Reader Progress: ver + reiniciar (DELETE;
-- sin fila, el estudiante vuelve a empezar desde la página 1, mismo
-- comportamiento que "nunca hubo posición guardada").
create policy "Admins read all reader positions"
  on reader_positions for select
  to authenticated
  using (is_admin());

create policy "Admins delete reader positions"
  on reader_positions for delete
  to authenticated
  using (is_admin());

-- bookmarks — Bookmarks: ver + eliminar marcadores de cualquier
-- estudiante.
create policy "Admins read all bookmarks"
  on bookmarks for select
  to authenticated
  using (is_admin());

create policy "Admins delete bookmarks"
  on bookmarks for delete
  to authenticated
  using (is_admin());

-- ============================================================
-- 4. Vistas existentes (atlas_admin_overview,
--    unit_attempts_with_owner): hasta hoy solo se usaban desde
--    Supabase Studio, que ignora RLS. Para que la consola pueda
--    consultarlas de forma segura vía REST con el token del propio
--    admin, deben:
--      a) evaluar RLS con los privilegios de quien consulta
--         (security_invoker), no con los del dueño de la vista —
--         si no, cualquier authenticated (no solo admins) vería
--         todas las filas de todos los estudiantes al leer la vista
--         directamente, sin pasar por ninguna política de arriba;
--      b) tener GRANT explícito a authenticated — sin él, Postgrest
--         devuelve 42501 y la vista queda inaccesible por API
--         (que es, de hecho, el estado actual — nunca se otorgó).
--    Con ambos cambios: un admin ve todas las filas (sus políticas
--    aditivas se lo permiten); un estudiante que intentara leer la
--    vista solo vería su propia fila (sus políticas de siempre) —
--    nunca las de otro.
-- ============================================================

alter view atlas_admin_overview set (security_invoker = true);
grant select on atlas_admin_overview to authenticated;

alter view unit_attempts_with_owner set (security_invoker = true);
grant select on unit_attempts_with_owner to authenticated;
