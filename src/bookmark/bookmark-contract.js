/**
 * bookmark/bookmark-contract.js
 *
 * Capacidad de infraestructura para leer, añadir y quitar
 * Marcadores — a diferencia de LibraryAccess (solo lectura,
 * administrada externamente), esta es la primera entidad remota de
 * esta sesión que el propio estudiante escribe en tiempo real. Mismo
 * patrón contrato + adapter que el resto de la infraestructura
 * remota del proyecto.
 *
 * Tres operaciones, ninguna más de las que el Sprint Proposal ya
 * definió: listar los Marcadores de un libro, añadir uno, quitar
 * uno. `add` es idempotente (marcar dos veces la misma página no
 * duplica) — responsabilidad del adapter (upsert), no de quien
 * consume esta capacidad.
 */

export function createBookmarkService(adapter, errorBoundary) {
  async function list({ userId, bookId, accessToken }) {
    try {
      const pageNumbers = await adapter.list({ userId, bookId, accessToken });
      return pageNumbers ?? [];
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'bookmark-list-failed', userId, bookId, err: String(err) });
      return [];
    }
  }

  async function add({ userId, bookId, pageNumber, accessToken }) {
    try {
      await adapter.add({ userId, bookId, pageNumber, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'bookmark-add-failed', userId, bookId, pageNumber, err: String(err) });
      return false;
    }
  }

  async function remove({ userId, bookId, pageNumber, accessToken }) {
    try {
      await adapter.remove({ userId, bookId, pageNumber, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'bookmark-remove-failed', userId, bookId, pageNumber, err: String(err) });
      return false;
    }
  }

  /** Admin Console (Sprint 14) — nunca lanza: ante fallo, lista vacía. */
  async function listForUser({ userId, accessToken }) {
    try {
      const rows = await adapter.listForUser({ userId, accessToken });
      return rows ?? [];
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'bookmark-list-for-user-failed', userId, err: String(err) });
      return [];
    }
  }

  return Object.freeze({ list, add, remove, listForUser });
}
