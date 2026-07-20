/**
 * video-source/adapters/supabase-video-source-adapter.js
 *
 * Única pieza que sabe que los videos de American Language Hub
 * viven en el bucket público `book-video` de Supabase Storage.
 * Reutiliza `buildPublicStorageUrl` (storage/public-storage-url.js)
 * — la misma pieza que ya comparten PageSource y AudioSource — para
 * que ningún adaptador de bucket público vuelva a escribir el
 * patrón de la URL por su cuenta.
 */

import { buildPublicStorageUrl } from '../../storage/public-storage-url.js';

export function createSupabaseVideoSourceAdapter({ supabaseUrl, bucket = 'book-video' }) {
  function assertConfigured() {
    if (!supabaseUrl) {
      throw new Error('Supabase no está configurado (supabaseUrl ausente en config/env.public.js).');
    }
  }

  async function getVideoUrl(assetPath) {
    assertConfigured();
    return buildPublicStorageUrl({ supabaseUrl, bucket, path: assetPath });
  }

  return Object.freeze({ getVideoUrl });
}
