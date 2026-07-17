/**
 * presentation/screens/book/book-screen.js
 *
 * Book screen (Wireframe Review §2.3): "‹ library" back-nav, título
 * alineado a la izquierda, progreso acumulado del libro, lista
 * secuencial de unidades con su propia whisper bar (Design System
 * §13.2 — unit row variant, §14.2). Sin acción primaria — el tap en
 * la fila es la única interacción.
 *
 * Componente puro: recibe `book` (ya validado por content-repository)
 * con progreso ya computado, y los callbacks `onBack` / `onSelectUnit`
 * — no conoce content-repository, router ni event bus.
 */

import { createBackNav } from '../../components/back-nav/back-nav.js';
import { createProgressBar } from '../../components/progress-bar/progress-bar.js';
import { createListRow } from '../../components/list-row/list-row.js';

export function createBookScreen({ book, onBack, onSelectUnit }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'book-screen');

  const backNav = createBackNav({ parentLabel: 'library', onSelect: onBack });

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = book.title;

  const bookProgressBar = createProgressBar({
    completed: book.progress.completed,
    total: book.progress.total,
    label: `Progreso acumulado de ${book.title}`,
  });
  bookProgressBar.element.setAttribute('data-part', 'book-progress');

  const unitList = document.createElement('div');
  unitList.setAttribute('data-part', 'unit-list');
  unitList.setAttribute('role', 'list');

  const unitRows = book.units.map((unit) => {
    // Sprint 2 (Roadmap Phase 2) no incluye la screen de Unit — solo
    // se pasa onSelect cuando quien compone la pantalla (app/) provee
    // un handler real, para no renderizar una fila "interactiva" que
    // en realidad no lleva a ningún lado (ver route-table.js).
    const row = createListRow({
      title: unit.title,
      progress: unit.progress,
      onSelect: onSelectUnit ? () => onSelectUnit(unit.id) : null,
    });
    row.element.setAttribute('role', 'listitem');
    unitList.appendChild(row.element);
    return row;
  });

  element.appendChild(backNav.element);
  element.appendChild(heading);
  element.appendChild(bookProgressBar.element);
  element.appendChild(unitList);

  function update() {
    // Sprint 2 no re-renderiza Book screen con props cambiantes en
    // caliente — un cambio de libro navega a una instancia nueva de
    // la screen (content-region.render), consistente con cómo
    // Sprint 1 ya trata los cambios de screen.
  }

  function destroy() {
    backNav.destroy();
    bookProgressBar.destroy();
    unitRows.forEach((row) => row.destroy());
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
