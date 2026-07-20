-- Vista combinada de administración: perfil + licencia + intentos
-- por unidad + cuántos ejercicios ya tiene calificados, en una sola
-- fila por (usuario, libro, unidad). worksheet_exercise_attempts se
-- resume como un conteo (read-only) en vez de unirse fila por fila,
-- para no multiplicar las filas de unit_attempt_limits por cada
-- ejercicio.

create or replace view atlas_admin_overview as
select
  p.first_name,
  p.last_name,
  ual.user_id,
  ual.book_id,
  lk.status as license_status,
  ual.unit_number,
  ual.attempts_used,
  (
    select count(*)
    from worksheet_exercise_attempts wea
    where wea.user_id = ual.user_id
      and wea.book_id = ual.book_id
      and wea.unit_number = ual.unit_number
  ) as exercises_graded,
  ual.updated_at
from unit_attempt_limits ual
left join profiles p on p.user_id = ual.user_id
left join license_keys lk on lk.user_id = ual.user_id and lk.book_id = ual.book_id;

-- Mismo trigger de antes, por si Studio sí permite editar desde esta
-- vista combinada (no lo garantizo) — y para que el UPDATE por SQL
-- directo sobre la vista funcione en cualquier caso.

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
    and unit_number = old.unit_number;
  return new;
end;
$$;

create trigger atlas_admin_overview_update_trigger
  instead of update on atlas_admin_overview
  for each row execute function atlas_admin_overview_update();
