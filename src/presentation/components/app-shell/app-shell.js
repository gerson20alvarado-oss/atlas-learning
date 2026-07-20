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
 * Objetivo E (Sprint 7, §11.4.1): el header completo (wordmark-firma
 * + nav-secondary) solo tiene sentido una vez hay sesión — Entry y
 * Login son, por diseño (Wireframe Review §4), las pantallas más
 * restringidas del sistema: una única acción, "sign in", nada más
 * que ofrecer. `update({ authenticated })` resuelve esto sin cambiar
 * el contrato del componente.
 *
 * Corrección de regresión (validación manual, Sprint 7): el
 * ocultamiento vive ÚNICAMENTE en el atributo `data-authenticated` +
 * la regla CSS correspondiente en app-shell.css. Antes también se
 * asignaba `header.hidden`, pero esa propiedad no tenía ningún efecto
 * visual real — una regla de autor ya existente (`display: flex` en
 * `[data-region="shell-header"]`) siempre gana sobre el
 * `[hidden]{display:none}` del user-agent stylesheet. Mantener ambos
 * mecanismos a la vez era lo que ocultaba el bug: el código "parecía"
 * correcto sin serlo. Un único mecanismo, explícito en CSS.
 *
 * Contrato de componente (Sprint 1 Plan §9.2):
 * { element, update(nextProps), destroy() }.
 */

import { createAtlasLogoMark } from '../logo/atlas-logo.js';

export function createAppShell({ secondaryNavElement, contentRegionElement }) {
  const wordmark = document.createElement('div');
  wordmark.setAttribute('data-role', 'wordmark-signature');
  wordmark.appendChild(createAtlasLogoMark({ size: 22 }));
  const wordmarkText = document.createElement('span');
  wordmarkText.textContent = 'Atlas Learning';
  wordmark.appendChild(wordmarkText);

  const header = document.createElement('header');
  header.setAttribute('data-region', 'shell-header');
  header.appendChild(wordmark);
  header.appendChild(secondaryNavElement);

  const main = document.createElement('main');
  main.setAttribute('data-region', 'shell-main');
  main.appendChild(contentRegionElement);

  const element = document.createElement('div');
  element.setAttribute('data-component', 'app-shell');
  // Estado inicial conservador hasta el primer update() real — mismo
  // criterio que ya oculta el header cuando authenticated es false.
  element.setAttribute('data-authenticated', 'false');
  element.appendChild(header);
  element.appendChild(main);

  function update(nextProps) {
    if (!nextProps || typeof nextProps.authenticated !== 'boolean') return;
    element.setAttribute('data-authenticated', String(nextProps.authenticated));
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
