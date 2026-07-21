/**
 * unit-attempt/unit-attempt-contract.js
 *
 * Capacidad de infraestructura de intentos por unidad. `getAttemptsUsed`
 * nunca lanza: ante cualquier fallo, se asume 0 (degradación segura
 * hacia "todavía puede intentarlo") — nunca hacia "ya no puede",
 * porque un fallo de lectura no debería bloquear a un estudiante que
 * de hecho sí tiene intentos disponibles.
 *
 * Evoluciones independientes por unidad (esta sesión): `assessmentId`
 * viaja en cada método, con default `'worksheet'` — mismo servicio,
 * ahora capaz de llevar el conteo de cualquier evaluación de la
 * unidad (Worksheet, Progress Test, futuras) sin que ninguna
 * interfiera con las demás.
 */

export function createUnitAttemptService(adapter, errorBoundary) {
  async function getAttemptsUsed({ userId, bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    try {
      return await adapter.getAttemptsUsed({ userId, bookId, unitNumber, assessmentId, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'unit-attempt-read-failed', userId, bookId, unitNumber, assessmentId, err: String(err) });
      return 0;
    }
  }

  async function incrementAttempt({ bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    try {
      return await adapter.incrementAttempt({ bookId, unitNumber, assessmentId, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'unit-attempt-increment-failed', bookId, unitNumber, assessmentId, err: String(err) });
      return null;
    }
  }

  /** Admin Console — nunca lanza: ante fallo, lista vacía. */
  async function listAllWithOwner({ accessToken }) {
    try {
      const rows = await adapter.listAllWithOwner({ accessToken });
      return rows ?? [];
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'unit-attempt-list-all-failed', err: String(err) });
      return [];
    }
  }

  /** Admin Console — sí propaga éxito/fallo: la consola necesita saber si guardó. */
  async function setAttemptsUsed({ userId, bookId, unitNumber, assessmentId = 'worksheet', attemptsUsed, accessToken }) {
    try {
      await adapter.setAttemptsUsed({ userId, bookId, unitNumber, assessmentId, attemptsUsed, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({
        reason: 'unit-attempt-set-failed',
        userId,
        bookId,
        unitNumber,
        assessmentId,
        attemptsUsed,
        err: String(err),
      });
      return false;
    }
  }

  return Object.freeze({ getAttemptsUsed, incrementAttempt, listAllWithOwner, setAttemptsUsed });
}
