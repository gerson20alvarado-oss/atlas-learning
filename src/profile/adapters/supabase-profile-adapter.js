/**
 * profile/adapters/supabase-profile-adapter.js
 *
 * Única pieza que sabe que los perfiles viven en
 * `profiles(user_id, first_name, last_name, ...)` — ver
 * docs/profiles-schema.sql. A diferencia de licencias, aquí un
 * `INSERT` directo del cliente es seguro (RLS ya garantiza que solo
 * se puede crear la propia fila) — sin necesidad de ninguna función
 * atómica.
 */

export function createSupabaseProfileAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
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

  async function getProfile({ userId, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}` +
      `&select=first_name,last_name`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de perfil falló con estado ${response.status}`);
    }
    const rows = await response.json();
    return rows[0] ?? null;
  }

  async function createProfile({ userId, firstName, lastName, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: authHeaders(accessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ user_id: userId, first_name: firstName, last_name: lastName }),
    });
    if (!response.ok) {
      throw new Error(`Creación de perfil falló con estado ${response.status}`);
    }
  }

  return Object.freeze({ getProfile, createProfile });
}
