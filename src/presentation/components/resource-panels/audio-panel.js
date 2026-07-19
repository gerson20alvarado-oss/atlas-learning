/**
 * presentation/components/resource-panels/audio-panel.js
 *
 * Panel de recurso de audio (Sprint Proposal — Nuevo Reader, Etapa
 * 8). Reutiliza `createContentBlock`/`createAudioMedia` (Sprint 8)
 * sin ninguna modificación — solo construye el objeto con forma de
 * ContentBlock que ese componente ya espera.
 *
 * Corrección de esta sesión: este componente ya no conoce Storage en
 * absoluto. Antes construía la URL de Supabase directamente aquí —
 * exactamente la fuga de detalles de infraestructura que el patrón
 * contrato + adapter existe para evitar (regla de vecinos, Software
 * Architecture §9.2–9.3). Ahora recibe `audioSourceRepository` ya
 * compuesto (mismo patrón que PageSource) y solo le pide la URL —
 * nunca sabe si esa URL viene de un bucket público, un CDN, o
 * cualquier otra cosa en el futuro.
 *
 * `createAudioMedia` (media-block.js, Sprint 8, congelado) no admite
 * cambiar `src` después de creado — su `update()` es intencionalmente
 * un stub vacío. En vez de tocar ese archivo, la URL se resuelve
 * antes de crear el bloque: el overlay aparece de inmediato (cierre
 * y título ya visibles), y el reproductor real se monta en cuanto
 * `audioSourceRepository` resuelve — nunca al revés.
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

export function createAudioPanel({ resource, audioSourceRepository, onClose }) {
  const overlay = createResourcePanelOverlay({ title: resource.pageTemplate, onClose });

  let audioBlock = null;
  let destroyed = false;

  audioSourceRepository.getAudioUrl(resource.assetPath).then((url) => {
    if (destroyed) return; // el panel ya se cerró antes de que la URL resolviera

    audioBlock = createContentBlock({
      id: `audio-${resource.pageNumber}`,
      type: 'media',
      mediaType: 'audio',
      src: url ?? '',
      caption: null,
      restorePosition: 0,
      onPositionChange: () => {}, // sin persistencia todavía — ver nota de alcance arriba
    });
    overlay.setContent(audioBlock.element);
  });

  function destroy() {
    destroyed = true;
    audioBlock?.destroy();
    overlay.destroy();
  }

  return Object.freeze({ element: overlay.element, destroy });
}
