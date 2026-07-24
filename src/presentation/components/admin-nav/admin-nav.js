/**
 * presentation/components/admin-nav/admin-nav.js
 *
 * Nav secundaria de Admin Console (Sprint 14) — deliberadamente NO
 * reutiliza nav-secondary.js del estudiante: esa nav vive en
 * app-shell.js con dos ítems fijos (Library, Sign out) pensados para
 * la experiencia del estudiante; forzar los seis ítems de Admin ahí
 * la deformaría sin necesidad. Aquí, en cambio, un componente propio
 * y mínimo — misma filosofía (texto plano, sin iconografía), audiencia
 * distinta.
 *
 * Componente puro: no conoce router ni Navigation State — solo
 * recibe `activeSection` para resaltar el ítem actual y `onSelect`
 * para reportar la elección.
 */

const SECTIONS = Object.freeze([
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'licenses', label: 'Licenses' },
  { key: 'unit-availability', label: 'Content Availability' },
  { key: 'worksheet-attempts', label: 'Worksheet Attempts' },
  { key: 'reader-progress', label: 'Reader Progress' },
  { key: 'bookmarks', label: 'Bookmarks' },
]);

export function createAdminNav({ activeSection, onSelect }) {
  const element = document.createElement('nav');
  element.setAttribute('data-component', 'admin-nav');

  const buttons = new Map();

  SECTIONS.forEach(({ key, label }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-part', 'admin-nav-item');
    if (key === activeSection) {
      button.setAttribute('data-active', 'true');
    }
    button.textContent = label;
    button.addEventListener('click', () => onSelect(key));
    buttons.set(key, button);
    element.appendChild(button);
  });

  function update({ activeSection: nextActive }) {
    buttons.forEach((button, key) => {
      if (key === nextActive) {
        button.setAttribute('data-active', 'true');
      } else {
        button.removeAttribute('data-active');
      }
    });
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
