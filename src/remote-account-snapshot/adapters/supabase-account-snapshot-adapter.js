/**
 * remote-account-snapshot/adapters/supabase-account-snapshot-adapter.js
 *
 * Única pieza que sabe que el snapshot remoto vive en una tabla
 * PostgREST de Supabase. Se modela deliberadamente como un blob
 * opaco por usuario (una fila `user_data(user_id, payload jsonb,
 * updated_at)`) en vez de tablas granulares por Attempt/Session —
 * porque diseñar el esquema remoto granular es trabajo de Sync
 * (todavía no diseñada), no de esta capacidad mínima (Sprint 6 Plan,
 * Opción A). Cuando Sync se diseñe, este adapter puede reemplazarse
 * sin afectar a account-linking-flow.js, que solo conoce
 * account-snapshot-contract.js.
 */

export function createSupabaseAccountSnapshotAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
  function assertConfigured() {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase no está configurado (supabaseUrl/supabaseAnonKey ausentes en config/env.public.js).',
      );
    }
  }

  async function readSnapshot({ userId, accessToken }) {
    assertConfigured();
    const url = `${supabaseUrl}/rest/v1/user_data?user_id=eq.${encodeURIComponent(userId)}&select=payload`;
    const response = await fetchImpl(url, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`Lectura de snapshot falló con estado ${response.status}`);
    }
    const rows = await response.json();
    return rows[0]?.payload ?? null;
  }

  async function writeSnapshot({ userId, accessToken, payload }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/user_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ user_id: userId, payload, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) {
      throw new Error(`Escritura de snapshot falló con estado ${response.status}`);
    }
    return true;
  }

  return Object.freeze({ readSnapshot, writeSnapshot });
}
