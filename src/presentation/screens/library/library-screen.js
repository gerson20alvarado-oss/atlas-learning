/**
 * presentation/screens/library/library-screen.js
 *
 * Rediseño de Library (esta sesión, ajustado tras feedback de UX):
 * de una cuadrícula de portadas pequeñas (shelf grid + ghost slots)
 * a una cuadrícula adaptable de tarjetas con más presencia
 * (book-card.js rediseñado) — biblioteca personal premium, inspirada
 * en Apple Books/Notion/Linear: cada libro tiene protagonismo, pero
 * sigue sintiéndose parte de una colección, nunca una lista infinita
 * ni una sola tarjeta que ocupa toda la pantalla.
 *
 * "N libros es la regla" (C8) se conserva intacta: este componente
 * sigue iterando siempre una colección, incluso con un único
 * elemento — sin ghost slots, que ya no hacen falta: `auto-fill` +
 * `justify-content: start` (ver library-screen.css) ya resuelve por
 * su cuenta que una fila incompleta no se estire, sin necesitar
 * relleno artificial.
 *
 * `lastActivity` (esta sesión): campo opcional más en cada `book`,
 * ya resuelto por quien compone (`buildLibraryScreen`) — este
 * archivo solo lo pasa a book-card.js, nunca sabe de dónde viene.
 *
 * Componente puro con el contrato {element, update, destroy}. Recibe
 * `books` ya cargados y validados por quien compone la screen
 * (app/), y un callback `onSelectBook(bookId)` — no conoce
 * content-repository, router ni event bus (regla de vecinos).
 */

import { createBackNav } from '../../components/back-nav/back-nav.js';
import { createBookCard } from '../../components/book-card/book-card.js';

export function createLibraryScreen({ books, onBack, onSelectBook, onActivateLicense }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'library-screen');

  const backNav = createBackNav({ parentLabel: 'home', onSelect: onBack });

  const headerRow = document.createElement('div');
  headerRow.setAttribute('data-part', 'header-row');

  const headingGroup = document.createElement('div');
  headingGroup.setAttribute('data-part', 'heading-group');

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-display';
  heading.textContent = 'Library';

  const subheading = document.createElement('p');
  subheading.setAttribute('data-part', 'subtitle');
  subheading.className = 'al-type-ui-body';
  subheading.textContent = 'Your personal collection of interactive textbooks.';

  headingGroup.appendChild(heading);
  headingGroup.appendChild(subheading);
  headerRow.appendChild(headingGroup);

  // Punto de entrada único a la activación de licencias — siempre
  // visible, con cero libros o con diez (Arquitectura de Licencias,
  // §6): sin tarjetas bloqueadas, no hay ningún libro sobre el que
  // hacer clic para llegar aquí.
  const activateButton = document.createElement('button');
  activateButton.type = 'button';
  activateButton.setAttribute('data-part', 'activate-license');
  activateButton.textContent = 'Activate License Key';
  activateButton.addEventListener('click', () => onActivateLicense?.());
  headerRow.appendChild(activateButton);

  const sectionLabel = document.createElement('p');
  sectionLabel.setAttribute('data-part', 'section-label');
  sectionLabel.className = 'al-type-ui-caption';
  sectionLabel.textContent = 'Currently studying';

  const shelf = document.createElement('div');
  shelf.setAttribute('data-part', 'shelf');
  shelf.setAttribute('role', 'list');

  element.appendChild(backNav.element);
  element.appendChild(headerRow);
  element.appendChild(sectionLabel);
  element.appendChild(shelf);

  let currentBooks = books;
  let childComponents = [];

  function renderShelf() {
    childComponents.forEach((child) => child.destroy());
    childComponents = [];
    shelf.innerHTML = '';
    sectionLabel.hidden = currentBooks.length === 0;

    for (const book of currentBooks) {
      const card = createBookCard({
        title: book.title,
        progress: book.progress,
        coverUrl: book.coverUrl ?? null,
        lastActivity: book.lastActivity ?? null,
        onSelect: () => onSelectBook?.(book.id),
      });
      card.element.setAttribute('role', 'listitem');
      shelf.appendChild(card.element);
      childComponents.push(card);
    }
  }

  renderShelf();

  function update(nextProps = {}) {
    if (nextProps.books) {
      currentBooks = nextProps.books;
      renderShelf();
    }
  }

  function destroy() {
    childComponents.forEach((child) => child.destroy());
    backNav.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
