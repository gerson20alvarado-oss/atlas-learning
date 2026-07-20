/**
 * worksheet-attempt/worksheet-attempt-contract.js
 *
 * Capacidad de infraestructura para leer y guardar intentos de
 * ejercicios de worksheet — mismo patrón contrato + adapter que
 * `bookmark-contract.js`. `getAttemptsForUnit` nunca lanza: ante
 * cualquier fallo, el estudiante simplemente ve la worksheet sin
 * intentos previos (degradación segura, mismo criterio que el resto
 * de Atlas) en vez de una pantalla rota.
 */

export function createWorksheetAttemptService(adapter, errorBoundary) {
  async function getAttemptsForUnit({ userId, bookId, unitNumber, accessToken }) {
    try {
      const rows = await adapter.getAttemptsForUnit({ userId, bookId, unitNumber, accessToken });
      return rows ?? [];
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'worksheet-attempts-read-failed', userId, bookId, unitNumber, err: String(err) });
      return [];
    }
  }

  async function saveAttempt(params) {
    try {
      await adapter.saveAttempt(params);
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'worksheet-attempt-save-failed', ...params, err: String(err) });
      return false;
    }
  }

  return Object.freeze({ getAttemptsForUnit, saveAttempt });
}
