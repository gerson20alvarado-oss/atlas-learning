/**
 * writing-response/adapters/supabase-writing-response-adapter.js
 *
 * Única pieza que sabe que las respuestas de Writing viven en
 * `writing_responses(user_id, book_id, unit_number, response_text,
 * updated_at)` — ver docs/writing-responses-schema.sql. Mismo
 * criterio que ReaderPosition: un único estado vigente por
 * (usuario, libro, unidad), sobrescrito con cada autoguardado — no
 * un historial, no una colección.
 *
 * Sin relación alguna con `unit_attempt_limits` ni
 * `worksheet_exercise_attempts` — esta tabla no sabe que el sistema
 * de Assessment existe.
 */

export function createSupabaseWritingResponseAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
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

  async function getEntry({ userId, bookId, unitNumber, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/writing_responses?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&unit_number=eq.${unitNumber}` +
      `&select=response_text,updated_at`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de Writing falló con estado ${response.status}`);
    }
    const rows = await response.json();
    if (!rows[0]) return null;
    return { responseText: rows[0].response_text, updatedAt: rows[0].updated_at };
  }

  async function saveEntry({ userId, bookId, unitNumber, responseText, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/writing_responses`, {
      method: 'POST',
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
        // Idempotente: cada autoguardado sobrescribe la misma fila —
        // mismo criterio ya usado en reader-position y bookmark.
        Prefer: 'resolution=merge-duplicates',
      }),
      body: JSON.stringify({
        user_id: userId,
        book_id: bookId,
        unit_number: unitNumber,
        response_text: responseText,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      throw new Error(`Guardado de Writing falló con estado ${response.status}`);
    }
    return true;
  }

  return Object.freeze({ getEntry, saveEntry });
}
