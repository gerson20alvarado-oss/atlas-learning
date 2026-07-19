/**
 * audio-source/adapters/supabase-audio-source-adapter.js
 *
 * Única pieza que sabe que las pistas de audio viven en el bucket
 * público `book-audio` de Supabase Storage. Reutiliza
 * `buildPublicStorageUrl` (storage/public-storage-url.js) — la misma
 * pieza que también usa `supabase-page-source-adapter.js` — para que
 * ningún adapter de bucket público vuelva a escribir el patrón de la
 * URL por su cuenta.
 *
 * Bucket público, de solo lectura: URL determinística, sin `fetch`,
 * mismo criterio que PageSource.
 */

import { buildPublicStorageUrl } from '../../storage/public-storage-url.js';

export function createSupabaseAudioSourceAdapter({ supabaseUrl, bucket = 'book-audio' }) {
  function assertConfigured() {
    if (!supabaseUrl) {
      throw new Error('Supabase no está configurado (supabaseUrl ausente en config/env.public.js).');
    }
  }

  async function getAudioUrl(assetPath) {
    assertConfigured();
    return buildPublicStorageUrl({ supabaseUrl, bucket, path: assetPath });
  }

  return Object.freeze({ getAudioUrl });
}
