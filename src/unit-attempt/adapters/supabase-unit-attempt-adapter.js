/**
 * unit-attempt/adapters/supabase-unit-attempt-adapter.js
 *
 * Única pieza que sabe que los intentos por unidad viven en
 * `unit_attempt_limits(user_id, book_id, unit_number, assessment_id,
 * attempts_used)` — ver docs/unit-attempt-limits-schema.sql y
 * docs/assessment-id-migration.sql. El incremento nunca es un UPDATE
 * directo — invoca `increment_unit_attempt` vía RPC, la función
 * atómica.
 *
 * Evoluciones independientes por unidad (esta sesión): `assessmentId`
 * se añade como dimensión más de la clave en cada operación — mismo
 * motor exacto que antes (misma tabla, mismo RPC), ahora capaz de
 * llevar contadores separados para Worksheet, Progress Test, y
 * cualquier evaluación futura de la misma unidad, sin que ninguna
 * afecte a las demás. Por defecto `'worksheet'`, para que cualquier
 * llamada existente sin este parámetro siga funcionando exactamente
 * igual que antes de esta sesión.
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

  async function getAttemptsUsed({ userId, bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/unit_attempt_limits?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&unit_number=eq.${unitNumber}` +
      `&assessment_id=eq.${encodeURIComponent(assessmentId)}&select=attempts_used`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de intentos de unidad falló con estado ${response.status}`);
    }
    const rows = await response.json();
    return rows[0]?.attempts_used ?? 0;
  }

  async function incrementAttempt({ bookId, unitNumber, assessmentId = 'worksheet', accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/increment_unit_attempt`, {
      method: 'POST',
      headers: authHeaders(accessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ p_book_id: bookId, p_unit_number: unitNumber, p_assessment_id: assessmentId }),
    });
    if (!response.ok) {
      throw new Error(`Incremento de intento de unidad falló con estado ${response.status}`);
    }
    return response.json(); // nuevo attempts_used
  }

  /**
   * Admin Console — reutiliza `unit_attempts_with_owner`
   * (docs/unit-attempts-with-owner-view.sql +
   * docs/assessment-id-migration.sql), que ahora también expone
   * `assessment_id` — el admin ve y distingue los intentos de cada
   * evaluación por separado, en la misma consulta de siempre.
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
   * Admin Console — UPDATE directo de attempts_used, distinto de
   * `incrementAttempt`: seguro solo porque únicamente un admin puede
   * ejecutarlo (política "Admins update unit attempt limits"). Filtra
   * también por `assessment_id` — sin esto, un admin editando la
   * Worksheet de un estudiante tocaría también su Progress Test (y
   * viceversa), ya que ambas comparten user_id/book_id/unit_number.
   */
  async function setAttemptsUsed({ userId, bookId, unitNumber, assessmentId = 'worksheet', attemptsUsed, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/unit_attempt_limits?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&unit_number=eq.${unitNumber}` +
      `&assessment_id=eq.${encodeURIComponent(assessmentId)}`;
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
