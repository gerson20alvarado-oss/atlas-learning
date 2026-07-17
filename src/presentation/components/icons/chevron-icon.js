/**
 * presentation/components/icons/chevron-icon.js
 *
 * Construcción real del ícono "chevron" ya aprobado en el set
 * cerrado de doce (Design System §10.2: chevron-left en back-nav,
 * chevron-right en list-row) — antes ambos vivían como caracteres de
 * texto plano ("‹", "›"), no como el ícono construido que el propio
 * §10.3 especifica. Esto NO es un ícono nuevo (Sprint 7, Objetivo E,
 * extensión — "la misma justificación que una pantalla nueva" no
 * aplica aquí porque ya está en el set aprobado); es terminar de
 * construir uno que ya lo estaba.
 *
 * Especificación exacta (§10.3):
 *   - Trazo (stroke-based), 1.5px, terminaciones redondeadas.
 *   - Grilla 20×20 (uso inline con texto — el caso de ambos
 *     consumidores de este ícono).
 *   - Color: hereda el color de texto que acompaña (currentColor),
 *     nunca un color propio (WR P7).
 *
 * No es un sistema de iconos genérico — un único constructor para el
 * único ícono que hoy necesita dos orientaciones. Un ícono nuevo
 * fuera del set de §10.2 seguiría requiriendo la misma justificación
 * que una pantalla nueva.
 */

const PATHS = Object.freeze({
  left: 'M12.5 4 L7 10 L12.5 16',
  right: 'M7.5 4 L13 10 L7.5 16',
});

export function createChevronIcon({ direction = 'right' } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('data-component', 'chevron-icon');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', PATHS[direction] ?? PATHS.right);
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);

  return svg;
}
