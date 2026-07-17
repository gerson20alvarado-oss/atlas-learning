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

function applyKind(element, kind, message) {
  element.setAttribute('data-state-kind', kind);
  const text = message ?? DEFAULT_MESSAGES[kind] ?? '';
  if (kind === 'loading') {
    // §22.5: la barra de 2px (CSS) es la única señal visual — nada
    // de texto en pantalla. El mensaje sigue anunciándose a lectores
    // de pantalla (§23.3, "la restricción visual no es ocultar
    // información") mediante un nodo visualmente oculto.
    element.textContent = '';
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    const srOnly = document.createElement('span');
    srOnly.setAttribute('data-part', 'sr-only');
    srOnly.textContent = text;
    element.appendChild(srOnly);
  } else {
    element.removeAttribute('role');
    element.removeAttribute('aria-live');
    element.textContent = text;
  }
}

export function createStateView({ kind, message } = { kind: 'empty' }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'state-view');
  applyKind(element, kind, message);

  function update(nextProps) {
    if (!nextProps) return;
    applyKind(element, nextProps.kind ?? kind, nextProps.message);
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
