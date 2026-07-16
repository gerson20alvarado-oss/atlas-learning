/**
 * presentation/screens/home/home-screen.js
 *
 * Home ("Continue Learning") — Wireframe Review §2.1, Product Design
 * Document §6.1: reemplaza el concepto de Dashboard (PRD §14). El
 * título del libro es el protagonista visual (`type-display`), no el
 * wordmark (que ya se reduce a firma en el app-shell); una única
 * acción primaria, "Continue Learning", que restaura la Session
 * exacta (PRD §18, §2.4).
 *
 * Sprint 4 (Progress, Roadmap Phase 4) construye esta screen por
 * primera vez: hasta Sprint 3, `buildHomePlaceholder()` en
 * screen-router.js era el único estado posible porque no existía
 * ninguna Session persistida que restaurar. Ahora, si existe una
 * Session válida, esta screen reemplaza ese placeholder; si no existe
 * (estudiante nuevo, o acaba de terminar su única lección — ver
 * session-repository.js, clearSession), screen-router.js sigue
 * usando el mismo state-view vacío de siempre — este componente no
 * necesita conocer ese caso.
 *
 * Nota de alcance (Sprint 4 Plan, punto 7): Wireframe Review §2.1
 * describe además una fila secundaria "Library · Review · Settings"
 * dentro de la propia Home. Sprint 2 ya resolvió la navegación
 * secundaria a nivel de app-shell (nav-secondary.js en el header
 * persistente) precisamente porque Review y Settings todavía no
 * tienen screen propia — el mismo criterio se mantiene aquí: no se
 * duplica un enlace "Library" dentro del cuerpo de Home cuando el
 * header ya lo ofrece. Cuando Review (Sprint 5) y Settings (Sprint 6)
 * existan, este es el lugar natural para añadir esa fila — no antes.
 *
 * Componente puro: recibe todo ya resuelto (bookTitle, lessonTitle,
 * onContinue) — no conoce Session, router ni storage.
 */

import { createPrimaryButton } from '../../components/primary-button/primary-button.js';

export function createHomeScreen({ bookTitle, lessonTitle, onContinue }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'home-screen');

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'book-title');
  heading.className = 'al-type-display';
  heading.textContent = bookTitle;

  const context = document.createElement('p');
  context.setAttribute('data-part', 'context');
  context.className = 'al-type-ui-caption';
  context.textContent = `Continúas en: ${lessonTitle}`;

  const continueButton = createPrimaryButton({
    label: 'Continue Learning',
    onClick: () => onContinue?.(),
  });
  continueButton.element.setAttribute('data-part', 'continue');

  element.appendChild(heading);
  element.appendChild(context);
  element.appendChild(continueButton.element);

  function update() {}

  function destroy() {
    continueButton.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
