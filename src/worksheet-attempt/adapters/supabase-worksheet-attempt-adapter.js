/**
 * worksheet-attempt/adapters/supabase-worksheet-attempt-adapter.js
 *
 * Única pieza que sabe que el estado de los ejercicios de worksheet
 * vive en `worksheet_exercise_attempts(user_id, book_id,
 * unit_number, exercise_id, response, result, updated_at)`, clave
 * compuesta (user_id, book_id, unit_number, exercise_id) — ver
 * docs/worksheet-attempts-schema.sql.
 *
 * Simplificado (esta sesión, decisión de producto cerrada): esta
 * tabla ya no controla intentos — `attempts_used` se eliminó por
 * completo, columna incluida. Es únicamente un repositorio de
 * estado: qué respondió el estudiante, qué resultado obtuvo. El
 * único control de intentos real es `unit_attempt_limits`
 * (unit-attempt/), una tabla y una responsabilidad distintas.
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

  async function getAttemptsForUnit({ userId, bookId, unitNumber, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/worksheet_exercise_attempts?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&unit_number=eq.${unitNumber}` +
      `&select=exercise_id,response,result`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de estado de ejercicios falló con estado ${response.status}`);
    }
    return response.json();
  }

  async function saveAttempt({ userId, bookId, unitNumber, exerciseId, response: exerciseResponse, result, accessToken }) {
    assertConfigured();
    const res = await fetchImpl(`${supabaseUrl}/rest/v1/worksheet_exercise_attempts`, {
      method: 'POST',
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
        // Idempotente: volver a calificar el mismo ejercicio actualiza
        // la fila existente en vez de duplicarla — mismo criterio ya
        // usado en el adapter de Marcadores.
        Prefer: 'resolution=merge-duplicates',
      }),
      body: JSON.stringify({
        user_id: userId,
        book_id: bookId,
        unit_number: unitNumber,
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

  // Start New Attempt (esta sesión): borra las filas de esta unidad
  // para que el estudiante empiece en blanco. Requiere la política
  // de DELETE (ver docs/worksheet-attempts-schema.sql) — sin ella,
  // esta llamada fallaría con 403/permission denied.
  async function deleteAttemptsForUnit({ userId, bookId, unitNumber, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/worksheet_exercise_attempts?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&unit_number=eq.${unitNumber}`;
    const response = await fetchImpl(url, { method: 'DELETE', headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Borrado de estado de ejercicios falló con estado ${response.status}`);
    }
  }

  return Object.freeze({ getAttemptsForUnit, saveAttempt, deleteAttemptsForUnit });
}
