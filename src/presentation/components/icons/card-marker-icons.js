/**
 * presentation/components/icons/card-marker-icons.js
 *
 * Íconos de las tarjetas de Audio y Transcripción sobre la página
 * (rediseño de esta sesión, referencia visual del usuario). Mismo
 * criterio de construcción que el resto del set (trazo 1.5px, sin
 * relleno, currentColor) — con una única excepción deliberada: el
 * triángulo del botón Play va relleno, porque a 12px de alto un
 * trazo fino no se lee con claridad. Mismo criterio de excepción ya
 * documentado en el Design System para bookmark-filled y el
 * check/cross de feedback — un ícono funcional muy pequeño necesita
 * relleno para seguir siendo legible, no por preferencia estética.
 */

const NS = 'http://www.w3.org/2000/svg';

function strokeIcon(paths, { size = 20 } = {}) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  paths.forEach((d) => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
  });
  return svg;
}

export function createHeadphoneIcon() {
  return strokeIcon([
    'M4 13.5 V12 A8 8 0 0 1 20 12 V13.5',
    'M4 13.5 V17 A2 2 0 0 0 6 19 H6.5 A1.5 1.5 0 0 0 8 17.5 V15 A1.5 1.5 0 0 0 6.5 13.5 H4 Z',
    'M20 13.5 V17 A2 2 0 0 1 18 19 H17.5 A1.5 1.5 0 0 1 16 17.5 V15 A1.5 1.5 0 0 1 17.5 13.5 H20 Z',
  ]);
}

export function createDocumentTextIcon() {
  return strokeIcon([
    'M6 3.5 H14 L18 7.5 V20.5 H6 Z',
    'M14 3.5 V7.5 H18',
    'M8.5 12.5 H15.5',
    'M8.5 15.5 H15.5',
    'M8.5 18.5 H12.5',
  ]);
}

/**
 * Botón Play circular — fondo de color (heredado del contenedor vía
 * currentColor en el círculo) con triángulo relleno en blanco.
 */
export function createPlayCircleIcon({ size = 32 } = {}) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const circle = document.createElementNS(NS, 'circle');
  circle.setAttribute('cx', '16');
  circle.setAttribute('cy', '16');
  circle.setAttribute('r', '16');
  circle.setAttribute('fill', 'currentColor');
  svg.appendChild(circle);

  const triangle = document.createElementNS(NS, 'path');
  triangle.setAttribute('d', 'M12.5 10 L22 16 L12.5 22 Z');
  triangle.setAttribute('fill', 'var(--al-paper-0)');
  svg.appendChild(triangle);

  return svg;
}
