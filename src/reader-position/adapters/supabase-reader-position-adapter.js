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
      `&book_id=eq.${encodeURIComponent(bookId)}&select=page_number,last_activity`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de ReaderPosition falló con estado ${response.status}`);
    }
    const rows = await response.json();
    if (!rows[0]) return null;
    return { pageNumber: rows[0].page_number, lastActivity: rows[0].last_activity ?? null };
  }

  async function savePosition({ userId, bookId, pageNumber, lastActivity, accessToken }) {
    assertConfigured();
    const body = {
      user_id: userId,
      book_id: bookId,
      page_number: pageNumber,
      updated_at: new Date().toISOString(),
    };
    // Solo se incluye si quien llama la pasó explícitamente — Hi!
    // Korean nunca la pasa (page-reader-screen.js no se tocó), así
    // que su upsert queda exactamente igual que antes de esta
    // sesión, byte por byte.
    if (lastActivity !== undefined) body.last_activity = lastActivity;

    const response = await fetchImpl(`${supabaseUrl}/rest/v1/reader_positions`, {
      method: 'POST',
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      }),
      body: JSON.stringify(body),
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
      `&select=book_id,page_number,last_activity&order=updated_at.desc&limit=1`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de la posición más reciente falló con estado ${response.status}`);
    }
    const rows = await response.json();
    if (!rows[0]) return null;
    return { bookId: rows[0].book_id, pageNumber: rows[0].page_number, lastActivity: rows[0].last_activity ?? null };
  }

  /**
   * Admin Console (Sprint 14) — todas las posiciones de un
   * estudiante concreto, entre todos sus libros (a diferencia de
   * `getPosition`, que ya conoce el libro de antemano). El admin
   * llega aquí desde Users → un estudiante — mismo patrón que
   * Bookmarks admin.
   */
  async function listForUser({ userId, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/reader_positions?user_id=eq.${encodeURIComponent(userId)}` +
      `&select=book_id,page_number,updated_at&order=updated_at.desc`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura administrativa de posiciones falló con estado ${response.status}`);
    }
    return response.json();
  }

  /**
   * Admin Console (Sprint 14) — "Reiniciar progreso": DELETE de la
   * fila. Sin fila, el Reader se comporta exactamente igual que
   * "nunca hubo posición guardada" (mismo camino ya usado por
   * getPosition → null) — nunca un estado especial nuevo que otras
   * pantallas deban aprender a distinguir.
   */
  async function resetPosition({ userId, bookId, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/reader_positions?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}`;
    const response = await fetchImpl(url, {
      method: 'DELETE',
      headers: authHeaders(accessToken, { Prefer: 'return=minimal' }),
    });
    if (!response.ok) {
      throw new Error(`Reinicio de ReaderPosition falló con estado ${response.status}`);
    }
  }

  return Object.freeze({ getPosition, savePosition, getMostRecentPosition, listForUser, resetPosition });
}
