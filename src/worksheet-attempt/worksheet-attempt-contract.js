/**
 * worksheet-attempt/worksheet-attempt-contract.js
 *
 * Capacidad de infraestructura para leer y guardar el estado de
 * ejercicios de evaluación (respuesta, resultado) — mismo patrón
 * contrato + adapter que `bookmark-contract.js`. No controla
 * intentos, solo guarda qué respondió el estudiante y qué resultado
 * obtuvo. `getAttemptsForUnit` nunca lanza: ante cualquier fallo, el
 * estudiante simplemente ve la evaluación sin estado previo
 * (degradación segura) en vez de una pantalla rota.
 *
 * Evoluciones independientes por unidad (esta sesión): `assessmentId`
 * viaja en cada método, con default `'worksheet'` — mismo servicio,
 * ahora capaz de aislar el estado de cualquier evaluación de la
 * unidad de las demás.
 */

export function createWorksheetAttemptService(adapter, errorBoundary) {
  async function getAttemptsForUnit({ userId, bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    try {
      const rows = await adapter.getAttemptsForUnit({ userId, bookId, unitNumber, assessmentId, accessToken });
      return rows ?? [];
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'worksheet-attempts-read-failed', userId, bookId, unitNumber, assessmentId, err: String(err) });
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

  async function deleteAttemptsForUnit({ userId, bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    try {
      await adapter.deleteAttemptsForUnit({ userId, bookId, unitNumber, assessmentId, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'worksheet-attempts-delete-failed', userId, bookId, unitNumber, assessmentId, err: String(err) });
      return false;
    }
  }

  return Object.freeze({ getAttemptsForUnit, saveAttempt, deleteAttemptsForUnit });
}
