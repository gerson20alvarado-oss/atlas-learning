/**
 * presentation/components/resource-panels/audio-panel.js
 *
 * Panel de recurso de audio (Sprint Proposal — Nuevo Reader, Etapa
 * 8). Reutiliza `createContentBlock`/`createAudioMedia` (Sprint 8)
 * sin ninguna modificación — solo construye el objeto con forma de
 * ContentBlock que ese componente ya espera.
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
import { createResourcePanelOverlay } from '../resource-panel-overlay/resource-panel-overlay.js';

export function createAudioPanel({ resource, runtimeConfig, onClose }) {
  const overlay = createResourcePanelOverlay({ title: resource.pageTemplate, onClose });

  const audioBlock = createContentBlock({
    id: `audio-${resource.pageNumber}`,
    type: 'media',
    mediaType: 'audio',
    src: runtimeConfig.resolveAssetPath(resource.assetPath),
    caption: null,
    restorePosition: 0,
    onPositionChange: () => {}, // sin persistencia todavía — ver nota de alcance arriba
  });

  overlay.setContent(audioBlock.element);

  function destroy() {
    audioBlock.destroy();
    overlay.destroy();
  }

  return Object.freeze({ element: overlay.element, destroy });
}
