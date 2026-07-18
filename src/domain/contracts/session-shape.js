/**
 * domain/contracts/session-shape.js
 *
 * Evolución a ReaderPosition (Technical Specification — Reader como
 * Lector de PDF v2.1, §5.1): esta entidad deja de representar una
 * posición dentro del Content Model (Book/Unit/Lesson/Section) y pasa
 * a representar una posición dentro del PDF — la última página
 * visitada de un libro, nada más. El nombre del archivo y de las
 * funciones se conserva (`session-shape.js`, `createEmptySession`,
 * `isValidSessionShape`) a propósito, para no obligar a tocar el
 * resto del proyecto en esta etapa — es el mismo contrato, con una
 * forma nueva.
 *
 * `unitId`, `lessonId`, `mode`, `sectionIndex`, `scrollPosition` y
 * `currentAudio` se retiran del contrato. Eso no elimina Unit/Lesson/
 * Section del Content Model — siguen existiendo con su rol
 * pedagógico intacto (fuente del Exercise Engine). Simplemente dejan
 * de ser necesarios para expresar "dónde estaba leyendo el
 * estudiante".
 *
 * Sin migración (decisión de Producto, ya aprobada): una Session
 * persistida con la forma anterior no pasa `isValidSessionShape` —
 * se trata como inexistente, exactamente igual que un estudiante
 * nuevo. No hay código de traducción de una forma a la otra; el
 * propio mecanismo de validación estricta ya existente (rechaza
 * campos de más y de menos) es, por sí solo, todo el mecanismo de
 * reinicialización que hace falta.
 *
 * `userId` (Sprint 6): metadato de propiedad, sin cambios de
 * semántica — Session huérfana (`null`), propia o ajena. `updatedAt`
 * se conserva: sigue siendo lo que account-linking-flow.js usa para
 * decidir cuál de dos ReaderPosition (local vs. remota) es más
 * reciente al fusionar cuentas.
 */

const SESSION_KEYS = Object.freeze(['bookId', 'pageNumber', 'userId', 'updatedAt']);

/**
 * ReaderPosition vacía: "sin nada que continuar todavía" — un
 * estudiante nuevo, o uno que acaba de terminar de leer (ver
 * session-repository.js, clearSession). No es un caso especial: es
 * la misma forma, con todos los campos en `null`.
 */
export function createEmptySession() {
  return Object.freeze({
    bookId: null,
    pageNumber: null,
    userId: null, // huérfana hasta que una vinculación de cuenta la reclame
    updatedAt: null,
  });
}

/**
 * Valida la forma exacta de una ReaderPosition — ni campos de menos
 * ni campos de más. Una Session con la forma anterior (unitId,
 * lessonId, sectionIndex...) falla aquí, a propósito — es el
 * mecanismo completo de "sin migración" ya aprobado.
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
