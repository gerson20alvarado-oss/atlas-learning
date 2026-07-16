/**
 * presentation/components/content-blocks/aside-block.js
 *
 * Aside (Design System §19.6): comentario de apoyo que el libro
 * separa del flujo principal. Filete izquierdo 2px border-whisper,
 * inset space-4, etiqueta opcional, cuerpo en text-ui (un paso más
 * claro que el contenido principal — presente pero deferente).
 */

export function createAsideBlock(block) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'aside-block');

  if (block.label) {
    const label = document.createElement('p');
    label.className = 'al-type-ui-caption';
    label.setAttribute('data-part', 'label');
    label.textContent = block.label;
    element.appendChild(label);
  }

  const body = document.createElement('p');
  body.className = 'al-type-reading-body';
  body.setAttribute('data-part', 'body');
  body.textContent = block.body;
  element.appendChild(body);

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
