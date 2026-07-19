/**
 * study-workspace/adapters/supabase-study-workspace-adapter.js
 *
 * Única pieza que sabe que el Espacio de Estudio vive en dos lugares
 * de Supabase: una tabla `study_workspace_entries(user_id, book_id,
 * page_number, notes, image_refs jsonb, updated_at)` — un blob por
 * página y por cuenta, mismo criterio que el snapshot de cuenta,
 * porque aquí sí es un único estado que se reescribe entero, no una
 * colección de hechos independientes como Bookmark — y un bucket
 * privado de Storage `study-workspace` para las imágenes.
 *
 * Ruta de imagen, ya congelada (Technical Specification v2.1, §13):
 *   study-workspace/{userId}/{bookId}/page-{NNN}/{imageId}.webp
 *
 * Bucket privado: `getImageUrl` siempre pide una URL firmada y
 * temporal a la API de Storage — nunca construye una URL pública
 * (a diferencia de PageSource, cuyo bucket sí es público).
 */

function formatPageNumber(pageNumber) {
  return String(pageNumber).padStart(3, '0');
}

export function createSupabaseStudyWorkspaceAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
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

  async function getEntry({ userId, bookId, pageNumber, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/study_workspace_entries?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&page_number=eq.${pageNumber}&select=notes,image_refs`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura del Espacio de Estudio falló con estado ${response.status}`);
    }
    const rows = await response.json();
    if (!rows[0]) return null;
    return { notes: rows[0].notes ?? '', imageRefs: rows[0].image_refs ?? [] };
  }

  async function saveEntry({ userId, bookId, pageNumber, notes, imageRefs, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/study_workspace_entries`, {
      method: 'POST',
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      }),
      body: JSON.stringify({
        user_id: userId,
        book_id: bookId,
        page_number: pageNumber,
        notes,
        image_refs: imageRefs,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      throw new Error(`Guardar el Espacio de Estudio falló con estado ${response.status}`);
    }
    return true;
  }

  async function uploadImage({ userId, bookId, pageNumber, file, accessToken }) {
    assertConfigured();
    const imageId = `image-${Date.now()}`;
    const path = `${userId}/${bookId}/page-${formatPageNumber(pageNumber)}/${imageId}.webp`;
    const response = await fetchImpl(`${supabaseUrl}/storage/v1/object/study-workspace/${path}`, {
      method: 'POST',
      headers: authHeaders(accessToken, { 'Content-Type': file.type || 'image/webp' }),
      body: file,
    });
    if (!response.ok) {
      throw new Error(`Subir imagen falló con estado ${response.status}`);
    }
    return path;
  }

  async function getImageUrl({ path, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/storage/v1/object/sign/study-workspace/${path}`, {
      method: 'POST',
      headers: authHeaders(accessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn: 3600 }), // 1 hora — suficiente para una sesión de estudio real
    });
    if (!response.ok) {
      throw new Error(`Firmar URL de imagen falló con estado ${response.status}`);
    }
    const { signedURL } = await response.json();
    return `${supabaseUrl}/storage/v1${signedURL}`;
  }

  async function deleteImage({ path, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/storage/v1/object/study-workspace/${path}`, {
      method: 'DELETE',
      headers: authHeaders(accessToken),
    });
    if (!response.ok) {
      throw new Error(`Borrar imagen falló con estado ${response.status}`);
    }
    return true;
  }

  return Object.freeze({ getEntry, saveEntry, uploadImage, getImageUrl, deleteImage });
}
