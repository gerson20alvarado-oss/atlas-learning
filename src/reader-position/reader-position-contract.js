/**
 * reader-position/reader-position-contract.js
 *
 * ReaderPosition, Supabase como única fuente de verdad (decisión de
 * esta sesión): a diferencia de todo lo demás en Atlas hasta hoy,
 * esta entidad deliberadamente NO tiene una capa local — ni caché,
 * ni fallback, ni reconciliación. Leer significa preguntarle a
 * Supabase; guardar significa escribir en Supabase. Si la red falla,
 * la operación falla — no hay ningún estado local al que degradar,
 * porque local dejó de ser una fuente válida para este dato en
 * particular (el resto de Atlas sigue sin cambios).
 *
 * Dos operaciones, tan simple como el objetivo lo permite:
 * `getPosition` (una posición por usuario+libro, o `null` si nunca
 * hubo ninguna) y `savePosition` (upsert — la posición es un único
 * estado vigente, no un historial).
 */

export function createReaderPositionService(adapter, errorBoundary) {
  async function getPosition({ userId, bookId, accessToken }) {
    try {
      const position = await adapter.getPosition({ userId, bookId, accessToken });
      return position ?? null;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'reader-position-read-failed', userId, bookId, err: String(err) });
      return undefined;
    }
  }

  async function savePosition({ userId, bookId, pageNumber, lastActivity, accessToken }) {
    try {
      await adapter.savePosition({ userId, bookId, pageNumber, lastActivity, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'reader-position-save-failed', userId, bookId, pageNumber, err: String(err) });
      return false;
    }
  }

  /**
   * La posición más reciente del estudiante, entre todos sus libros
   * — necesaria para "Continuar" en Home, que no sabe de antemano
   * qué libro fue el último (a diferencia de getPosition, que ya
   * conoce el libro porque el estudiante lo eligió en Library).
   */
  async function getMostRecentPosition({ userId, accessToken }) {
    try {
      const position = await adapter.getMostRecentPosition({ userId, accessToken });
      return position ?? null;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'reader-position-most-recent-failed', userId, err: String(err) });
      return undefined;
    }
  }

  /** Admin Console (Sprint 14) — nunca lanza: ante fallo, lista vacía. */
  async function listForUser({ userId, accessToken }) {
    try {
      const rows = await adapter.listForUser({ userId, accessToken });
      return rows ?? [];
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'reader-position-list-failed', userId, err: String(err) });
      return [];
    }
  }

  /** Admin Console (Sprint 14) — sí propaga éxito/fallo. */
  async function resetPosition({ userId, bookId, accessToken }) {
    try {
      await adapter.resetPosition({ userId, bookId, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'reader-position-reset-failed', userId, bookId, err: String(err) });
      return false;
    }
  }

  return Object.freeze({ getPosition, savePosition, getMostRecentPosition, listForUser, resetPosition });
}
