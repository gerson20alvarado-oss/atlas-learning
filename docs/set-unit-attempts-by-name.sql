-- Función administrativa: reinicia (o fija) los intentos de un
-- estudiante buscándolo por nombre, sin necesitar copiar su UUID a
-- mano ni depender de que Supabase Studio permita editar celdas de
-- una vista (no las permite, sin importar el trigger).

create or replace function set_unit_attempts_by_name(
  p_first_name text,
  p_last_name text,
  p_book_id text,
  p_unit_number int,
  p_new_value int
)
returns table (user_id uuid, first_name text, last_name text, attempts_used int)
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
    and ual.unit_number = p_unit_number;

  return query
  select ual.user_id, p.first_name, p.last_name, ual.attempts_used
  from unit_attempt_limits ual
  join profiles p on p.user_id = ual.user_id
  where p.first_name ilike p_first_name
    and p.last_name ilike p_last_name
    and ual.book_id = p_book_id
    and ual.unit_number = p_unit_number;
end;
$$;
