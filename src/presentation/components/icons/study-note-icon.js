/**
 * presentation/components/icons/study-note-icon.js
 *
 * Ícono de la pestaña del Espacio de Estudio — mismo criterio de
 * construcción que chevron-icon.js/media-icons.js: trazo 1.5px, sin
 * relleno, grilla 24×24, color heredado vía currentColor. Una hoja
 * con una línea de texto y un lápiz superpuesto — "notas", no
 * "ejercicio" (ese ícono ya no aplica aquí, el Espacio de Estudio
 * dejó de conocer el Exercise Engine).
 */

const NS = 'http://www.w3.org/2000/svg';

export function createStudyNoteIcon() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  function path(d) {
    const el = document.createElementNS(NS, 'path');
    el.setAttribute('d', d);
    el.setAttribute('stroke', 'currentColor');
    el.setAttribute('stroke-width', '1.5');
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(el);
    return el;
  }

  // Hoja con esquina doblada
  path('M6 3.5 H14 L18 7.5 V20.5 H6 Z');
  path('M14 3.5 V7.5 H18');
  // Línea de texto
  path('M8.5 12.5 H15.5');
  path('M8.5 16 H12.5');

  return svg;
}
