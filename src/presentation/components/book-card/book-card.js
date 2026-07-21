/**
 * presentation/components/book-card/book-card.js
 *
 * Rediseño de Library (esta sesión): la tarjeta deja de ser el tile
 * pequeño de un shelf grid (Design System §13.1, versión anterior)
 * para convertirse en una tarjeta grande — portada + columna de
 * información (título, última actividad, progreso, "Continue
 * learning") — inspirada en Apple Books/Notion/Linear, pensada para
 * sentirse como una biblioteca personal premium, no un dashboard.
 *
 * Exclusivo de Library: solo lo usa library-screen.js — ningún otro
 * archivo lo importa, así que este rediseño no puede afectar
 * ninguna otra pantalla.
 *
 * `progress-bar.js` (compartido con Hi! Korean) se reutiliza TAL
 * CUAL, sin tocarlo ni una línea — el Design System (§14.1) prohíbe
 * cifras sobre la barra ("solo Session Summary puede mostrar
 * números"), y esa regla se respeta aquí también: la mayor
 * presencia visual de la barra en esta tarjeta se logra con tamaño y
 * espaciado (ver book-card.css), nunca agregando un porcentaje.
 *
 * `lastActivity` (esta sesión): string ya resuelto por quien compone
 * (buildLibraryScreen en app/screen-router.js) — este componente no
 * sabe qué es "Writing" o "Progress Test", solo pinta el texto que
 * le llega. `null`/ausente cuando el libro no tiene el concepto
 * (Hi! Korean) — la sección completa no se renderiza, nunca un
 * hueco vacío.
 *
 * Estructura: la portada es un <button> propio (clic para abrir);
 * "Continue learning" es otro <button> independiente con la misma
 * acción — dos maneras de llegar al mismo lugar, nunca un <button>
 * anidado dentro de otro.
 *
 * Componente puro: recibe { title, progress, coverUrl, lastActivity,
 * onSelect } ya resueltos — no conoce Book, Attempts, ni router
 * (regla de vecinos).
 */

import { createProgressBar } from '../progress-bar/progress-bar.js';
import { createPrimaryButton } from '../primary-button/primary-button.js';

export function createBookCard({ title, progress, coverUrl = null, lastActivity = null, onSelect }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'book-card');

  const coverButton = document.createElement('button');
  coverButton.type = 'button';
  coverButton.setAttribute('data-part', 'cover-button');
  coverButton.setAttribute('aria-label', title);

  const cover = document.createElement('div');
  cover.setAttribute('data-part', 'cover');

  let coverImage = null;
  if (coverUrl) {
    coverImage = document.createElement('img');
    coverImage.setAttribute('data-part', 'cover-image');
    coverImage.src = coverUrl;
    // Decorativo: el nombre del libro ya lo anuncia aria-label del
    // botón de portada y el título visible en la columna de
    // información — evita anunciarlo dos veces a lectores de
    // pantalla (Design System §23.3).
    coverImage.alt = '';
    cover.appendChild(coverImage);
  }

  coverButton.appendChild(cover);
  coverButton.addEventListener('click', () => onSelect?.());

  const info = document.createElement('div');
  info.setAttribute('data-part', 'info');

  const titleElement = document.createElement('h3');
  titleElement.setAttribute('data-part', 'title');
  titleElement.className = 'al-type-title';
  titleElement.textContent = title;
  info.appendChild(titleElement);

  // Última actividad (esta sesión) — sección completa ausente
  // cuando no aplica, nunca un hueco vacío ni un placeholder.
  const lastActivitySection = document.createElement('div');
  lastActivitySection.setAttribute('data-part', 'last-activity');
  lastActivitySection.hidden = !lastActivity;

  const lastActivityLabel = document.createElement('p');
  lastActivityLabel.setAttribute('data-part', 'last-activity-label');
  lastActivityLabel.className = 'al-type-ui-caption';
  lastActivityLabel.textContent = 'Last activity';

  const lastActivityValue = document.createElement('p');
  lastActivityValue.setAttribute('data-part', 'last-activity-value');
  lastActivityValue.className = 'al-type-ui-label';
  lastActivityValue.textContent = lastActivity ?? '';

  lastActivitySection.appendChild(lastActivityLabel);
  lastActivitySection.appendChild(lastActivityValue);
  info.appendChild(lastActivitySection);

  const progressRow = document.createElement('div');
  progressRow.setAttribute('data-part', 'progress-row');

  const progressLabel = document.createElement('p');
  progressLabel.setAttribute('data-part', 'progress-label');
  progressLabel.className = 'al-type-ui-caption';
  progressLabel.textContent = 'Your progress';
  progressRow.appendChild(progressLabel);

  const progressBar = createProgressBar({
    completed: progress.completed,
    total: progress.total,
    label: `Progreso de ${title}`,
  });
  progressBar.element.setAttribute('data-part', 'progress');
  progressRow.appendChild(progressBar.element);

  info.appendChild(progressRow);

  const continueButton = createPrimaryButton({
    label: 'Continue learning',
    onClick: () => onSelect?.(),
  });
  continueButton.element.setAttribute('data-part', 'continue-button');
  info.appendChild(continueButton.element);

  element.appendChild(coverButton);
  element.appendChild(info);

  function update(nextProps = {}) {
    if (nextProps.title) {
      titleElement.textContent = nextProps.title;
      coverButton.setAttribute('aria-label', nextProps.title);
    }
    if (nextProps.progress) {
      progressBar.update(nextProps.progress);
    }
    if ('lastActivity' in nextProps) {
      lastActivitySection.hidden = !nextProps.lastActivity;
      lastActivityValue.textContent = nextProps.lastActivity ?? '';
    }
  }

  function destroy() {
    progressBar.destroy();
    continueButton.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
