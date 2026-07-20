/**
 * image-source/image-source-contract.js
 *
 * ImageSource — mismo patrón exacto que `video-source-contract.js` y
 * `audio-source-contract.js`, aplicado a imágenes fijas del Video
 * Hub (ej. la foto impresa junto a Comprehension Exercise A, que el
 * estudiante necesita ver para responder — no un recurso dentro del
 * video en sí, por eso vive separado de VideoSource). Exclusivo de
 * American Language Hub — Hi! Korean nunca lo importa ni lo
 * necesita (ya tiene su propio PageSource para páginas de libro,
 * un concepto distinto).
 *
 * `assetPath` ya es la ruta completa relativa al bucket (incluye el
 * `bookId` como carpeta), igual que en VideoSource/AudioSource —
 * este contrato no la reconstruye, solo la resuelve a una URL real.
 */

export function createImageSourceService(adapter, errorBoundary) {
  async function getImageUrl(assetPath) {
    try {
      const url = await adapter.getImageUrl(assetPath);
      return url ?? null;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'image-source-resolve-failed', assetPath, err: String(err) });
      return null;
    }
  }

  return Object.freeze({ getImageUrl });
}
