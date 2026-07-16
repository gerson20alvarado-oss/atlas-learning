/**
 * presentation/components/back-nav/back-nav.js
 *
 * Back-nav (Design System §15.1): texto plano "‹ {nombre del nivel
 * padre exacto}" — nunca "back", nunca un salto de nivel (Wireframe
 * Review §4). type-ui-caption, text-muted, hit area 44px.
 *
 * Componente puro: recibe el label del padre y un callback — no
 * decide a dónde navega ni conoce el router.
 */

export function createBackNav({ parentLabel, onSelect }) {
  const element = document.createElement('button');
  element.setAttribute('data-component', 'back-nav');
  element.setAttribute('type', 'button');

  function render(label) {
    element.textContent = `‹ ${label}`;
  }

  render(parentLabel);
  element.addEventListener('click', () => onSelect?.());

  function update(nextProps = {}) {
    if (nextProps.parentLabel) {
      render(nextProps.parentLabel);
    }
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
