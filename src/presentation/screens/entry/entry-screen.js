/**
 * presentation/screens/entry/entry-screen.js
 *
 * Entry (First Launch) — Wireframe Review §2.11. Bienvenida +
 * promesa del producto en una sola frase + una única acción, "Sign
 * In", hacia Login. Sin registro, sin onboarding (Decision Log Entry
 * 001 — modelo de plataforma cerrada, cuentas provisionadas por un
 * administrador). El wordmark se muestra a tamaño natural — la única
 * pantalla del sistema donde eso es correcto, porque todavía no hay
 * ningún libro al que la marca deba cederle protagonismo (Principio 9
 * del catálogo acumulativo de Wireframe Review).
 *
 * Refinamiento visual (esta sesión): la frase de producto se
 * reemplaza por una cita editorial — dos elementos separados (cita +
 * autor), nunca un solo subtítulo — pensada para invitar a empezar
 * la sesión de estudio con calma, "como abrir un libro". Comillas
 * tipográficas reales (" "), nunca comillas decorativas ni un ícono.
 * El autor es deliberadamente un elemento propio, más pequeño y en
 * color secundario — nunca parte del mismo bloque visual que la
 * cita. Composición sin tarjeta, sin borde, sin sombra (ver
 * entry-screen.css).
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

  // Cita editorial (esta sesión): dos elementos, nunca uno — la cita
  // es la protagonista, el autor es una atribución discreta debajo.
  const quoteBlock = document.createElement('div');
  quoteBlock.setAttribute('data-part', 'quote-block');

  const quote = document.createElement('p');
  quote.setAttribute('data-part', 'quote');
  quote.className = 'al-type-reading-body';
  quote.textContent = '\u201CLearning never exhausts the mind.\u201D';

  const quoteAuthor = document.createElement('p');
  quoteAuthor.setAttribute('data-part', 'quote-author');
  quoteAuthor.className = 'al-type-ui-caption';
  quoteAuthor.textContent = '\u2014 Leonardo da Vinci';

  quoteBlock.appendChild(quote);
  quoteBlock.appendChild(quoteAuthor);

  const signInButton = createPrimaryButton({
    label: 'Sign In',
    onClick: () => onSignIn?.(),
  });
  signInButton.element.setAttribute('data-part', 'sign-in');

  element.appendChild(logoMark);
  element.appendChild(wordmark);
  element.appendChild(quoteBlock);
  element.appendChild(signInButton.element);

  function update() {}

  function destroy() {
    signInButton.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
