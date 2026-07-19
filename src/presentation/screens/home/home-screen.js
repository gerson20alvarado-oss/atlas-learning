/**
 * presentation/screens/home/home-screen.js
 *
 * Home ("Continue Learning") — Wireframe Review §2.1, Product Design
 * Document §6.1.
 *
 * ReaderPosition, Supabase puro (esta sesión): esta pantalla ya no
 * recibe `bookTitle`/`lessonTitle` — bajo el nuevo modelo, Home no
 * conoce la posición de antemano (evitar un estado de carga fue una
 * decisión explícita de Producto). El botón es genérico y siempre
 * visible; toda la resolución ocurre en `onContinue`, cuando el
 * estudiante ya decidió actuar — mismo patrón que Library ya usa
 * para resolver la página al elegir un libro.
 *
 * Componente puro: no conoce Session, router ni storage — solo
 * invoca `onContinue`.
 */

import { createPrimaryButton } from '../../components/primary-button/primary-button.js';

export function createHomeScreen({ onContinue }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'home-screen');
  // Objetivo E (Sprint 7, R2): estado inicial de la transición de
  // llegada — se retira en el primer frame para que el navegador
  // capture el estado "entering" antes de animar hacia el reposo.
  element.setAttribute('data-motion', 'entering');
  requestAnimationFrame(() => element.removeAttribute('data-motion'));

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'book-title');
  heading.className = 'al-type-display';
  heading.textContent = 'Atlas Learning';

  const continueButton = createPrimaryButton({
    label: 'Continue Learning',
    onClick: () => onContinue?.(),
  });
  continueButton.element.setAttribute('data-part', 'continue');

  element.appendChild(heading);
  element.appendChild(continueButton.element);

  function update() {}

  function destroy() {
    continueButton.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
