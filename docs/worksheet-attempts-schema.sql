-- Estado de ejercicios de worksheet (American Language Hub) —
-- exclusivo de libros con contentMode: 'worksheet'. Hi! Korean usa
-- su propio AttemptRepository, sin ninguna relación con esta tabla.
--
-- Simplificado (decisión de producto cerrada): esta tabla ya NO
-- controla intentos — solo guarda qué respondió el estudiante y qué
-- resultado obtuvo. El único control de intentos real es
-- unit_attempt_limits (ver docs/unit-attempt-limits-schema.sql),
-- 2 intentos por unidad, nunca por ejercicio.

create table if not exists worksheet_exercise_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null,
  unit_number int not null,
  exercise_id text not null,
  response jsonb not null,
  result jsonb not null,        -- salida de validate(): [{itemId, isCorrect}, ...]
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id, unit_number, exercise_id)
);

alter table worksheet_exercise_attempts enable row level security;

create policy "Users read their own worksheet attempts"
  on worksheet_exercise_attempts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users write their own worksheet attempts"
  on worksheet_exercise_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update their own worksheet attempts"
  on worksheet_exercise_attempts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Migración (decisión de producto cerrada): eliminar por completo
-- la columna attempts_used de tu tabla ya existente en Supabase —
-- sin ella, no queda ningún control de intentos por ejercicio, ni
-- código muerto ni columna sin uso.
-- ============================================================

alter table worksheet_exercise_attempts drop column if exists attempts_used;

-- ============================================================
-- Start New Attempt (esta sesión): el estudiante necesita poder
-- borrar sus propias filas de esta unidad para empezar de nuevo sin
-- intervención administrativa. Sin esta política, no existía forma
-- de que el cliente hiciera ese DELETE en absoluto.
-- ============================================================

create policy "Users delete their own worksheet attempts"
  on worksheet_exercise_attempts for delete
  to authenticated
  using (auth.uid() = user_id);
