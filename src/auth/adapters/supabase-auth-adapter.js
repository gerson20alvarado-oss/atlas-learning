/**
 * auth/adapters/supabase-auth-adapter.js
 *
 * Primera (y única, por ahora) implementación real del auth-contract.
 * Es deliberadamente la ÚNICA pieza de todo el proyecto que sabe que
 * el proveedor es Supabase (Sprint 6 Plan: capa desacoplada del
 * proveedor). Sustituir Supabase en el futuro se limita a escribir
 * un adapter distinto con esta misma forma — auth-contract.js,
 * bootstrap.js (más allá de esta única línea de creación) y todo lo
 * demás permanecen sin cambios.
 *
 * Implementado con `fetch` directo contra la API REST pública de
 * Supabase Auth (endpoints documentados y estables:
 * `/auth/v1/token`, `/auth/v1/logout`) — sin el SDK `supabase-js`,
 * para no introducir una dependencia nueva ni un paso de build
 * (regla permanente del proyecto: HTML/CSS/JS ES Modules puro, sin
 * bundler, Software Architecture C1/C9).
 *
 * Sin proyecto Supabase real configurado (`supabaseUrl`/
 * `supabaseAnonKey` en config/env.public.js siguen en `null` por
 * defecto — Sprint 1 ya dejó ese placeholder), cualquier llamada
 * real falla explícitamente en vez de fingir éxito — la persona que
 * configure un proyecto real solo necesita completar esos dos
 * valores públicos, no tocar este archivo.
 */

function toAuthSession(payload) {
  return {
    userId: payload.user?.id ?? null,
    email: payload.user?.email ?? null,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + (payload.expires_in ?? 0) * 1000,
  };
}

export function createSupabaseAuthAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
  function assertConfigured() {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase Auth no está configurado (supabaseUrl/supabaseAnonKey ausentes en config/env.public.js).',
      );
    }
  }

  async function signInWithPassword({ email, password }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new Error(`Supabase sign-in falló con estado ${response.status}`);
    }
    return toAuthSession(await response.json());
  }

  async function refreshSession({ refreshToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
      throw new Error(`Supabase refresh falló con estado ${response.status}`);
    }
    return toAuthSession(await response.json());
  }

  async function signOut(session) {
    assertConfigured();
    if (!session?.accessToken) return;
    await fetchImpl(`${supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${session.accessToken}` },
    });
  }

  return Object.freeze({ signInWithPassword, refreshSession, signOut });
}
