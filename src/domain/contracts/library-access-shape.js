/**
 * domain/contracts/library-access-shape.js
 *
 * Forma de la entidad LibraryAccess: la relación `userId →
 * authorizedBookIds` (Control de Acceso por Libro, diseño cerrado
 * antes de este sprint). Mismo criterio de validación estricta que
 * session-shape.js — ni campos de menos ni campos de más.
 *
 * Frontera arquitectónica ya cerrada: esta relación es un dominio
 * propio, hermano de Session, nunca parte de Auth (que solo resuelve
 * identidad) ni del Content Model (que no sabe que la autorización
 * existe). La autorización controla únicamente la visibilidad del
 * contenido, nunca la propiedad del progreso — Session, Attempts y
 * Progress no se validan ni se tocan desde este contrato.
 */

const LIBRARY_ACCESS_KEYS = Object.freeze(['userId', 'authorizedBookIds']);

/**
 * LibraryAccess vacío: la instancia "sin libros autorizados todavía"
 * — mismo criterio que createEmptySession()/createEmptyLibrary(), no
 * un caso especial. Es también el resultado seguro por defecto ante
 * un fallo de verificación (degradar a "sin libros" es más seguro
 * que degradar a "todos los libros").
 */
export function createEmptyLibraryAccess(userId) {
  return Object.freeze({ userId, authorizedBookIds: [] });
}

export function isValidLibraryAccessShape(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  const candidateKeys = Object.keys(candidate);
  return (
    LIBRARY_ACCESS_KEYS.every((key) => key in candidate) &&
    candidateKeys.every((key) => LIBRARY_ACCESS_KEYS.includes(key)) &&
    typeof candidate.userId === 'string' &&
    Array.isArray(candidate.authorizedBookIds) &&
    candidate.authorizedBookIds.every((id) => typeof id === 'string')
  );
}

export { LIBRARY_ACCESS_KEYS };
