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
      // `role` se añade aquí (Admin Console, Sprint 14) — un
      // estudiante normal siempre lee 'student' de su propia fila,
      // así que exponerlo no cambia nada de su experiencia; es lo
      // único que screen-router.js necesita para decidir si esta
      // cuenta puede ver Admin.
      `&select=first_name,last_name,role`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de perfil falló con estado ${response.status}`);
    }
    const rows = await response.json();
    return rows[0] ?? null;
  }

  /**
   * Admin Console (Sprint 14) — búsqueda de estudiantes por nombre.
   * Sin filtro de user_id: solo devuelve filas cuando quien llama es
   * admin (política "Admins read all profiles"); para cualquier otra
   * cuenta, RLS ya lo reduce a su propia fila, así que este método
   * nunca puede filtrar por sí mismo lo que un no-admin puede ver —
   * la seguridad real vive en Postgres, no aquí (mismo criterio que
   * el resto de adapters de este proyecto).
   */
  async function searchProfiles({ query, accessToken }) {
    assertConfigured();
    const term = (query ?? '').trim();
    const filter = term
      ? `&or=(first_name.ilike.*${encodeURIComponent(term)}*,last_name.ilike.*${encodeURIComponent(term)}*)`
      : '';
    const url =
      `${supabaseUrl}/rest/v1/profiles?select=user_id,first_name,last_name,role` +
      `${filter}&order=first_name.asc&limit=50`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Búsqueda de perfiles falló con estado ${response.status}`);
    }
    return response.json();
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

  /**
   * Admin Console (Sprint 14) — Dashboard: conteo total de
   * estudiantes sin traer las filas, vía el header Content-Range que
   * PostgREST siempre agrega con `Prefer: count=exact` (Range:
   * 0-0 pide un único registro, el conteo real viaja en la
   * cabecera, no en el cuerpo).
   */
  async function countStudents({ accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/profiles?select=user_id`, {
      headers: authHeaders(accessToken, { Prefer: 'count=exact', Range: '0-0' }),
    });
    if (!response.ok) {
      throw new Error(`Conteo de estudiantes falló con estado ${response.status}`);
    }
    const contentRange = response.headers.get('content-range'); // "0-0/123"
    return Number(contentRange?.split('/')[1] ?? 0);
  }

  return Object.freeze({ getProfile, createProfile, searchProfiles, countStudents });
}
