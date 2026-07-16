/**
 * presentation/components/ghost-slot/ghost-slot.js
 *
 * Celda fantasma de la Library (Design System §13.3; Wireframe
 * Review P4 — "the shelf assumes company"): 2:3, borde punteado,
 * fill recessed, sin label, sin "+", sin call to action. No es
 * interactivo — la plataforma es cerrada, los estudiantes no
 * agregan libros por su cuenta (Decision Log 001).
 */

export function createGhostSlot() {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'ghost-slot');
  element.setAttribute('aria-hidden', 'true');

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
