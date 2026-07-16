/**
 * presentation/components/content-region/content-region.js
 *
 * Región donde cada screen futura (presentation/screens/*) se
 * monta (Sprint 1 Plan §5). En Sprint 1 no existe ninguna screen de
 * dominio todavía — este componente solo expone la capacidad de
 * montar/desmontar un componente hijo que cumpla el contrato
 * {element, update, destroy}, sin saber qué es ese hijo.
 */

export function createContentRegion() {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'content-region');

  let currentChild = null;

  function render(childComponent) {
    clear();
    currentChild = childComponent;
    element.appendChild(childComponent.element);
  }

  function clear() {
    if (currentChild) {
      currentChild.destroy();
      currentChild = null;
    }
    element.innerHTML = '';
  }

  function update(nextProps) {
    currentChild?.update(nextProps);
  }

  function destroy() {
    clear();
    element.remove();
  }

  return Object.freeze({ element, render, clear, update, destroy });
}
