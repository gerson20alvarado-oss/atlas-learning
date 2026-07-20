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

  /**
   * Admin Console (Sprint 14) — reutiliza `unit_attempts_with_owner`
   * (docs/unit-attempts-with-owner-view.sql), la vista construida
   * para exactamente este propósito: intentos por unidad + nombre
   * del estudiante, en una sola consulta. Nada nuevo que unir aquí —
   * solo se le añadió `security_invoker` + un GRANT para poder
   * consultarla vía REST con el token del admin en vez de solo desde
   * Studio (ver docs/admin-console-schema.sql).
   */
  async function listAllWithOwner({ accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/unit_attempts_with_owner?select=*` +
      `&order=updated_at.desc`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura administrativa de intentos falló con estado ${response.status}`);
    }
    return response.json();
  }

  /**
   * Admin Console (Sprint 14) — UPDATE directo de attempts_used,
   * distinto de `incrementAttempt`: seguro solo porque únicamente un
   * admin puede ejecutarlo (política "Admins update unit attempt
   * limits"); el flujo del propio estudiante nunca escribe este
   * número directamente, solo dispara increment_unit_attempt().
   */
  async function setAttemptsUsed({ userId, bookId, unitNumber, attemptsUsed, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/unit_attempt_limits?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&unit_number=eq.${unitNumber}`;
    const response = await fetchImpl(url, {
      method: 'PATCH',
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      }),
      body: JSON.stringify({ attempts_used: attemptsUsed, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) {
      throw new Error(`Actualización administrativa de intentos falló con estado ${response.status}`);
    }
  }

  return Object.freeze({ getAttemptsUsed, incrementAttempt, listAllWithOwner, setAttemptsUsed });
}
