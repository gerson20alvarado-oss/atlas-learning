/**
 * presentation/components/content-blocks/table-block.js
 *
 * Table (Design System §19.8): contenido comparativo estructurado.
 * Solo reglas hairline, sin cebra, sin fila de encabezado rellena.
 * Encabezados en type-ui-label/text-ui; celdas en voz de lectura.
 * Scroll horizontal contenido dentro del bloque si es más ancho que
 * la columna — nunca un scroll-hijack de página completa.
 */

export function createTableBlock(block) {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-component', 'table-block');

  const table = document.createElement('table');

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const header of block.headers) {
    const th = document.createElement('th');
    th.className = 'al-type-ui-label';
    th.textContent = header;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');
  for (const row of block.rows) {
    const tr = document.createElement('tr');
    for (const cell of row) {
      const td = document.createElement('td');
      td.className = 'al-type-reading-body';
      td.textContent = cell;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  wrapper.appendChild(table);

  function update() {}

  function destroy() {
    wrapper.remove();
  }

  return Object.freeze({ element: wrapper, update, destroy });
}
