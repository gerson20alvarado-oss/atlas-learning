/**
 * reader-position/adapters/supabase-reader-position-adapter.js
 *
 * Única pieza que sabe que ReaderPosition vive en
 * `reader_positions(user_id, book_id, page_number, updated_at)`,
 * clave compuesta (user_id, book_id) — un único estado vigente por
 * usuario y libro, mismo criterio que StudyWorkspaceEntry (un blob
 * que se reescribe entero), no una colección como Bookmark.
 */

export function createSupabaseReaderPositionAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
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

  async function getPosition({ userId, bookId, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/reader_positions?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&select=page_number`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de ReaderPosition falló con estado ${response.status}`);
    }
    const rows = await response.json();
    if (!rows[0]) return null;
    return { pageNumber: rows[0].page_number };
  }

  async function savePosition({ userId, bookId, pageNumber, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/reader_positions`, {
      method: 'POST',
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      }),
      body: JSON.stringify({
        user_id: userId,
        book_id: bookId,
        page_number: pageNumber,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      throw new Error(`Guardar ReaderPosition falló con estado ${response.status}`);
    }
    return true;
  }

  async function getMostRecentPosition({ userId, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/reader_positions?user_id=eq.${encodeURIComponent(userId)}` +
      `&select=book_id,page_number&order=updated_at.desc&limit=1`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de la posición más reciente falló con estado ${response.status}`);
    }
    const rows = await response.json();
    if (!rows[0]) return null;
    return { bookId: rows[0].book_id, pageNumber: rows[0].page_number };
  }

  return Object.freeze({ getPosition, savePosition, getMostRecentPosition });
}
