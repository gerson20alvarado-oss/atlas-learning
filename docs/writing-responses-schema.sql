-- Atlas Learning — Writing
-- Ejecutar completo en el SQL Editor de Supabase.
--
-- Tabla nueva, aislada por completo del sistema de Assessment: sin
-- relación alguna con unit_attempt_limits ni
-- worksheet_exercise_attempts, sin assessment_id, sin intentos, sin
-- calificación. Un único texto vigente por (usuario, libro, unidad)
-- — mismo criterio que reader_positions: no es un historial, es el
-- estado actual, que se sobrescribe con cada autoguardado.

create table if not exists writing_responses (
  user_id       uuid not null references auth.users(id) on delete cascade,
  book_id       text not null,
  unit_number   int not null,
  response_text text not null default '',
  updated_at    timestamptz not null default now(),
  primary key (user_id, book_id, unit_number)
);

alter table writing_responses enable row level security;

-- RLS: el estudiante solo lee/escribe su propio texto. Sin política
-- de DELETE — no existe "borrar" en este modelo, solo sobrescribir
-- (autoguardado); un texto vacío es un response_text = '' válido,
-- nunca la ausencia de la fila.

create policy "Users read their own writing responses"
  on writing_responses for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users create their own writing responses"
  on writing_responses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update their own writing responses"
  on writing_responses for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
