/**
 * domain/worksheet-attempt/worksheet-attempt-repository.js
 *
 * Único punto de entrada del dominio para el estado de ejercicios de
 * worksheet — análogo a bookmark-repository.js. Transforma las filas
 * planas que trae el adapter en un mapa por `exerciseId`, la forma
 * que `WorksheetScreen` necesita para distribuir el estado inicial
 * de cada componente sin recorrer un arreglo cada vez.
 *
 * Simplificado (esta sesión): ya no maneja `attemptsUsed` — esta
 * tabla dejó de controlar intentos por completo. El único control de
 * intentos real es `unit_attempt_limits` (unit-attempt/).
 */

export function createWorksheetAttemptRepository(worksheetAttemptService) {
  async function getAttemptsForUnit({ userId, bookId, unitNumber, accessToken }) {
    const rows = await worksheetAttemptService.getAttemptsForUnit({ userId, bookId, unitNumber, accessToken });
    const byExerciseId = {};
    rows.forEach((row) => {
      byExerciseId[row.exercise_id] = {
        response: row.response,
        result: row.result,
      };
    });
    return byExerciseId;
  }

  async function saveAttempt({ userId, bookId, unitNumber, exerciseId, response, result, accessToken }) {
    return worksheetAttemptService.saveAttempt({
      userId,
      bookId,
      unitNumber,
      exerciseId,
      response,
      result,
      accessToken,
    });
  }

  async function deleteAttemptsForUnit({ userId, bookId, unitNumber, accessToken }) {
    return worksheetAttemptService.deleteAttemptsForUnit({ userId, bookId, unitNumber, accessToken });
  }

  return Object.freeze({ getAttemptsForUnit, saveAttempt, deleteAttemptsForUnit });
}
