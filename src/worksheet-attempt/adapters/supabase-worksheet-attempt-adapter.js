/**
 * worksheet-attempt/adapters/supabase-worksheet-attempt-adapter.js
 *
 * Única pieza que sabe que el estado de los ejercicios de evaluación
 * vive en `worksheet_exercise_attempts(user_id, book_id, unit_number,
 * assessment_id, exercise_id, response, result, updated_at)`, clave
 * compuesta (user_id, book_id, unit_number, assessment_id,
 * exercise_id) — ver docs/worksheet-attempts-schema.sql y
 * docs/assessment-id-migration.sql.
 *
 * Esta tabla no controla intentos — `attempts_used` se eliminó por
 * completo, columna incluida. Es únicamente un repositorio de
 * estado: qué respondió el estudiante, qué resultado obtuvo. El
 * único control de intentos real es `unit_attempt_limits`
 * (unit-attempt/), una tabla y una responsabilidad distintas.
 *
 * Evoluciones independientes por unidad (esta sesión): `assessmentId`
 * se añade como dimensión más de la clave, con default 'worksheet'.
 * Sin esta dimensión, `deleteAttemptsForUnit` habría borrado las
 * respuestas de TODAS las evaluaciones de la unidad (Worksheet y
 * Progress Test comparten unit_number) al presionar "Start New
 * Attempt" en cualquiera de las dos — con `assessmentId` en el
 * filtro, cada evaluación borra únicamente lo suyo.
 */

export function createSupabaseWorksheetAttemptAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
  function assertConfigured() {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase no está configurado (supabaseUrl/supabaseAnonKey ausentes en config/env.public.js).',
      );
    }
  }

  function authHeaders(accessToken, extra = {}) {
    return { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}`, ...extra };
  }

  async function getAttemptsForUnit({ userId, bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/worksheet_exercise_attempts?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&unit_number=eq.${unitNumber}` +
      `&assessment_id=eq.${encodeURIComponent(assessmentId)}` +
      `&select=exercise_id,response,result`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de estado de ejercicios falló con estado ${response.status}`);
    }
    return response.json();
  }

  async function saveAttempt({ userId, bookId, unitNumber, assessmentId = 'worksheet', exerciseId, response: exerciseResponse, result, accessToken }) {
    assertConfigured();
    const res = await fetchImpl(`${supabaseUrl}/rest/v1/worksheet_exercise_attempts`, {
      method: 'POST',
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
        // Idempotente: volver a calificar el mismo ejercicio actualiza
        // la fila existente en vez de duplicarla — mismo criterio ya
        // usado en el adapter de Marcadores. El conflicto se resuelve
        // contra la clave primaria completa (incluye assessment_id),
        // así que esto sigue funcionando sin cambios adicionales.
        Prefer: 'resolution=merge-duplicates',
      }),
      body: JSON.stringify({
        user_id: userId,
        book_id: bookId,
        unit_number: unitNumber,
        assessment_id: assessmentId,
        exercise_id: exerciseId,
        response: exerciseResponse,
        result,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      throw new Error(`Guardado de estado de ejercicio falló con estado ${res.status}`);
    }
  }

  // Start New Attempt: borra las filas de ESTA evaluación de la
  // unidad para que el estudiante empiece en blanco — nunca las de
  // otra evaluación de la misma unidad. Requiere la política de
  // DELETE (ver docs/worksheet-attempts-schema.sql) — sin ella, esta
  // llamada fallaría con 403/permission denied.
  async function deleteAttemptsForUnit({ userId, bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/worksheet_exercise_attempts?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&unit_number=eq.${unitNumber}` +
      `&assessment_id=eq.${encodeURIComponent(assessmentId)}`;
    const response = await fetchImpl(url, { method: 'DELETE', headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Borrado de estado de ejercicios falló con estado ${response.status}`);
    }
  }

  return Object.freeze({ getAttemptsForUnit, saveAttempt, deleteAttemptsForUnit });
}
