-- Atlas Learning — Control de Intentos por Unidad
-- Ejecutar completo en el SQL Editor de Supabase.
-- No modifica worksheet_exercise_attempts en absoluto.

-- ============================================================
-- 1. Tabla — aislada, responsabilidad única: cuántas pasadas
--    completas de la unidad ha usado el estudiante.
-- ============================================================

create table if not exists unit_attempt_limits (
  user_id       uuid not null references auth.users(id) on delete cascade,
  book_id       text not null,
  unit_number   int not null,
  attempts_used int not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (user_id, book_id, unit_number)
);

alter table unit_attempt_limits enable row level security;

-- ============================================================
-- 2. RLS — el cliente solo lee. El único incremento legítimo pasa
--    por increment_unit_attempt() (§3); el reinicio administrativo
--    es un UPDATE directo con service_role, nunca expuesto al
--    cliente.
-- ============================================================

create policy "Users read their own unit attempt counters"
  on unit_attempt_limits for select
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 3. Incremento — SECURITY DEFINER, upsert atómico. El cliente
--    dispara el evento "terminé la unidad"; nunca decide ni escribe
--    el número directamente.
-- ============================================================

create or replace function increment_unit_attempt(p_book_id text, p_unit_number int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_count int;
begin
  insert into unit_attempt_limits (user_id, book_id, unit_number, attempts_used)
  values (auth.uid(), p_book_id, p_unit_number, 1)
  on conflict (user_id, book_id, unit_number)
  do update set attempts_used = unit_attempt_limits.attempts_used + 1, updated_at = now()
  returning attempts_used into v_new_count;

  return v_new_count;
end;
$$;

grant execute on function increment_unit_attempt(text, int) to authenticated;

-- ============================================================
-- 4. Reinicio administrativo — dos pasos, confirmado con el
--    usuario: reinicia el contador de esta tabla Y libera los
--    ejercicios de esa unidad en worksheet_exercise_attempts.
--    Elimina el historial de esa unidad a propósito (decisión
--    explícita, Atlas v1).
-- ============================================================

-- update unit_attempt_limits set attempts_used = 0
-- where user_id = '<uuid del estudiante>' and book_id = '<book_id>' and unit_number = <N>;

-- delete from worksheet_exercise_attempts
-- where user_id = '<uuid del estudiante>' and book_id = '<book_id>' and unit_number = <N>;
