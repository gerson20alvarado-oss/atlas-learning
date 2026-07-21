/**
 * domain/unit-attempt/unit-attempt-repository.js
 *
 * Único punto de entrada del dominio para intentos por unidad.
 * `canStartUnit` compara el conteo real (Supabase) contra el máximo
 * declarado en el contenido (`maxAttempts`) — un libro nuevo con
 * reglas propias es un campo de contenido, nunca una migración.
 *
 * Evoluciones independientes por unidad (esta sesión): `assessmentId`
 * viaja en cada método, con default `'worksheet'`. `maxAttempts` deja
 * de ser una propiedad de la unidad para serlo de la evaluación
 * (Worksheet, Progress Test y futuras declaran el suyo propio en su
 * propio objeto de contenido) — `canStartUnit` no cambia de firma,
 * solo recibe el `maxAttempts` correcto según qué evaluación llame.
 */

export function createUnitAttemptRepository(unitAttemptService) {
  async function getAttemptsUsed({ userId, bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    return unitAttemptService.getAttemptsUsed({ userId, bookId, unitNumber, assessmentId, accessToken });
  }

  function canStartUnit({ attemptsUsed, maxAttempts }) {
    return maxAttempts === null || maxAttempts === undefined || attemptsUsed < maxAttempts;
  }

  async function incrementAttempt({ bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    return unitAttemptService.incrementAttempt({ bookId, unitNumber, assessmentId, accessToken });
  }

  /**
   * Admin Console — normaliza las filas de la vista
   * `unit_attempts_with_owner` a la misma convención camelCase que
   * el resto del dominio usa. Incluye `assessmentId` — el admin
   * distingue Worksheet de Progress Test en la misma lista.
   */
  async function listAllWithOwner({ accessToken }) {
    const rows = await unitAttemptService.listAllWithOwner({ accessToken });
    return rows.map((row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      bookId: row.book_id,
      unitNumber: row.unit_number,
      assessmentId: row.assessment_id,
      attemptsUsed: row.attempts_used,
      updatedAt: row.updated_at,
    }));
  }

  async function setAttemptsUsed({ userId, bookId, unitNumber, assessmentId = 'worksheet', attemptsUsed, accessToken }) {
    return unitAttemptService.setAttemptsUsed({ userId, bookId, unitNumber, assessmentId, attemptsUsed, accessToken });
  }

  return Object.freeze({
    getAttemptsUsed,
    canStartUnit,
    incrementAttempt,
    listAllWithOwner,
    setAttemptsUsed,
  });
}
