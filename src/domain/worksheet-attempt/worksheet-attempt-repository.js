/**
 * domain/worksheet-attempt/worksheet-attempt-repository.js
 *
 * Único punto de entrada del dominio para el estado de ejercicios de
 * una evaluación — análogo a bookmark-repository.js. Transforma las
 * filas planas que trae el adapter en un mapa por `exerciseId`, la
 * forma que `AssessmentScreen` necesita para distribuir el estado
 * inicial de cada componente sin recorrer un arreglo cada vez.
 *
 * No maneja `attemptsUsed` — esta tabla no controla intentos. El
 * único control de intentos real es `unit_attempt_limits`
 * (unit-attempt/).
 *
 * Evoluciones independientes por unidad (esta sesión): `assessmentId`
 * viaja en cada método, con default `'worksheet'` — mismo motor,
 * ahora capaz de aislar el estado de cualquier evaluación de la
 * unidad de las demás (Worksheet, Progress Test, futuras).
 */

export function createWorksheetAttemptRepository(worksheetAttemptService) {
  async function getAttemptsForUnit({ userId, bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    const rows = await worksheetAttemptService.getAttemptsForUnit({ userId, bookId, unitNumber, assessmentId, accessToken });
    const byExerciseId = {};
    rows.forEach((row) => {
      byExerciseId[row.exercise_id] = {
        response: row.response,
        result: row.result,
      };
    });
    return byExerciseId;
  }

  async function saveAttempt({ userId, bookId, unitNumber, assessmentId = 'worksheet', exerciseId, response, result, accessToken }) {
    return worksheetAttemptService.saveAttempt({
      userId,
      bookId,
      unitNumber,
      assessmentId,
      exerciseId,
      response,
      result,
      accessToken,
    });
  }

  async function deleteAttemptsForUnit({ userId, bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    return worksheetAttemptService.deleteAttemptsForUnit({ userId, bookId, unitNumber, assessmentId, accessToken });
  }

  return Object.freeze({ getAttemptsForUnit, saveAttempt, deleteAttemptsForUnit });
}
