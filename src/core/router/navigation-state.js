/**
 * core/router/navigation-state.js
 *
 * Forma de la Navigation State (Sprint 1 Plan §9.3; Software
 * Architecture §16.2–16.3). Jerárquica y colección-shaped desde el
 * día uno: ningún campo representa "el libro actual" como singleton
 * (C8), y la forma misma hace inexpresable saltar un nivel de la
 * jerarquía Library → Book → Unit → Lesson → Section.
 *
 * En Sprint 1 no hay datos de dominio reales — todos los campos
 * quedan en null casi siempre — pero Sprint 2+ solo necesita empezar
 * a poblar esta forma, nunca rediseñarla.
 */

const NAVIGATION_STATE_KEYS = Object.freeze([
  'libraryPosition',
  'bookPosition',
  'unitPosition',
  'lessonPosition',
  'mode',
]);

export function createEmptyNavigationState() {
  return Object.freeze({
    libraryPosition: null,
    bookPosition: null,
    unitPosition: null,
    lessonPosition: null,
    mode: null,
  });
}

/**
 * Valida que un objeto tenga exactamente la forma esperada — usado
 * por el router para no publicar nunca un estado con estructura
 * inválida. Defensa en profundidad, no solo convención de código.
 */
export function isValidNavigationState(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  const candidateKeys = Object.keys(candidate);
  return (
    NAVIGATION_STATE_KEYS.every((key) => key in candidate) &&
    candidateKeys.every((key) => NAVIGATION_STATE_KEYS.includes(key))
  );
}
