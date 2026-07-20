/**
 * license/license-contract.js
 *
 * Capacidad de infraestructura de licencias — mismo patrón contrato
 * + adapter que el resto del proyecto. `getActiveBookIds` nunca
 * lanza: ante cualquier fallo, el usuario simplemente ve una
 * Biblioteca vacía (degradación segura) en vez de una pantalla rota
 * — nunca una lista fabricada. `activate` sí propaga su resultado
 * estructurado ({ success, book_id, reason }) tal cual lo devuelve
 * la función de Postgres — es información que el usuario necesita
 * ver, no un detalle de infraestructura que ocultar.
 */

export function createLicenseService(adapter, errorBoundary) {
  async function getActiveBookIds({ userId, accessToken }) {
    try {
      return await adapter.getActiveBookIds({ userId, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'license-read-failed', userId, err: String(err) });
      return [];
    }
  }

  async function activate({ keyCode, accessToken }) {
    try {
      return await adapter.activate({ keyCode, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'license-activate-failed', err: String(err) });
      return { success: false, book_id: null, reason: 'network_error' };
    }
  }

  return Object.freeze({ getActiveBookIds, activate });
}
