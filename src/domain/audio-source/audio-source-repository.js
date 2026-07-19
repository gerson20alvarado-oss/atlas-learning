/**
 * domain/audio-source/audio-source-repository.js
 *
 * Único punto de entrada del dominio para resolver la URL de una
 * pista de audio — análogo a page-source-repository.js. El panel de
 * audio (presentación) consume este módulo, nunca
 * audio-source-contract.js ni el adaptador directamente (regla de
 * vecinos, Software Architecture §9.2–9.3) — exactamente la
 * separación que faltaba antes de esta corrección.
 */

export function createAudioSourceRepository(audioSourceService) {
  async function getAudioUrl(assetPath) {
    if (!assetPath) return null;
    return audioSourceService.getAudioUrl(assetPath);
  }

  return Object.freeze({ getAudioUrl });
}
