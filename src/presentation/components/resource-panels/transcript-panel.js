/**
 * presentation/components/resource-panels/transcript-panel.js
 *
 * Panel de solo lectura. `resource.transcriptLines` (esta sesión,
 * contenido real aportado por el usuario desde el apéndice del
 * libro) es un arreglo de `{ speaker, text }` — `speaker` es `null`
 * en un pasaje narrado, sin turnos de diálogo (p. ej. p.53). Cuando
 * no existe todavía (páginas sin producir aún), se muestra el mismo
 * estado honesto de siempre — nunca se fabrica contenido.
 */

import { createResourcePanelOverlay } from '../resource-panel-overlay/resource-panel-overlay.js';

export function createTranscriptPanel({ resource, onClose }) {
  const overlay = createResourcePanelOverlay({ title: `Transcripción — ${resource.pageTemplate}`, onClose });

  if (resource.transcriptLines?.length) {
    const container = document.createElement('div');
    container.setAttribute('data-part', 'transcript-lines');

    resource.transcriptLines.forEach(({ speaker, text }) => {
      const line = document.createElement('p');
      line.setAttribute('data-part', speaker ? 'transcript-turn' : 'transcript-narration');
      if (speaker) {
        const speakerLabel = document.createElement('strong');
        speakerLabel.textContent = speaker;
        line.appendChild(speakerLabel);
        line.appendChild(document.createTextNode(' ' + text));
      } else {
        line.textContent = text;
      }
      container.appendChild(line);
    });

    overlay.setContent(container);
  } else {
    const content = document.createElement('p');
    content.className = 'al-type-ui-caption';
    content.textContent = resource.sourcePageRef
      ? 'La transcripción todavía no está disponible — pendiente de producir el apéndice del libro.'
      : 'Este recurso no tiene transcripción asociada.';
    overlay.setContent(content);
  }

  return Object.freeze({ element: overlay.element, destroy: overlay.destroy });
}
