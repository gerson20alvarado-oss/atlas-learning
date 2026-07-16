/**
 * domain/contracts/attempt-shape.js
 *
 * Forma de la entidad Attempt (Software Architecture §4.2, §15.2):
 * "lo que el estudiante hizo", nunca "lo que el libro es" — vive en
 * Persistence (domain/learning-data/attempt-repository.js), nunca en
 * domain/content junto al contenido publicado.
 *
 * Append-only por diseño (Software Architecture §11.4: los datos de
 * aprendizaje se fusionan por adición, nunca se sobrescriben) —
 * ningún Attempt se edita después de creado. Error Record (Sprint 5
 * Plan, decisión aprobada) es una vista derivada de esta colección
 * filtrada por `isCorrect === false`, nunca una segunda entidad
 * persistida — evita una segunda fuente de verdad que pueda
 * desincronizarse (mismo principio que ya rige Progress, §15.2).
 */

const REQUIRED_ATTEMPT_KEYS = Object.freeze([
  'id',
  'exerciseId',
  'lessonId',
  'response',
  'isCorrect',
  'timestamp',
]);

export function isValidAttemptShape(candidate) {
  return (
    Boolean(candidate) &&
    typeof candidate === 'object' &&
    REQUIRED_ATTEMPT_KEYS.every((key) => key in candidate)
  );
}

export { REQUIRED_ATTEMPT_KEYS };
