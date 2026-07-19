/**
 * storage/public-storage-url.js
 *
 * Única pieza de todo el sistema que sabe cómo se construye la URL
 * pública de un objeto en Supabase Storage. Antes de esta sesión,
 * `supabase-page-source-adapter.js` tenía esta construcción escrita
 * una vez; al añadir audio a Storage, `audio-panel.js` la duplicó
 * directamente dentro de un componente de presentación — exactamente
 * la fuga de detalles de infraestructura que el patrón contrato +
 * adapter existe para evitar. Esta función es la corrección: un
 * único lugar, reutilizado por cualquier adapter de bucket público
 * que exista o que se añada en el futuro — ninguno vuelve a escribir
 * el patrón de la URL por su cuenta.
 *
 * Codifica cada segmento de la ruta (nunca las barras que los
 * separan) — necesario desde que los nombres de archivo de audio
 * conservan la nomenclatura original del editor, que incluye
 * espacios ("Hi Korean 3A_SB_04.mp3"). Un único lugar donde esto se
 * resuelve, no una responsabilidad repetida en cada adapter.
 */

export function buildPublicStorageUrl({ supabaseUrl, bucket, path }) {
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}
