/**
 * writing-response/writing-response-contract.js
 *
 * Capacidad de infraestructura para Writing — mismo patrón contrato +
 * adapter que el resto del proyecto. `getEntry` nunca lanza: ante
 * cualquier fallo, el estudiante simplemente ve el área de escritura
 * vacía (degradación segura) en vez de una pantalla rota — nunca
 * texto fabricado. `saveEntry` sí propaga su resultado, porque el
 * indicador "✓ Saved automatically" necesita saber si el guardado
 * realmente ocurrió.
 */

export function createWritingResponseService(adapter, errorBoundary) {
  async function getEntry({ userId, bookId, unitNumber, accessToken }) {
    try {
      const entry = await adapter.getEntry({ userId, bookId, unitNumber, accessToken });
      return entry ?? null;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'writing-response-read-failed', userId, bookId, unitNumber, err: String(err) });
      return null;
    }
  }

  async function saveEntry({ userId, bookId, unitNumber, responseText, accessToken }) {
    try {
      await adapter.saveEntry({ userId, bookId, unitNumber, responseText, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'writing-response-save-failed', userId, bookId, unitNumber, err: String(err) });
      return false;
    }
  }

  return Object.freeze({ getEntry, saveEntry });
}
