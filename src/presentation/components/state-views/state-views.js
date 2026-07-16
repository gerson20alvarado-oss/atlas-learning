/**
 * presentation/components/state-views/state-views.js
 *
 * Loading / error / empty como una capacidad genérica de cualquier
 * región renderizable, no como casos especiales bolted-on por
 * pantalla (Software Architecture §17.4; Sprint 1 Plan §9.3). Un
 * único componente parametrizado por "kind", en vez de tres vistas
 * separadas que podrían divergir entre sí con el tiempo.
 *
 * No decide el copy definitivo — usa texto neutral de marcador de
 * posición. La voz de producto final es Design System scope, no
 * disponible en Sprint 1 (Sprint 1 Plan §16, riesgo documentado).
 */

const DEFAULT_MESSAGES = Object.freeze({
  loading: 'Cargando…',
  error: 'Algo no salió como esperábamos.',
  empty: 'Todavía no hay nada aquí.',
});

export function createStateView({ kind, message } = { kind: 'empty' }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'state-view');
  element.setAttribute('data-state-kind', kind);
  element.textContent = message ?? DEFAULT_MESSAGES[kind] ?? '';

  function update(nextProps) {
    if (!nextProps) return;
    const nextKind = nextProps.kind ?? kind;
    element.setAttribute('data-state-kind', nextKind);
    element.textContent = nextProps.message ?? DEFAULT_MESSAGES[nextKind] ?? '';
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
