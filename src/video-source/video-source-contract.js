/**
 * video-source/video-source-contract.js
 *
 * VideoSource — mismo patrón exacto que `audio-source-contract.js`,
 * aplicado a video en vez de audio. Exclusivo de American Language
 * Hub — Hi! Korean nunca lo importa ni lo necesita.
 *
 * `assetPath` ya es la ruta completa relativa al bucket (incluye el
 * `bookId` como carpeta), igual que en AudioSource — este contrato
 * no la reconstruye, solo la resuelve a una URL real.
 */

export function createVideoSourceService(adapter, errorBoundary) {
  async function getVideoUrl(assetPath) {
    try {
      const url = await adapter.getVideoUrl(assetPath);
      return url ?? null;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'video-source-resolve-failed', assetPath, err: String(err) });
      return null;
    }
  }

  return Object.freeze({ getVideoUrl });
}
