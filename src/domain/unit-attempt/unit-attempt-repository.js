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

  return Object.freeze({ getAttemptsUsed, canStartUnit, incrementAttempt });
}
