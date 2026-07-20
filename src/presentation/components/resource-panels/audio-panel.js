/**
 * presentation/components/resource-panels/audio-panel.js
 *
 * Contenido del recurso de audio (Sprint Proposal — Nuevo Reader,
 * Etapa 8). Reutiliza `createContentBlock`/`createAudioMedia`
 * (Sprint 8) sin ninguna modificación — solo construye el objeto con
 * forma de ContentBlock que ese componente ya espera.
 *
 * Corrección de UX (esta sesión): ya no se auto-envuelve en
 * `resource-panel-overlay` (modal centrado, cubría el libro). Expone
 * su contenido en bruto — `{ element, destroy }` — para que quien lo
 * monte (page-reader-screen.js) decida el contenedor. Hoy es un
 * drawer inferior compacto (audio-drawer.js); el contenido en sí no
 * cambió en absoluto.
 *
 * Este componente ya no conoce Storage en absoluto — recibe
 * `audioSourceRepository` ya compuesto (mismo patrón que PageSource)
 * y solo le pide la URL.
 *
 * `createAudioMedia` (media-block.js, Sprint 8, congelado) no admite
 * cambiar `src` después de creado — su `update()` es intencionalmente
 * un stub vacío. Por eso la URL se resuelve antes de crear el
 * bloque: el contenedor aparece de inmediato (vacío, brevemente), y
 * el reproductor real se monta en cuanto `audioSourceRepository`
 * resuelve — nunca al revés.
 *
 * Restauración de posición: NO implementada en esta etapa —
 * `AudioPosition` (Technical Specification v2.1, §5.2) quedó
 * definida en el modelo pero nunca se agendó como componente a
 * construir en el Sprint Proposal. El reproductor funciona
 * completo; simplemente no recuerda dónde quedó el estudiante entre
 * visitas — hallazgo registrado, no una decisión arquitectónica
 * nueva tomada aquí.
 */

import { createContentBlock } from '../content-blocks/content-block-renderer.js';

export function createAudioPanel({ resource, audioSourceRepository }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'audio-panel-content');

  let audioBlock = null;
  let destroyed = false;

  audioSourceRepository.getAudioUrl(resource.assetPath).then((url) => {
    if (destroyed) return; // el drawer ya se cerró antes de que la URL resolviera

    audioBlock = createContentBlock({
      id: `audio-${resource.pageNumber}`,
      type: 'media',
      mediaType: 'audio',
      src: url ?? '',
      caption: null,
      restorePosition: 0,
      onPositionChange: () => {}, // sin persistencia todavía — ver nota de alcance arriba
    });
    element.appendChild(audioBlock.element);
  });

  function destroy() {
    destroyed = true;
    audioBlock?.destroy();
    element.remove();
  }

  return Object.freeze({ element, destroy });
}
