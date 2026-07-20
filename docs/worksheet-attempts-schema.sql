-- Intentos de ejercicios de worksheet (American Language Hub) —
-- exclusivo de libros con contentMode: 'worksheet'. Hi! Korean usa
-- su propio AttemptRepository, sin ninguna relación con esta tabla.

create table if not exists worksheet_exercise_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null,
  unit_number int not null,
  exercise_id text not null,
  response jsonb not null,
  result jsonb not null,        -- salida de validate(): [{itemId, isCorrect}, ...]
  attempts_used int not null default 0,
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
