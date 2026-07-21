-- Atlas Learning — Recordar la última actividad dentro de una unidad
-- (American Language Hub). Ejecutar completo en el SQL Editor.
--
-- Aditivo, nullable: Hi! Korean nunca escribe este campo (su propia
-- llamada a savePosition en page-reader-screen.js no cambia — no se
-- tocó ese archivo), así que sus filas siguen con `last_activity =
-- null` para siempre, exactamente como si la columna no existiera
-- para ese producto.
--
-- Nombre deliberado (no "activity_id"): no es una referencia al
-- sistema de Assessment — es "dónde estaba el estudiante por última
-- vez", concepto que ya cubre hoy 'writing'/'worksheet'/
-- 'progress-test' y mañana podría cubrir 'speaking'/'journal'/
-- cualquier actividad futura, sin volver a tocar el nombre de la
-- columna.

alter table reader_positions
  add column if not exists last_activity text;
