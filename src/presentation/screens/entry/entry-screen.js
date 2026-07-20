/**
 * presentation/screens/entry/entry-screen.js
 *
 * Entry (First Launch) — Wireframe Review §2.11. Bienvenida +
 * promesa del producto en una sola frase + una única acción, "sign
 * in", hacia Login. Sin registro, sin onboarding (Decision Log Entry
 * 001 — modelo de plataforma cerrada, cuentas provisionadas por un
 * administrador). El wordmark se muestra a tamaño natural — la única
 * pantalla del sistema donde eso es correcto, porque todavía no hay
 * ningún libro al que la marca deba cederle protagonismo (Principio 9
 * del catálogo acumulativo de Wireframe Review).
 *
 * Componente puro: recibe `onSignIn`, no conoce Auth ni Router.
 */

import { createPrimaryButton } from '../../components/primary-button/primary-button.js';

import { createAtlasLogoMark } from '../../components/logo/atlas-logo.js';

export function createEntryScreen({ onSignIn }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'entry-screen');

  const logoMark = createAtlasLogoMark({ size: 40 });
  logoMark.setAttribute('data-part', 'logo-mark');

  const wordmark = document.createElement('p');
  wordmark.setAttribute('data-part', 'wordmark');
  wordmark.className = 'al-type-display';
  wordmark.textContent = 'Atlas Learning';

  const promise = document.createElement('p');
  promise.setAttribute('data-part', 'promise');
  promise.className = 'al-type-reading-body';
  promise.textContent = 'Tu libro de texto, con memoria.';

  const signInButton = createPrimaryButton({
    label: 'sign in',
    onClick: () => onSignIn?.(),
  });
  signInButton.element.setAttribute('data-part', 'sign-in');

  element.appendChild(logoMark);
  element.appendChild(wordmark);
  element.appendChild(promise);
  element.appendChild(signInButton.element);

  function update() {}

  function destroy() {
    signInButton.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
