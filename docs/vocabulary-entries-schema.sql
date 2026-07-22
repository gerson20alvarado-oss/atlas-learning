-- Atlas Learning — My Vocabulary (American Language Hub)
-- Ejecutar completo en el SQL Editor de Supabase.
--
-- Tabla nueva, aislada por completo del resto del sistema: sin
-- relación con unit_attempt_limits, worksheet_exercise_attempts,
-- writing_responses, reader_positions, ni ninguna otra tabla. Un
-- cuaderno de vocabulario 100% personal del estudiante, sin efecto
-- sobre progreso, evaluación ni contenido editorial.
--
-- Contrato conceptual (aprobado antes de esta implementación):
-- una entrada pertenece a un usuario, a un libro y a una unidad de
-- forma permanente — "editar" nunca reasigna unidad ni libro, solo
-- el texto. Sin duplicados dentro de la misma unidad (la misma
-- palabra sí puede existir en unidades distintas). Sobrevive a la
-- revocación de una licencia, igual que el resto de los datos
-- personales del estudiante.

create table if not exists vocabulary_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  book_id     text not null,
  unit_number int not null,
  term        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Sin duplicados dentro de la misma unidad (decisión de producto
  -- ya cerrada). Se compara sobre una versión normalizada
  -- (minúsculas, espacios externos recortados) para que "Run" y
  -- "run " no cuenten como entradas distintas — la normalización
  -- exacta es una decisión de implementación, no del contrato
  -- conceptual, resuelta aquí con lower(trim(...)).
  constraint vocabulary_entries_unique_term_per_unit
    unique (user_id, book_id, unit_number, term)
);

-- Índice funcional sobre el término normalizado — es lo que
-- realmente hace cumplir "sin duplicados" de forma robusta frente a
-- mayúsculas/espacios; la constraint UNIQUE de arriba sola no lo
-- lograría por sí misma si el texto llega con distinta capitalización.
create unique index if not exists vocabulary_entries_unique_normalized_term
  on vocabulary_entries (user_id, book_id, unit_number, lower(trim(term)));

alter table vocabulary_entries enable row level security;

-- RLS: el estudiante solo lee/escribe/borra su propio vocabulario.
-- Primera capacidad personal de Atlas que necesita DELETE real desde
-- el cliente además de select/insert/update (Bookmarks es el único
-- precedente — Writing/ReaderPosition nunca lo necesitaron, son "un
-- solo valor que se sobrescribe", nunca "una fila que desaparece").

create policy "Users read their own vocabulary entries"
  on vocabulary_entries for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users create their own vocabulary entries"
  on vocabulary_entries for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update their own vocabulary entries"
  on vocabulary_entries for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete their own vocabulary entries"
  on vocabulary_entries for delete
  to authenticated
  using (auth.uid() = user_id);
