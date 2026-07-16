/**
 * presentation/components/content-blocks/term-block.js
 *
 * Term (Design System §19.3): pares término-significado. Cada
 * entrada separada por un divisor hairline. El toggle de favorito
 * ("may host", §19.3) queda deliberadamente fuera — Favorites no
 * tiene persistencia ni fase asignada en el Roadmap todavía.
 */

export function createTermBlock(block) {
  const element = document.createElement('dl');
  element.setAttribute('data-component', 'term-block');

  for (const entry of block.entries) {
    const row = document.createElement('div');
    row.setAttribute('data-part', 'entry');

    const term = document.createElement('dt');
    term.className = 'al-type-reading-body';
    term.setAttribute('data-part', 'term');
    term.textContent = entry.term;

    const meaning = document.createElement('dd');
    meaning.className = 'al-type-reading-body';
    meaning.setAttribute('data-part', 'meaning');
    meaning.textContent = entry.meaning;

    row.appendChild(term);
    row.appendChild(meaning);

    if (entry.example) {
      const example = document.createElement('p');
      example.className = 'al-type-reading-caption';
      example.setAttribute('data-part', 'example');
      example.textContent = entry.example;
      row.appendChild(example);
    }

    element.appendChild(row);
  }

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
