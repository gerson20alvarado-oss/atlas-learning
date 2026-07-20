-- Vista administrativa: intentos por unidad + nombre del estudiante,
-- editable directamente desde Supabase Table Editor.

create or replace view unit_attempts_with_owner as
select
  ual.user_id,
  p.first_name,
  p.last_name,
  ual.book_id,
  ual.unit_number,
  ual.attempts_used,
  ual.updated_at
from unit_attempt_limits ual
left join profiles p on p.user_id = ual.user_id;

-- Una vista con JOIN no es editable por defecto en Postgres — este
-- trigger es lo que permite editar attempts_used directamente desde
-- las filas de la vista en Table Editor. Redirige el UPDATE a la
-- tabla real (unit_attempt_limits), identificando la fila por su
-- llave compuesta (user_id, book_id, unit_number). Solo
-- attempts_used es editable así — first_name/last_name son de solo
-- lectura en esta vista (viven en profiles, no aquí).

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
    and unit_number = old.unit_number;
  return new;
end;
$$;

create trigger unit_attempts_with_owner_update_trigger
  instead of update on unit_attempts_with_owner
  for each row execute function unit_attempts_with_owner_update();
