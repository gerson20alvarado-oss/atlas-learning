/**
 * image-source/adapters/supabase-image-source-adapter.js
 *
 * Única pieza que sabe que las imágenes fijas del Video Hub de
 * American Language Hub viven en el bucket público `book-image` de
 * Supabase Storage. Reutiliza `buildPublicStorageUrl`
 * (storage/public-storage-url.js) — la misma pieza que ya comparten
 * PageSource, AudioSource y VideoSource — para que ningún adapter de
 * bucket público vuelva a escribir el patrón de la URL por su
 * cuenta.
 */

import { buildPublicStorageUrl } from '../../storage/public-storage-url.js';

export function createSupabaseImageSourceAdapter({ supabaseUrl, bucket = 'book-image' }) {
  function assertConfigured() {
    if (!supabaseUrl) {
      throw new Error('Supabase no está configurado (supabaseUrl ausente en config/env.public.js).');
    }
  }

  async function getImageUrl(assetPath) {
    assertConfigured();
    return buildPublicStorageUrl({ supabaseUrl, bucket, path: assetPath });
  }

  return Object.freeze({ getImageUrl });
}
