-- Atlas Learning — Evaluaciones independientes por unidad
-- (Worksheet / Progress Test / futuras: Quiz, Speaking Assessment...)
-- Ejecutar completo en el SQL Editor de Supabase.
--
-- Aditivo y compatible con todos los datos existentes: el default
-- 'worksheet' hace que cada fila ya registrada (todas las de Unit 1
-- hasta hoy) se reclasifique automáticamente como perteneciente a la
-- evaluación "worksheet" — cero migración de datos, cero downtime,
-- cero intento perdido.

-- ============================================================
-- 1. unit_attempt_limits — ampliar la clave a (user_id, book_id,
--    unit_number, assessment_id). Antes: un contador por unidad.
--    Ahora: un contador por evaluación dentro de la unidad — la
--    Worksheet y el Progress Test nunca comparten intentos.
-- ============================================================

alter table unit_attempt_limits
  add column if not exists assessment_id text not null default 'worksheet';

alter table unit_attempt_limits drop constraint if exists unit_attempt_limits_pkey;
alter table unit_attempt_limits
  add primary key (user_id, book_id, unit_number, assessment_id);

-- Incremento — SECURITY DEFINER, upsert atómico. `p_assessment_id`
-- con default 'worksheet': cualquier llamada antigua en tránsito
-- durante el despliegue (cliente todavía no actualizado) sigue
-- funcionando exactamente igual que antes.
create or replace function increment_unit_attempt(
  p_book_id text,
  p_unit_number int,
  p_assessment_id text default 'worksheet'
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count int;
begin
  insert into unit_attempt_limits (user_id, book_id, unit_number, assessment_id, attempts_used)
  values (auth.uid(), p_book_id, p_unit_number, p_assessment_id, 1)
  on conflict (user_id, book_id, unit_number, assessment_id)
  do update set attempts_used = unit_attempt_limits.attempts_used + 1, updated_at = now()
  returning attempts_used into v_new_count;

  return v_new_count;
end;
$$;

grant execute on function increment_unit_attempt(text, int, text) to authenticated;

-- ============================================================
-- 2. worksheet_exercise_attempts — misma ampliación de clave. Antes,
--    `deleteAttemptsForUnit` borraba por (user, book, unit) sin más
--    — con dos evaluaciones compartiendo unit_number, eso habría
--    borrado las respuestas de AMBAS al presionar "Start New
--    Attempt" en cualquiera de las dos. Con assessment_id en la
--    clave, cada evaluación borra únicamente lo suyo.
-- ============================================================

alter table worksheet_exercise_attempts
  add column if not exists assessment_id text not null default 'worksheet';

alter table worksheet_exercise_attempts drop constraint if exists worksheet_exercise_attempts_pkey;
alter table worksheet_exercise_attempts
  add primary key (user_id, book_id, unit_number, assessment_id, exercise_id);

-- ============================================================
-- 3. Funciones/vistas administrativas existentes — deben conocer la
--    nueva columna, o un admin terminaría editando/reiniciando la
--    evaluación equivocada sin darse cuenta.
-- ============================================================

drop trigger if exists unit_attempts_with_owner_update_trigger on unit_attempts_with_owner;

create or replace view unit_attempts_with_owner as
select
  ual.user_id,
  p.first_name,
  p.last_name,
  ual.book_id,
  ual.unit_number,
  ual.assessment_id,
  ual.attempts_used,
  ual.updated_at
from unit_attempt_limits ual
left join profiles p on p.user_id = ual.user_id;

alter view unit_attempts_with_owner set (security_invoker = true);
grant select on unit_attempts_with_owner to authenticated;

create or replace function unit_attempts_with_owner_update()
returns trigger
language plpgsql
as $$
begin
  update unit_attempt_limits
  set attempts_used = new.attempts_used,
      updated_at = now()
  where user_id = old.user_id
    and book_id = old.book_id
    and unit_number = old.unit_number
    and assessment_id = old.assessment_id;
  return new;
end;
$$;

create trigger unit_attempts_with_owner_update_trigger
  instead of update on unit_attempts_with_owner
  for each row execute function unit_attempts_with_owner_update();

drop trigger if exists atlas_admin_overview_update_trigger on atlas_admin_overview;

create or replace view atlas_admin_overview as
select
  p.first_name,
  p.last_name,
  ual.user_id,
  ual.book_id,
  lk.status as license_status,
  ual.unit_number,
  ual.assessment_id,
  ual.attempts_used,
  (
    select count(*)
    from worksheet_exercise_attempts wea
    where wea.user_id = ual.user_id
      and wea.book_id = ual.book_id
      and wea.unit_number = ual.unit_number
      and wea.assessment_id = ual.assessment_id
  ) as exercises_graded,
  ual.updated_at
from unit_attempt_limits ual
left join profiles p on p.user_id = ual.user_id
left join license_keys lk on lk.user_id = ual.user_id and lk.book_id = ual.book_id;

alter view atlas_admin_overview set (security_invoker = true);
grant select on atlas_admin_overview to authenticated;

create or replace function atlas_admin_overview_update()
returns trigger
language plpgsql
as $$
begin
  update unit_attempt_limits
  set attempts_used = new.attempts_used,
      updated_at = now()
  where user_id = old.user_id
    and book_id = old.book_id
    and unit_number = old.unit_number
    and assessment_id = old.assessment_id;
  return new;
end;
$$;

create trigger atlas_admin_overview_update_trigger
  instead of update on atlas_admin_overview
  for each row execute function atlas_admin_overview_update();

-- set_unit_attempts_by_name — gana p_assessment_id (default
-- 'worksheet' para no romper el uso manual ya documentado).
create or replace function set_unit_attempts_by_name(
  p_first_name text,
  p_last_name text,
  p_book_id text,
  p_unit_number int,
  p_new_value int,
  p_assessment_id text default 'worksheet'
)
returns table (user_id uuid, first_name text, last_name text, assessment_id text, attempts_used int)
language plpgsql
as $$
begin
  update unit_attempt_limits ual
  set attempts_used = p_new_value, updated_at = now()
  from profiles p
  where p.user_id = ual.user_id
    and p.first_name ilike p_first_name
    and p.last_name ilike p_last_name
    and ual.book_id = p_book_id
    and ual.unit_number = p_unit_number
    and ual.assessment_id = p_assessment_id;

  return query
  select ual.user_id, p.first_name, p.last_name, ual.assessment_id, ual.attempts_used
  from unit_attempt_limits ual
  join profiles p on p.user_id = ual.user_id
  where p.first_name ilike p_first_name
    and p.last_name ilike p_last_name
    and ual.book_id = p_book_id
    and ual.unit_number = p_unit_number
    and ual.assessment_id = p_assessment_id;
end;
$$;
