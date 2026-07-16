/**
 * presentation/components/content-blocks/example-block.js
 *
 * Example (Design System §19.7): instancias resueltas de una idea.
 * Filete izquierdo border-default (un paso más firme que Aside,
 * porque un ejemplo es contenido central, no comentario), etiqueta
 * "Example" o la que declare el libro, cuerpo en voz de lectura.
 */

export function createExampleBlock(block) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'example-block');

  const label = document.createElement('p');
  label.className = 'al-type-ui-caption';
  label.setAttribute('data-part', 'label');
  label.textContent = block.label || 'Example';
  element.appendChild(label);

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
