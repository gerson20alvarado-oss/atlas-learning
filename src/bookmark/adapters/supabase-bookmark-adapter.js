/**
 * bookmark/adapters/supabase-bookmark-adapter.js
 *
 * Única pieza que sabe que los Marcadores viven en una tabla
 * PostgREST `bookmarks(user_id, book_id, page_number)`, con clave
 * compuesta (user_id, book_id, page_number). A diferencia de
 * LibraryAccess y del snapshot de cuenta (un blob por usuario), aquí
 * una tabla granular es la elección correcta: cada Marcador es un
 * hecho independiente (una fila), no un estado único que se
 * sobrescribe completo — encaja mejor con `insert`/`delete` reales
 * que con un blob JSON reescrito entero en cada cambio.
 */

export function createSupabaseBookmarkAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
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

  async function list({ userId, bookId, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/bookmarks?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&select=page_number`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de Marcadores falló con estado ${response.status}`);
    }
    const rows = await response.json();
    return rows.map((row) => row.page_number);
  }

  async function add({ userId, bookId, pageNumber, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/bookmarks`, {
      method: 'POST',
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
        // Idempotente: marcar dos veces la misma página no duplica
        // la fila — mismo criterio de "resolution=merge-duplicates"
        // ya usado en el adapter del snapshot de cuenta.
        Prefer: 'resolution=merge-duplicates',
      }),
      body: JSON.stringify({ user_id: userId, book_id: bookId, page_number: pageNumber }),
    });
    if (!response.ok) {
      throw new Error(`Añadir Marcador falló con estado ${response.status}`);
    }
    return true;
  }

  async function remove({ userId, bookId, pageNumber, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/bookmarks?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&page_number=eq.${pageNumber}`;
    const response = await fetchImpl(url, { method: 'DELETE', headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Quitar Marcador falló con estado ${response.status}`);
    }
    return true;
  }

  return Object.freeze({ list, add, remove });
}
