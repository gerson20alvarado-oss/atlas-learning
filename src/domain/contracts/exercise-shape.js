/**
 * domain/contracts/exercise-shape.js
 *
 * Forma de la entidad Exercise (Software Architecture §6.2, §4.4:
 * "Content Block 0—1 Exercise, solo los bloques 'practice' llevan
 * uno"). Exercise es la clave de corrección de un ejercicio — "lo
 * que el libro es", nunca "lo que el estudiante hizo" (eso es
 * Attempt, ver attempt-shape.js). Por eso vive como dato publicado
 * junto al resto del contenido (domain/content/exercise-catalog.js),
 * igual que Book/Unit/Lesson — no en Persistence.
 *
 * Deliberadamente genérico: ningún campo aquí nombra una materia,
 * idioma o libro. Un Exercise de matemáticas y uno de coreano son
 * estructuralmente idénticos para este contrato (Sprint 5 Plan,
 * punto "cómo evitarás acoplar el motor a Hi! Korean").
 *
 * Tres tipos para MVP (Design System §17.3–17.5, PRD §23) — cerrado
 * pero extensible (§6.3/§17.6: un tipo nuevo no debe tocar Session,
 * Progress ni Error Record, solo añadir una nueva implementación del
 * contrato compartido). "matching", "ordering", "listening" (PRD
 * §24, Should Have v1.x) NO se implementan en Sprint 5 — ver
 * exercise-catalog.js para dónde quedan documentados como pendientes.
 */

const EXERCISE_REQUIRED_FIELDS_BY_TYPE = Object.freeze({
  multipleChoice: ['options', 'correctOptionId'],
  fillBlank: ['acceptedAnswers'],
  typing: ['acceptedAnswers'],
});

const REQUIRED_EXERCISE_KEYS = Object.freeze(['id', 'type']);

function hasShape(candidate, keys) {
  return Boolean(candidate) && typeof candidate === 'object' && keys.every((key) => key in candidate);
}

export function isValidExerciseShape(candidate) {
  if (!hasShape(candidate, REQUIRED_EXERCISE_KEYS)) return false;
  const typeFields = EXERCISE_REQUIRED_FIELDS_BY_TYPE[candidate.type];
  if (!typeFields) return false;
  return typeFields.every((key) => key in candidate);
}

export { EXERCISE_REQUIRED_FIELDS_BY_TYPE };
