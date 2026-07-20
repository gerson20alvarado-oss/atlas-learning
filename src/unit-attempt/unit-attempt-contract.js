/**
 * unit-attempt/unit-attempt-contract.js
 *
 * Capacidad de infraestructura de intentos por unidad. `getAttemptsUsed`
 * nunca lanza: ante cualquier fallo, se asume 0 (degradación segura
 * hacia "todavía puede intentarlo") — nunca hacia "ya no puede",
 * porque un fallo de lectura no debería bloquear a un estudiante que
 * de hecho sí tiene intentos disponibles.
 */

export function createUnitAttemptService(adapter, errorBoundary) {
  async function getAttemptsUsed({ userId, bookId, unitNumber, accessToken }) {
    try {
      return await adapter.getAttemptsUsed({ userId, bookId, unitNumber, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'unit-attempt-read-failed', userId, bookId, unitNumber, err: String(err) });
      return 0;
    }
  }

  async function incrementAttempt({ bookId, unitNumber, accessToken }) {
    try {
      return await adapter.incrementAttempt({ bookId, unitNumber, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'unit-attempt-increment-failed', bookId, unitNumber, err: String(err) });
      return null;
    }
  }

  return Object.freeze({ getAttemptsUsed, incrementAttempt });
}
