/**
 * presentation/components/nav-secondary/nav-secondary.js
 *
 * Fila de navegación secundaria: elementos de texto plano, con el
 * mismo peso visual entre sí (Wireframe Review §2.1 — "Library /
 * Review / Settings as equal-weight plain-text secondary row"). En
 * Sprint 1 no existen screens de destino todavía, así que se
 * instancia sin items; Sprint 2+ pasa la lista real sin tener que
 * modificar este componente.
 */

export function createSecondaryNav(items = []) {
  const element = document.createElement('nav');
  element.setAttribute('data-component', 'nav-secondary');

  function renderItems(currentItems) {
    element.innerHTML = '';
    for (const item of currentItems) {
      const navItem = document.createElement('span');
      navItem.textContent = item.label;
      navItem.setAttribute('data-nav-item', item.label);
      navItem.addEventListener('click', () => item.onSelect?.());
      element.appendChild(navItem);
    }
  }

  renderItems(items);

  function update(nextItems) {
    renderItems(nextItems ?? items);
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
