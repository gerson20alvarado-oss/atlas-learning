/**
 * page-source/adapters/supabase-page-source-adapter.js
 *
 * Única pieza que sabe que las páginas de un libro viven en un
 * bucket público de Supabase Storage, y cuál es su convención de
 * ruta. Ruta congelada en esta sesión:
 *
 *   book-pages/{bookId}/page-{NNN}.webp
 *
 * `{bookId}` es el identificador real del Content Model tal cual
 * (p. ej. "book-hi-korean-3a") — sin traducir a un segundo slug, para
 * no introducir una segunda fuente de verdad que pueda
 * desincronizarse. `{NNN}` es el número de página con tres dígitos,
 * relleno con ceros (16 → "016").
 *
 * Bucket público, de solo lectura: la URL es determinística — no
 * hace falta pedir una URL firmada ni autenticar la petición, a
 * diferencia del bucket privado del Espacio de Estudio (Technical
 * Specification v2.0, §13). Por eso este adaptador no necesita
 * `fetch` en absoluto: solo construye la URL, reutilizando
 * `buildPublicStorageUrl` (storage/public-storage-url.js) — la misma
 * pieza que ahora también usa AudioSource, para que la construcción
 * de la URL nunca se duplique entre adaptadores de bucket público
 * (corrección de esta sesión: antes cada adapter la escribía por su
 * cuenta).
 */

import { buildPublicStorageUrl } from '../../storage/public-storage-url.js';

function formatPageNumber(pageNumber) {
  return String(pageNumber).padStart(3, '0');
}

export function createSupabasePageSourceAdapter({ supabaseUrl, bucket = 'book-pages' }) {
  function assertConfigured() {
    if (!supabaseUrl) {
      throw new Error('Supabase no está configurado (supabaseUrl ausente en config/env.public.js).');
    }
  }

  async function getPageImageUrl({ bookId, pageNumber }) {
    assertConfigured();
    const path = `${bookId}/page-${formatPageNumber(pageNumber)}.webp`;
    return buildPublicStorageUrl({ supabaseUrl, bucket, path });
  }

  return Object.freeze({ getPageImageUrl });
}
