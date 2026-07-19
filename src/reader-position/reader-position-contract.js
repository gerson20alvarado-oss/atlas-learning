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

  async function savePosition({ userId, bookId, pageNumber, accessToken }) {
    try {
      await adapter.savePosition({ userId, bookId, pageNumber, accessToken });
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

  return Object.freeze({ getPosition, savePosition, getMostRecentPosition });
}
