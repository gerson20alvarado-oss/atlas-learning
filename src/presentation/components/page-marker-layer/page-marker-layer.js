/**
 * presentation/components/page-marker-layer/page-marker-layer.js
 *
 * Dibuja los marcadores ya resueltos (`{ resource, position }[]`,
 * domain/page-layout/page-marker-resolver.js) sobre el lienzo de una
 * página. Al tocar uno, invoca `onSelect(resource)` — no decide qué
 * abrir; eso lo resuelve quien lo monta (page-reader-screen.js, por
 * `resource.type`).
 *
 * Componente puro: no conoce PageSource, Exercise Engine, ni ningún
 * panel. Redibuja por completo en cada `update()` — igual que ya se
 * demostró en la Vista de Página anterior, esto es lo que garantiza
 * que cambiar de página no deje marcadores duplicados.
 */

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
        marker.setAttribute('aria-label', resourceLabel(resource.type));
        marker.style.left = `${position.x * 100}%`;
        marker.style.top = `${position.y * 100}%`;
        marker.addEventListener('click', () => onSelect?.(resource));
        return marker;
      }),
    );
  }

  function resourceLabel(type) {
    switch (type) {
      case 'audio':
        return 'Reproducir audio';
      case 'transcript':
        return 'Ver transcripción';
      case 'studyWorkspace':
        return 'Abrir Espacio de Estudio';
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
