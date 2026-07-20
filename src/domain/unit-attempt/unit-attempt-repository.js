/**
 * domain/unit-attempt/unit-attempt-repository.js
 *
 * Único punto de entrada del dominio para intentos por unidad.
 * `canStartUnit` compara el conteo real (Supabase) contra el máximo
 * declarado en el contenido (`maxAttempts`, nunca en la base de
 * datos — ver Arquitectura de Intentos por Unidad, §2) — un libro
 * nuevo con reglas propias es un campo de contenido, nunca una
 * migración.
 */

export function createUnitAttemptRepository(unitAttemptService) {
  async function getAttemptsUsed({ userId, bookId, unitNumber, accessToken }) {
    return unitAttemptService.getAttemptsUsed({ userId, bookId, unitNumber, accessToken });
  }

  function canStartUnit({ attemptsUsed, maxAttempts }) {
    return maxAttempts === null || maxAttempts === undefined || attemptsUsed < maxAttempts;
  }

  async function incrementAttempt({ bookId, unitNumber, accessToken }) {
    return unitAttemptService.incrementAttempt({ bookId, unitNumber, accessToken });
  }

  /**
   * Admin Console (Sprint 14) — normaliza las filas de la vista
   * `unit_attempts_with_owner` a la misma convención camelCase que
   * el resto del dominio usa.
   */
  async function listAllWithOwner({ accessToken }) {
    const rows = await unitAttemptService.listAllWithOwner({ accessToken });
    return rows.map((row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      bookId: row.book_id,
      unitNumber: row.unit_number,
      attemptsUsed: row.attempts_used,
      updatedAt: row.updated_at,
    }));
  }

  async function setAttemptsUsed({ userId, bookId, unitNumber, attemptsUsed, accessToken }) {
    return unitAttemptService.setAttemptsUsed({ userId, bookId, unitNumber, attemptsUsed, accessToken });
  }

  return Object.freeze({
    getAttemptsUsed,
    canStartUnit,
    incrementAttempt,
    listAllWithOwner,
    setAttemptsUsed,
  });
}
