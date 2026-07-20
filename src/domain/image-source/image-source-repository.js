/**
 * domain/image-source/image-source-repository.js
 *
 * Único punto de entrada del dominio para resolver la URL de una
 * imagen fija — análogo a video-source-repository.js/
 * audio-source-repository.js. Los componentes de ejercicio
 * (presentación) consumen este módulo, nunca el contrato ni el
 * adaptador directamente (regla de vecinos).
 */

export function createImageSourceRepository(imageSourceService) {
  async function getImageUrl(assetPath) {
    if (!assetPath) return null;
    return imageSourceService.getImageUrl(assetPath);
  }

  return Object.freeze({ getImageUrl });
}
