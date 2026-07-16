/**
 * presentation/components/app-shell/app-shell.js
 *
 * Componente de UI puro para el shell de la aplicación: wordmark
 * reducido a firma (Wireframe Review, Principio 2 — "branding
 * recedes so the book can lead"), slot de navegación secundaria y
 * slot de contenido. No conoce el router ni el event bus — recibe
 * todo ya resuelto desde afuera (Sprint 1 Plan §6, regla de
 * vecinos).
 *
 * Contrato de componente (Sprint 1 Plan §9.2):
 * { element, update(nextProps), destroy() }.
 */

export function createAppShell({ secondaryNavElement, contentRegionElement }) {
  const wordmark = document.createElement('div');
  wordmark.textContent = 'atlas learning';
  wordmark.setAttribute('data-role', 'wordmark-signature');

  const header = document.createElement('header');
  header.setAttribute('data-region', 'shell-header');
  header.appendChild(wordmark);
  header.appendChild(secondaryNavElement);

  const main = document.createElement('main');
  main.setAttribute('data-region', 'shell-main');
  main.appendChild(contentRegionElement);

  const element = document.createElement('div');
  element.setAttribute('data-component', 'app-shell');
  element.appendChild(header);
  element.appendChild(main);

  // Sprint 1 no tiene props dinámicas propias del shell (p. ej. el
  // título del libro actual llega en Sprint 2+). update() ya existe
  // como parte del contrato del componente, aunque hoy sea un no-op.
  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
