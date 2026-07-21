/**
 * presentation/components/back-nav/back-nav.js
 *
 * Back-nav (Design System §15.1): "{ícono chevron-left} {nombre del
 * nivel padre exacto}" — nunca "back", nunca un salto de nivel
 * (Wireframe Review §4). type-ui-caption, text-muted, hit area 44px.
 *
 * Sprint 7 (Objetivo E, extensión): el chevron pasa de ser el
 * carácter "‹" a ser el ícono real ya aprobado (§10.2-§10.3,
 * chevron-icon.js) — misma jerarquía visual, "quiet word" intacta
 * (§11.2): esto no es un botón, es la misma acción de texto con su
 * ícono correctamente construido y mejor alineado.
 *
 * Refinamiento visual (esta sesión): el label se capitaliza aquí
 * mismo (primera letra mayúscula), sin importar cómo lo pase quien
 * llama — todos los sitios existentes ('entry', 'home', 'library',
 * 'book', 'unit', 'lesson', y ya 'Library' en un caso) quedan
 * corregidos de una sola vez, sin tocar ninguno de esos 8 archivos.
 * Comportamiento sin cambios: sigue siendo el mismo callback, el
 * mismo evento, la misma navegación — solo cambia qué texto se
 * pinta.
 */

import { createChevronIcon } from '../icons/chevron-icon.js';

function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function createBackNav({ parentLabel, onSelect }) {
  const element = document.createElement('button');
  element.setAttribute('data-component', 'back-nav');
  element.setAttribute('type', 'button');

  const icon = createChevronIcon({ direction: 'left' });
  icon.setAttribute('data-part', 'icon');

  const label = document.createElement('span');
  label.setAttribute('data-part', 'label');

  element.appendChild(icon);
  element.appendChild(label);

  function render(text) {
    label.textContent = capitalize(text);
  }

  render(parentLabel);
  element.addEventListener('click', () => onSelect?.());

  function update(nextProps = {}) {
    if (nextProps.parentLabel) {
      render(nextProps.parentLabel);
    }
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
