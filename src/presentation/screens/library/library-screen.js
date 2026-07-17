/**
 * presentation/screens/library/library-screen.js
 *
 * Library screen (Wireframe Review §2.2; Design System §7.3, §13.1,
 * §13.3): grid de portadas, no una lista. Progreso susurro por
 * portada, sin otra metadata. Ghost slots completan la primera fila
 * cuando hay menos libros que columnas — el estante asume compañía
 * (WR P4) sin fingir inventario infinito.
 *
 * "N libros es la regla" (C8): este componente siempre itera una
 * colección, incluso cuando `books` tiene un único elemento.
 *
 * Componente puro con el contrato {element, update, destroy}. Recibe
 * `books` ya cargados y validados por quien compone la screen
 * (app/), y un callback `onSelectBook(bookId)` — no conoce
 * content-repository, router ni event bus (regla de vecinos).
 */

import { createBackNav } from '../../components/back-nav/back-nav.js';
import { createBookCard } from '../../components/book-card/book-card.js';
import { createGhostSlot } from '../../components/ghost-slot/ghost-slot.js';

// Espejo de Design System §8.1 (breakpoints) y §7.3 (columnas del
// shelf grid por breakpoint). No se recalculan desde CSS para poder
// saber, en JS, cuántos ghost slots completan la primera fila.
const SHELF_BREAKPOINTS = Object.freeze([
  { query: '(min-width: 1024px)', columns: 4 },
  { query: '(min-width: 600px)', columns: 3 },
  { query: '(min-width: 0px)', columns: 2 },
]);

function resolveColumnsForCurrentViewport() {
  for (const { query, columns } of SHELF_BREAKPOINTS) {
    if (window.matchMedia(query).matches) return columns;
  }
  return 2;
}

export function createLibraryScreen({ books, onBack, onSelectBook }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'library-screen');

  const backNav = createBackNav({ parentLabel: 'home', onSelect: onBack });

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = 'Library';

  const shelf = document.createElement('div');
  shelf.setAttribute('data-part', 'shelf');
  shelf.setAttribute('role', 'list');

  element.appendChild(backNav.element);
  element.appendChild(heading);
  element.appendChild(shelf);

  let currentBooks = books;
  let childComponents = [];
  const mediaQueryLists = SHELF_BREAKPOINTS.map(({ query }) => window.matchMedia(query));

  function renderShelf() {
    childComponents.forEach((child) => child.destroy());
    childComponents = [];
    shelf.innerHTML = '';

    for (const book of currentBooks) {
      const card = createBookCard({
        title: book.title,
        progress: book.progress,
        coverUrl: book.coverUrl ?? null,
        onSelect: () => onSelectBook?.(book.id),
      });
      card.element.setAttribute('role', 'listitem');
      shelf.appendChild(card.element);
      childComponents.push(card);
    }

    const columns = resolveColumnsForCurrentViewport();
    const ghostCount = Math.max(0, columns - currentBooks.length);
    for (let i = 0; i < ghostCount; i += 1) {
      const ghost = createGhostSlot();
      ghost.element.setAttribute('role', 'listitem');
      shelf.appendChild(ghost.element);
      childComponents.push(ghost);
    }
  }

  renderShelf();

  function handleViewportChange() {
    renderShelf();
  }

  mediaQueryLists.forEach((mql) => mql.addEventListener('change', handleViewportChange));

  function update(nextProps = {}) {
    if (nextProps.books) {
      currentBooks = nextProps.books;
      renderShelf();
    }
  }

  function destroy() {
    mediaQueryLists.forEach((mql) => mql.removeEventListener('change', handleViewportChange));
    childComponents.forEach((child) => child.destroy());
    backNav.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
