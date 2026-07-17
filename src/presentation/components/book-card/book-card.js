/**
 * presentation/components/book-card/book-card.js
 *
 * Book cover card (Design System §13.1): 2:3, imagen edge-to-edge,
 * border-hairline, radius-lg; debajo, título (type-ui-label,
 * text-ui, una línea) + whisper bar. Sin autor, sin porcentaje, sin
 * metadata (Wireframe Review §2.2). Toda la card es el tap target.
 *
 * R1 (Sprint 7, Objetivo E — decisión de Producto): cuando existe
 * portada editorial real (`coverUrl`), se muestra íntegra —
 * proporción original respetada, sin recorte, sin filtro, sin
 * reinterpretación gráfica. El contenedor 2:3 permanece uniforme
 * (--al-cover-aspect no cambia, Library sigue siendo una cuadrícula
 * pareja); si la proporción real de la portada no llena el
 * contenedor, el espacio sobrante pertenece al contenedor (fondo
 * `surface-recessed`, el mismo que ya usaba el estado neutro) —
 * nunca se recorta la imagen para llenarlo. Sin `coverUrl`, la card
 * conserva exactamente el comportamiento neutro anterior (Sprint 2):
 * lista para recibir arte real de cualquier libro futuro sin cambiar
 * este componente.
 *
 * Componente puro: recibe { title, progress, coverUrl, onSelect } ya
 * resueltos — no conoce Book, Attempts, ni router (regla de
 * vecinos).
 */

import { createProgressBar } from '../progress-bar/progress-bar.js';

export function createBookCard({ title, progress, coverUrl = null, onSelect }) {
  const element = document.createElement('button');
  element.setAttribute('data-component', 'book-card');
  element.setAttribute('type', 'button');
  element.setAttribute('aria-label', title);

  const cover = document.createElement('div');
  cover.setAttribute('data-part', 'cover');

  if (coverUrl) {
    const coverImage = document.createElement('img');
    coverImage.setAttribute('data-part', 'cover-image');
    coverImage.src = coverUrl;
    // Decorativo: el nombre del libro ya lo anuncia aria-label del
    // botón completo y el título visible debajo — evita anunciarlo
    // dos veces a lectores de pantalla (Design System §23.3).
    coverImage.alt = '';
    cover.appendChild(coverImage);
  }

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
