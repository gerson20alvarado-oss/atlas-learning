/**
 * audio-source/audio-source-contract.js
 *
 * AudioSource: la fuente que resuelve la URL real de una pista de
 * audio del libro — mismo patrón exacto que `page-source-contract.js`
 * ya usa para las páginas, aplicado aquí en vez de dejar que
 * `audio-panel.js` conociera Storage directamente (corrección de
 * esta sesión). Interfaz asíncrona por el mismo motivo que
 * PageSource: aunque la implementación de hoy (bucket público, URL
 * determinística) no necesita ninguna espera real, el contrato deja
 * espacio a una futura implementación que sí la necesite, sin
 * obligar a cambiarlo.
 *
 * `assetPath` ya es la ruta completa relativa al bucket, tal como la
 * declara `page-resource-catalog.js` (incluye el `bookId` como
 * carpeta) — este contrato no la reconstruye, solo la resuelve a una
 * URL real.
 *
 * Contrato: getAudioUrl(assetPath) → string | null. `null` significa
 * "esta pista no tiene URL resoluble" — nunca un error que rompa el
 * panel; mismo aviso neutral que ya usa el resto de Atlas para
 * contenido no resuelto.
 */

export function createAudioSourceService(adapter, errorBoundary) {
  async function getAudioUrl(assetPath) {
    try {
      const url = await adapter.getAudioUrl(assetPath);
      return url ?? null;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'audio-source-resolve-failed', assetPath, err: String(err) });
      return null;
    }
  }

  return Object.freeze({ getAudioUrl });
}
