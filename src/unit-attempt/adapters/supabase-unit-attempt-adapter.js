/**
 * unit-attempt/adapters/supabase-unit-attempt-adapter.js
 *
 * Única pieza que sabe que los intentos por unidad viven en
 * `unit_attempt_limits(user_id, book_id, unit_number,
 * attempts_used)` — ver docs/unit-attempt-limits-schema.sql. El
 * incremento nunca es un UPDATE directo — invoca
 * `increment_unit_attempt` vía RPC, la función atómica.
 */

export function createSupabaseUnitAttemptAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
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

  async function getAttemptsUsed({ userId, bookId, unitNumber, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/unit_attempt_limits?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&unit_number=eq.${unitNumber}&select=attempts_used`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de intentos de unidad falló con estado ${response.status}`);
    }
    const rows = await response.json();
    return rows[0]?.attempts_used ?? 0;
  }

  async function incrementAttempt({ bookId, unitNumber, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/increment_unit_attempt`, {
      method: 'POST',
      headers: authHeaders(accessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ p_book_id: bookId, p_unit_number: unitNumber }),
    });
    if (!response.ok) {
      throw new Error(`Incremento de intento de unidad falló con estado ${response.status}`);
    }
    return response.json(); // nuevo attempts_used
  }

  return Object.freeze({ getAttemptsUsed, incrementAttempt });
}
