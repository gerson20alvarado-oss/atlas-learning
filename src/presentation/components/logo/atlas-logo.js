/**
 * presentation/components/logo/atlas-logo.js
 *
 * Isotipo de Atlas Learning (Reader Visual Polish, esta sesión):
 * un libro abierto reducido a su gesto más simple — dos páginas que
 * se separan desde un lomo central, evocando a la vez "libro" y
 * "exploración" (las dos páginas como un compás abriéndose). Mismo
 * criterio de construcción que el resto del set de íconos: SVG,
 * trazo, sin decoración innecesaria.
 *
 * Reemplaza el wordmark de solo texto en app-shell.js/entry-screen.js
 * — el texto "Atlas Learning" se mantiene junto al isotipo, nunca
 * solo.
 */

const NS = 'http://www.w3.org/2000/svg';

export function createAtlasLogoMark({ size = 28 } = {}) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  function path(d, extra = {}) {
    const el = document.createElementNS(NS, 'path');
    el.setAttribute('d', d);
    el.setAttribute('stroke', 'currentColor');
    el.setAttribute('stroke-width', '1.6');
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
    svg.appendChild(el);
    return el;
  }

  // Lomo central
  path('M16 6 V26');
  // Página izquierda
  path('M16 8 C 11 7, 6 8, 4 10 V24 C 6 22, 11 21, 16 22');
  // Página derecha
  path('M16 8 C 21 7, 26 8, 28 10 V24 C 26 22, 21 21, 16 22');

  return svg;
}
