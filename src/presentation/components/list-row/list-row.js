/**
 * presentation/components/list-row/list-row.js
 *
 * List row genérica (Design System §13.2): fila a measure completo,
 * padding vertical space-3, título en type-ui-body/text-ui, divisor
 * hairline debajo, chevron final en text-muted cuando la fila
 * navega. El tap en la fila es la única interacción — sin swipe, sin
 * long-press (PRD §15).
 *
 * Sprint 2 la usa para las filas de Unit dentro de Book screen (con
 * su whisper bar, §14.2 — "unit row adds a whisper bar under its
 * title"). El mismo componente queda listo para las filas de Lesson,
 * Favorites y Settings en sprints futuros sin modificarse — solo
 * cambia qué props recibe.
 *
 * Componente puro: no conoce Unit, Book, ni router.
 */

import { createProgressBar } from '../progress-bar/progress-bar.js';

export function createListRow({ title, progress = null, onSelect = null }) {
  const element = document.createElement(onSelect ? 'button' : 'div');
  element.setAttribute('data-component', 'list-row');
  if (onSelect) {
    element.setAttribute('type', 'button');
  }

  const main = document.createElement('div');
  main.setAttribute('data-part', 'main');

  const titleElement = document.createElement('span');
  titleElement.setAttribute('data-part', 'title');
  titleElement.textContent = title;
  main.appendChild(titleElement);

  let progressBar = null;
  if (progress) {
    progressBar = createProgressBar({
      completed: progress.completed,
      total: progress.total,
      label: `Progreso de ${title}`,
    });
    progressBar.element.setAttribute('data-part', 'progress');
    main.appendChild(progressBar.element);
  }

  element.appendChild(main);

  if (onSelect) {
    const chevron = document.createElement('span');
    chevron.setAttribute('data-part', 'chevron');
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';
    element.appendChild(chevron);
    element.addEventListener('click', () => onSelect());
  }

  function update(nextProps = {}) {
    if (nextProps.title) {
      titleElement.textContent = nextProps.title;
    }
    if (nextProps.progress && progressBar) {
      progressBar.update(nextProps.progress);
    }
  }

  function destroy() {
    progressBar?.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
