/**
 * presentation/components/resource-panels/transcript-panel.js
 *
 * Panel de solo lectura. El contenido real de la transcripción vive
 * en el apéndice del libro (pp. 208–212), todavía no producido ni
 * subido (hallazgo registrado desde la Etapa 3) — se muestra un
 * estado honesto en vez de fabricar texto, mismo criterio ya
 * aplicado desde Sprint 8 ("no fabriques audio, no inventes
 * assets").
 */

import { createResourcePanelOverlay } from '../resource-panel-overlay/resource-panel-overlay.js';

export function createTranscriptPanel({ resource, onClose }) {
  const overlay = createResourcePanelOverlay({ title: `Transcripción — ${resource.pageTemplate}`, onClose });

  const content = document.createElement('p');
  content.className = 'al-type-ui-caption';
  content.textContent = resource.sourcePageRef
    ? 'La transcripción todavía no está disponible — pendiente de producir el apéndice del libro.'
    : 'Este recurso no tiene transcripción asociada.';

  overlay.setContent(content);

  return Object.freeze({ element: overlay.element, destroy: overlay.destroy });
}
