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

  /** Admin Console (Sprint 14) — nunca lanza: ante fallo, lista vacía. */
  async function listAll({ accessToken }) {
    try {
      const rows = await adapter.listAll({ accessToken });
      return rows ?? [];
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'license-list-all-failed', err: String(err) });
      return [];
    }
  }

  /** Admin Console (Sprint 14) — sí propaga éxito/fallo: la consola necesita saber si guardó. */
  async function setStatus({ licenseId, status, accessToken }) {
    try {
      await adapter.setStatus({ licenseId, status, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'license-set-status-failed', licenseId, status, err: String(err) });
      return false;
    }
  }

  /** Admin Console (Sprint 14) — nunca lanza: ante fallo, 0. */
  async function countByStatus({ status, accessToken }) {
    try {
      return await adapter.countByStatus({ status, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'license-count-failed', status, err: String(err) });
      return 0;
    }
  }

  return Object.freeze({ getActiveBookIds, activate, listAll, setStatus, countByStatus });
}
