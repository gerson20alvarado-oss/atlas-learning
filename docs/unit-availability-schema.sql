-- Atlas Learning — Disponibilidad de Unidades (dominio Acceso)
-- Ejecutar completo en el SQL Editor de Supabase.
--
-- Decisión de modelo deliberada: esta tabla guarda las unidades
-- DESHABILITADAS, nunca las habilitadas. Esto garantiza el
-- comportamiento por defecto ya acordado en la especificación
-- funcional — "un libro sin ninguna configuración debe comportarse
-- como todo habilitado" — sin necesitar ningún caso especial en el
-- código: la ausencia de una fila para (book_id, unit_number) YA
-- significa "habilitada", de forma natural.
--
-- Global, no por usuario (a diferencia de toda otra tabla de Atlas
-- hasta ahora): la disponibilidad de una unidad es la misma para
-- todos los estudiantes — es una decisión del administrador, no un
-- dato personal.
--
-- Dominio Acceso, nunca Contenido: esta tabla no describe qué es una
-- unidad ni qué contiene — solo si está permitido llegar a ella,
-- misma familia de decisión que license_keys.

create table if not exists disabled_units (
  book_id     text not null,
  unit_number int not null,
  disabled_at timestamptz not null default now(),
  primary key (book_id, unit_number)
);

alter table disabled_units enable row level security;

-- Lectura: cualquier usuario autenticado necesita poder consultar
-- esto para navegar correctamente (Library, navegación rápida,
-- reanudación) — no es un dato administrativo oculto, es parte de
-- cómo se resuelve qué mostrarle a cualquier estudiante.
create policy "Authenticated users can read disabled units"
  on disabled_units for select
  to authenticated
  using (true);

-- Escritura: solo administradores — reutiliza is_admin(), ya
-- existente desde Admin Console (docs/admin-console-schema.sql),
-- sin duplicar ni modificar esa función.
create policy "Admins can insert disabled units"
  on disabled_units for insert
  to authenticated
  with check (is_admin());

create policy "Admins can delete disabled units"
  on disabled_units for delete
  to authenticated
  using (is_admin());
