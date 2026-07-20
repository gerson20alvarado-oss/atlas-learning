/**
 * license/adapters/supabase-license-adapter.js
 *
 * Única pieza que sabe que las licencias viven en
 * `license_keys(book_id, key_code, status, user_id, ...)` — ver
 * docs/license-keys-schema.sql. Lectura: PostgREST directo, misma
 * política RLS que ya protege cada tabla del proyecto. Activación:
 * nunca un `UPDATE` directo — invoca `activate_license(p_key_code)`
 * vía RPC, la función atómica con bloqueo de fila (Arquitectura de
 * Licencias, §4). Este adapter no valida nada por su cuenta — toda
 * la validación real vive dentro de la función de Postgres.
 */

export function createSupabaseLicenseAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
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

  async function getActiveBookIds({ userId, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/license_keys?user_id=eq.${encodeURIComponent(userId)}` +
      `&status=eq.activated&select=book_id,expires_at`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de licencias falló con estado ${response.status}`);
    }
    const rows = await response.json();
    const now = Date.now();
    return rows
      .filter((row) => !row.expires_at || new Date(row.expires_at).getTime() > now)
      .map((row) => row.book_id);
  }

  async function activate({ keyCode, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/activate_license`, {
      method: 'POST',
      headers: authHeaders(accessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ p_key_code: keyCode }),
    });
    if (!response.ok) {
      throw new Error(`Activación de licencia falló con estado ${response.status}`);
    }
    return response.json(); // { success, book_id, reason }
  }

  return Object.freeze({ getActiveBookIds, activate });
}
