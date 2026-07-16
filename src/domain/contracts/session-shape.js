/**
 * domain/contracts/session-shape.js
 *
 * Forma de la entidad Session (Software Architecture §4.2, §14.2):
 * "the live, resumable state of one continuous act of studying" —
 * posición Book/Unit/Lesson, sección activa, scroll, y el punto de
 * extensión reservado para audio (cuando exista un asset real de
 * Media tipo audio).
 *
 * CORRECCIÓN (Sprint 5 Plan, decisión #5): Sprint 4 reservó aquí un
 * campo `currentExercise` asumiendo un único ejercicio activo a la
 * vez. Al diseñar el Exercise Engine se confirmó que el Session
 * Container ya renderiza TODOS los bloques de una Section juntos
 * (§18.1) — una Section puede tener varios `practice` a la vez, cada
 * uno en su propio estado. Restaurar eso con un puntero singular no
 * alcanza, y mantenerlo habría sido persistir información duplicada
 * sin necesidad. Se eliminó: el estado de cada ejercicio (respondido
 * o no, y con qué resultado) se deriva consultando los Attempts ya
 * registrados para esa Lesson (domain/learning-data/attempt-
 * repository.js) — la misma filosofía "derivado, nunca duplicado"
 * que ya rige Progress (§15.2). `currentAudio` no se ve afectado por
 * este cambio — sigue reservado para cuando exista un asset real.
 *
 * Compatibilidad: una Session ya persistida por un Sprint 4 real
 * (con la clave `currentExercise` todavía presente) deja de cumplir
 * `isValidSessionShape` (chequeo exhaustivo de claves) y
 * session-repository.js la trata como cualquier forma inválida — se
 * degrada a `null` (mismo criterio que content-repository.js aplica
 * a contenido inválido), nunca se rompe. No hace falta ninguna
 * migración explícita.
 */

const SESSION_KEYS = Object.freeze([
  'bookId',
  'unitId',
  'lessonId',
  'mode',
  'sectionIndex',
  'scrollPosition',
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
