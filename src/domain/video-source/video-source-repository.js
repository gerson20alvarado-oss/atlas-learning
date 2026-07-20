/**
 * domain/video-source/video-source-repository.js
 *
 * Único punto de entrada del dominio para resolver la URL de un
 * video — análogo a audio-source-repository.js. El panel de video
 * (presentación) consume este módulo, nunca el contrato ni el
 * adaptador directamente (regla de vecinos).
 */

export function createVideoSourceRepository(videoSourceService) {
  async function getVideoUrl(assetPath) {
    if (!assetPath) return null;
    return videoSourceService.getVideoUrl(assetPath);
  }

  return Object.freeze({ getVideoUrl });
}
