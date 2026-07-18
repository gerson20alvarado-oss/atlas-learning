/**
 * presentation/components/icons/media-icons.js
 *
 * Construcción real de los íconos de reproductor de audio, ya
 * aprobados en el set cerrado de doce (Design System §10.2: "play /
 * pause" y "replay-10", ambos únicos entre los doce que no requieren
 * texto acompañante — "universal media control"). Mismo criterio que
 * chevron-icon.js: esto no es un ícono nuevo, es la construcción de
 * uno ya aprobado, necesaria porque hasta Sprint 8 nunca existió un
 * reproductor de audio real que los usara.
 *
 * Construcción (§10.3): trazo 1.5px, sin relleno ("no filled icons
 * except bookmark-filled y el check/cross de feedback" — play/pause/
 * replay-10 no están en esa lista de excepciones), grilla 24×24
 * (contexto de tap-target, dentro de un hit area ≥44px), color
 * heredado vía currentColor.
 */

const NS = 'http://www.w3.org/2000/svg';

function createSvgRoot() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  return svg;
}

function strokePath(svg, d) {
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);
  return path;
}

export function createPlayIcon() {
  const svg = createSvgRoot();
  svg.setAttribute('data-component', 'play-icon');
  strokePath(svg, 'M9 6.5 L18 12 L9 17.5 Z');
  return svg;
}

export function createPauseIcon() {
  const svg = createSvgRoot();
  svg.setAttribute('data-component', 'pause-icon');
  strokePath(svg, 'M8.5 6 L8.5 18');
  strokePath(svg, 'M15.5 6 L15.5 18');
  return svg;
}

export function createReplay10Icon() {
  const svg = createSvgRoot();
  svg.setAttribute('data-component', 'replay-10-icon');
  // Arco de ~290° (deja una abertura para la flecha de "reinicio").
  strokePath(svg, 'M18.5 12 A6.5 6.5 0 1 1 12.9 5.6');
  strokePath(svg, 'M12.9 5.6 L12.2 3.2 M12.9 5.6 L15.3 5.1');

  const label = document.createElementNS(NS, 'text');
  label.setAttribute('x', '12');
  label.setAttribute('y', '14.5');
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('font-size', '6.5');
  label.setAttribute('font-family', 'var(--al-font-ui)');
  label.setAttribute('font-weight', '600');
  label.setAttribute('fill', 'currentColor');
  label.setAttribute('stroke', 'none');
  label.textContent = '10';
  svg.appendChild(label);

  return svg;
}
