/**
 * presentation/components/book-card/book-card.js
 *
 * Book cover card (Design System §13.1): 2:3, imagen edge-to-edge,
 * border-hairline, radius-lg; debajo, título (type-ui-label,
 * text-ui, una línea) + whisper bar. Sin autor, sin porcentaje, sin
 * metadata (Wireframe Review §2.2). Toda la card es el tap target.
 *
 * No existe todavía arte de portada real (fuera de alcance de
 * Sprint 2 — ver domain/content/library-catalog.js): la región de
 * portada renderiza una superficie neutral en su lugar, lista para
 * recibir una imagen real cuando el Content Import Pipeline la
 * publique, sin cambiar este componente.
 *
 * Componente puro: recibe { title, progress, onSelect } ya
 * resueltos — no conoce Book, Attempts, ni router (regla de
 * vecinos).
 */

import { createProgressBar } from '../progress-bar/progress-bar.js';

export function createBookCard({ title, progress, onSelect }) {
  const element = document.createElement('button');
  element.setAttribute('data-component', 'book-card');
  element.setAttribute('type', 'button');
  element.setAttribute('aria-label', title);

  const cover = document.createElement('div');
  cover.setAttribute('data-part', 'cover');

  const titleElement = document.createElement('span');
  titleElement.setAttribute('data-part', 'title');
  titleElement.textContent = title;

  const progressBar = createProgressBar({
    completed: progress.completed,
    total: progress.total,
    label: `Progreso de ${title}`,
  });
  progressBar.element.setAttribute('data-part', 'progress');

  element.appendChild(cover);
  element.appendChild(titleElement);
  element.appendChild(progressBar.element);

  element.addEventListener('click', () => onSelect?.());

  function update(nextProps = {}) {
    if (nextProps.title) {
      titleElement.textContent = nextProps.title;
      element.setAttribute('aria-label', nextProps.title);
    }
    if (nextProps.progress) {
      progressBar.update(nextProps.progress);
    }
  }

  function destroy() {
    progressBar.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
