/**
 * presentation/components/page-marker-layer/page-marker-layer.js
 *
 * Dibuja los marcadores ya resueltos (`{ resource, position }[]`,
 * domain/page-layout/page-marker-resolver.js) sobre el lienzo de una
 * página. Al tocar uno, invoca `onSelect(resource)` — no decide qué
 * abrir; eso lo resuelve quien lo monta (page-reader-screen.js, por
 * `resource.type`).
 *
 * Rediseño de esta sesión (referencia visual del usuario): `audio` y
 * `transcript` — los dos únicos tipos que hoy generan marcador
 * anclado a una página — se dibujan como tarjetas con su propio
 * contenido, no como un punto genérico. El contrato de entrada/salida
 * no cambió: sigue siendo `{ resource, position }[]` y `onSelect`,
 * reutilizando exactamente los mismos eventos de siempre — solo
 * cambió cómo se ve cada tarjeta por dentro.
 *
 * Componente puro: no conoce PageSource, Exercise Engine, ni ningún
 * panel. Redibuja por completo en cada `update()` — igual que ya se
 * demostró en la Vista de Página anterior, esto es lo que garantiza
 * que cambiar de página no deje marcadores duplicados.
 */

import { createHeadphoneIcon, createDocumentTextIcon, createPlayCircleIcon } from '../icons/card-marker-icons.js';
import { createChevronIcon } from '../icons/chevron-icon.js';

function buildAudioCard(resource) {
  const icon = createHeadphoneIcon();
  icon.setAttribute('data-part', 'marker-icon');

  const label = document.createElement('span');
  label.setAttribute('data-part', 'marker-label');
  label.textContent = resource.trackLabel ?? 'Audio';

  const play = createPlayCircleIcon({ size: 32 });
  play.setAttribute('data-part', 'marker-play');

  return [icon, label, play];
}

function buildTranscriptCard() {
  const icon = createDocumentTextIcon();
  icon.setAttribute('data-part', 'marker-icon');

  const label = document.createElement('span');
  label.setAttribute('data-part', 'marker-label');
  label.textContent = 'Transcripción';

  const chevron = createChevronIcon({ direction: 'right' });
  chevron.setAttribute('data-part', 'marker-chevron');

  return [icon, label, chevron];
}

const CARD_BUILDERS = Object.freeze({
  audio: buildAudioCard,
  transcript: buildTranscriptCard,
});

export function createPageMarkerLayer({ markers = [], onSelect }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'page-marker-layer');

  function render(nextMarkers) {
    element.replaceChildren(
      ...nextMarkers.map(({ resource, position }) => {
        const marker = document.createElement('button');
        marker.type = 'button';
        marker.setAttribute('data-part', 'marker');
        marker.setAttribute('data-resource-type', resource.type);
        marker.setAttribute('aria-label', resourceLabel(resource));
        marker.style.left = `${position.x * 100}%`;
        marker.style.top = `${position.y * 100}%`;
        marker.addEventListener('click', () => onSelect?.(resource));

        const build = CARD_BUILDERS[resource.type];
        if (build) {
          build(resource).forEach((child) => marker.appendChild(child));
        }

        return marker;
      }),
    );
  }

  function resourceLabel(resource) {
    switch (resource.type) {
      case 'audio':
        return `Reproducir ${resource.trackLabel ?? 'audio'}`;
      case 'transcript':
        return 'Ver transcripción';
      default:
        return 'Recurso';
    }
  }

  render(markers);

  function update(nextProps = {}) {
    if (nextProps.markers) render(nextProps.markers);
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
