/**
 * domain/contracts/session-shape.js
 *
 * Forma de la entidad Session (Software Architecture §4.2, §14.2):
 * "the live, resumable state of one continuous act of studying" —
 * posición Book/Unit/Lesson, sección activa, scroll, y los puntos de
 * extensión reservados para Exercise (Sprint 5) y audio (cuando exista
 * un asset real de Media tipo audio).
 *
 * Mismo criterio que entity-shapes.js: la forma se declara COMPLETA
 * desde ahora — incluidos campos que hoy solo pueden valer `null`
 * (currentExercise, currentAudio) — para que Sprint 5 y la futura
 * llegada de audio real solo necesiten empezar a poblarlos, nunca
 * rediseñar el esquema ni romper compatibilidad con Sessions ya
 * persistidas (Sprint 4 Plan; Software Architecture §10.4, §14.3).
 *
 * `mode` reserva el valor 'learn' desde ahora; 'review' se añadirá
 * cuando Review Mode exista (Sprint 5+, Design System §18, WR P8) —
 * no es un campo nuevo entonces, es el mismo campo con un segundo
 * valor válido.
 */

const SESSION_KEYS = Object.freeze([
  'bookId',
  'unitId',
  'lessonId',
  'mode',
  'sectionIndex',
  'scrollPosition',
  'currentExercise',
  'currentAudio',
  'updatedAt',
]);

/**
 * Session vacía: la instancia "sin sesión todavía" — un estudiante
 * que nunca empezó a estudiar, o que acaba de terminar una lección
 * (ver session-repository.js, clearSession). No es un caso especial:
 * es la misma forma, con todos los campos en `null`.
 */
export function createEmptySession() {
  return Object.freeze({
    bookId: null,
    unitId: null,
    lessonId: null,
    mode: null,
    sectionIndex: null,
    scrollPosition: null,
    currentExercise: null, // reservado — Exercise Engine, Roadmap Phase 5
    currentAudio: null, // reservado — Media tipo audio, cuando exista un asset real
    updatedAt: null,
  });
}

/**
 * Valida la forma exacta de una Session — ni campos de menos (una
 * Session parcial no es restaurable con exactitud, C7) ni campos de
 * más (un campo no declarado aquí no pertenece a este contrato).
 */
export function isValidSessionShape(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  const candidateKeys = Object.keys(candidate);
  return (
    SESSION_KEYS.every((key) => key in candidate) &&
    candidateKeys.every((key) => SESSION_KEYS.includes(key))
  );
}

export { SESSION_KEYS };
