/**
 * presentation/components/content-blocks/prose-block.js
 *
 * Prose (Design System §19.2): contenido explicativo largo. Voz de
 * lectura, párrafos separados por space-4, sin sangría de primera
 * línea. Componente puro: recibe el Content Block ya validado.
 */

export function createProseBlock(block) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'prose-block');

  for (const paragraph of block.paragraphs) {
    const p = document.createElement('p');
    p.className = 'al-type-reading-body';
    p.textContent = paragraph;
    element.appendChild(p);
  }

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
