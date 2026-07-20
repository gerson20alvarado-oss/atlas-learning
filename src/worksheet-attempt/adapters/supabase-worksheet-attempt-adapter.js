/**
 * worksheet-attempt/adapters/supabase-worksheet-attempt-adapter.js
 *
 * Única pieza que sabe que los intentos de ejercicios de worksheet
 * viven en `worksheet_exercise_attempts(user_id, book_id,
 * unit_number, exercise_id, response, result, attempts_used,
 * updated_at)`, clave compuesta (user_id, book_id, unit_number,
 * exercise_id) — ver docs/worksheet-attempts-schema.sql. Mismo
 * patrón exacto que `supabase-bookmark-adapter.js`, tabla propia,
 * exclusiva de libros con contentMode 'worksheet'.
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
      `&select=exercise_id,response,result,attempts_used`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de intentos falló con estado ${response.status}`);
    }
    return response.json();
  }

  async function saveAttempt({ userId, bookId, unitNumber, exerciseId, response: exerciseResponse, result, attemptsUsed, accessToken }) {
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
        attempts_used: attemptsUsed,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      throw new Error(`Guardado de intento falló con estado ${res.status}`);
    }
  }

  return Object.freeze({ getAttemptsForUnit, saveAttempt });
}
