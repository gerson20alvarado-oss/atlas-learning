/**
 * library-access/adapters/supabase-library-access-adapter.js
 *
 * Única pieza que sabe que la relación userId→authorizedBookIds vive
 * en una tabla PostgREST de Supabase. Modelada como una fila por
 * usuario (`library_access(user_id, book_ids jsonb, updated_at)`),
 * mismo criterio de simplicidad que ya usa el snapshot de cuenta
 * (remote-account-snapshot/adapters/supabase-account-snapshot-
 * adapter.js) — un blob por usuario, no una tabla granular de
 * relaciones, porque no hace falta más que eso para lo que este
 * adapter resuelve.
 *
 * De solo lectura a propósito: no expone ninguna operación de
 * escritura. La fila la administras tú, directamente, fuera de
 * Atlas — no hay UI de administración que la necesite.
 */

export function createSupabaseLibraryAccessAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
  function assertConfigured() {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase no está configurado (supabaseUrl/supabaseAnonKey ausentes en config/env.public.js).',
      );
    }
  }

  async function readAuthorizedBookIds({ userId, accessToken }) {
    assertConfigured();
    const url = `${supabaseUrl}/rest/v1/library_access?user_id=eq.${encodeURIComponent(userId)}&select=book_ids`;
    const response = await fetchImpl(url, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`Lectura de acceso a biblioteca falló con estado ${response.status}`);
    }
    const rows = await response.json();
    return rows[0]?.book_ids ?? null;
  }

  return Object.freeze({ readAuthorizedBookIds });
}
