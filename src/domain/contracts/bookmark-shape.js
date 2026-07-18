/**
 * domain/contracts/bookmark-shape.js
 *
 * Forma de un Bookmark (Sprint Proposal — Nuevo Reader, §4): una
 * página que el estudiante marcó dentro de un libro. Colección
 * simple — `{ bookId, pageNumber, userId }`, sin campos adicionales
 * hasta que la evidencia de uso real pida más (Progressive
 * Complexity, mismo criterio ya aplicado a LibraryAccess).
 */

const BOOKMARK_KEYS = Object.freeze(['bookId', 'pageNumber', 'userId']);

export function isValidBookmarkShape(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  const candidateKeys = Object.keys(candidate);
  return (
    BOOKMARK_KEYS.every((key) => key in candidate) &&
    candidateKeys.every((key) => BOOKMARK_KEYS.includes(key)) &&
    typeof candidate.bookId === 'string' &&
    Number.isInteger(candidate.pageNumber) &&
    typeof candidate.userId === 'string'
  );
}

export { BOOKMARK_KEYS };
