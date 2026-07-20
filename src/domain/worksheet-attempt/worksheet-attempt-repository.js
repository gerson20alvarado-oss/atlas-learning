/**
 * domain/worksheet-attempt/worksheet-attempt-repository.js
 *
 * Único punto de entrada del dominio para los intentos de ejercicios
 * de worksheet — análogo a bookmark-repository.js. Transforma las
 * filas planas que trae el adapter en un mapa por `exerciseId`, la
 * forma que `WorksheetScreen` necesita para distribuir el estado
 * inicial de cada componente sin recorrer un arreglo cada vez.
 */

export function createWorksheetAttemptRepository(worksheetAttemptService) {
  async function getAttemptsForUnit({ userId, bookId, unitNumber, accessToken }) {
    const rows = await worksheetAttemptService.getAttemptsForUnit({ userId, bookId, unitNumber, accessToken });
    const byExerciseId = {};
    rows.forEach((row) => {
      byExerciseId[row.exercise_id] = {
        response: row.response,
        result: row.result,
        attemptsUsed: row.attempts_used,
      };
    });
    return byExerciseId;
  }

  async function saveAttempt({ userId, bookId, unitNumber, exerciseId, response, result, attemptsUsed, accessToken }) {
    return worksheetAttemptService.saveAttempt({
      userId,
      bookId,
      unitNumber,
      exerciseId,
      response,
      result,
      attemptsUsed,
      accessToken,
    });
  }

  return Object.freeze({ getAttemptsForUnit, saveAttempt });
}
