/**
 * worksheet-attempt/worksheet-attempt-contract.js
 *
 * Capacidad de infraestructura para leer y guardar el estado de
 * ejercicios de worksheet (respuesta, resultado) — mismo patrón
 * contrato + adapter que `bookmark-contract.js`. Simplificado (esta
 * sesión): ya no controla intentos, solo guarda qué respondió el
 * estudiante y qué resultado obtuvo. `getAttemptsForUnit` nunca
 * lanza: ante cualquier fallo, el estudiante simplemente ve la
 * worksheet sin estado previo (degradación segura) en vez de una
 * pantalla rota.
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

  async function deleteAttemptsForUnit({ userId, bookId, unitNumber, accessToken }) {
    try {
      await adapter.deleteAttemptsForUnit({ userId, bookId, unitNumber, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'worksheet-attempts-delete-failed', userId, bookId, unitNumber, err: String(err) });
      return false;
    }
  }

  return Object.freeze({ getAttemptsForUnit, saveAttempt, deleteAttemptsForUnit });
}
