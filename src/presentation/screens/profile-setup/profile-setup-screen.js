/**
 * presentation/screens/profile-setup/profile-setup-screen.js
 *
 * Se muestra una única vez por usuario, entre resolver la Vinculación
 * de Cuenta y llegar a Library/Home — mismo tipo de interrupción que
 * Login ya es sobre Entry, aplicada aquí un nivel más adentro (ya
 * hay sesión, todavía no hay perfil).
 *
 * Sin back-nav a propósito: no hay a dónde volver — completar el
 * perfil es un requisito para las funciones principales de Atlas
 * (Biblioteca, Reader, actividades), no un paso descartable.
 *
 * Mismo patrón de envío que login-screen.js: loading silencioso los
 * primeros 400ms (la mayoría de los guardados resuelven dentro de
 * esa ventana), error con voz calmada, nunca alarmante.
 *
 * Componente puro: `onSubmit(firstName, lastName)` inyectado,
 * devuelve `{ error: string | null }` — si no hay error, este
 * componente no navega por sí mismo, igual que Login.
 */

import { createPrimaryButton } from '../../components/primary-button/primary-button.js';
import { createStateView } from '../../components/state-views/state-views.js';
import { createAtlasLogoMark } from '../../components/logo/atlas-logo.js';

export function createProfileSetupScreen({ onSubmit }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'profile-setup-screen');

  const logoMark = createAtlasLogoMark({ size: 32 });
  logoMark.setAttribute('data-part', 'logo-mark');

  const heading = document.createElement('p');
  heading.setAttribute('data-part', 'heading');
  heading.className = 'al-type-display';
  heading.textContent = 'Welcome to Atlas Learning';

  const subheading = document.createElement('p');
  subheading.setAttribute('data-part', 'subheading');
  subheading.className = 'al-type-ui-body';
  subheading.textContent = "Let's set up your profile.";

  const firstNameLabel = document.createElement('label');
  firstNameLabel.className = 'al-type-ui-label';
  firstNameLabel.textContent = 'First name';
  const firstNameInput = document.createElement('input');
  firstNameInput.type = 'text';
  firstNameInput.setAttribute('data-part', 'first-name');
  firstNameInput.setAttribute('aria-label', 'First name');
  firstNameInput.autocomplete = 'given-name';

  const lastNameLabel = document.createElement('label');
  lastNameLabel.className = 'al-type-ui-label';
  lastNameLabel.textContent = 'Last name';
  const lastNameInput = document.createElement('input');
  lastNameInput.type = 'text';
  lastNameInput.setAttribute('data-part', 'last-name');
  lastNameInput.setAttribute('aria-label', 'Last name');
  lastNameInput.autocomplete = 'family-name';

  const errorMessage = document.createElement('p');
  errorMessage.setAttribute('data-part', 'error');
  errorMessage.setAttribute('role', 'status');
  errorMessage.setAttribute('aria-live', 'polite');
  errorMessage.className = 'al-type-ui-caption';
  errorMessage.hidden = true;

  const continueButton = createPrimaryButton({
    label: 'Continue',
    onClick: () => handleSubmit(),
  });
  continueButton.element.setAttribute('data-part', 'continue');

  const loadingView = createStateView({ kind: 'loading' });
  loadingView.element.setAttribute('data-part', 'loading');
  loadingView.element.hidden = true;

  const footer = document.createElement('p');
  footer.setAttribute('data-part', 'footer');
  footer.className = 'al-type-ui-caption';
  footer.textContent = '© 2026 Atlas Learning · All rights reserved.';

  element.appendChild(logoMark);
  element.appendChild(heading);
  element.appendChild(subheading);
  element.appendChild(firstNameLabel);
  element.appendChild(firstNameInput);
  element.appendChild(lastNameLabel);
  element.appendChild(lastNameInput);
  element.appendChild(errorMessage);
  element.appendChild(loadingView.element);
  element.appendChild(continueButton.element);
  element.appendChild(footer);

  async function handleSubmit() {
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();

    if (!firstName || !lastName) {
      errorMessage.textContent = 'Please enter your first and last name.';
      errorMessage.hidden = false;
      return;
    }

    errorMessage.hidden = true;
    continueButton.update({ disabled: true });

    const revealLoading = setTimeout(() => {
      loadingView.element.hidden = false;
    }, 400);

    try {
      const result = await onSubmit?.(firstName, lastName);
      if (result?.error) {
        errorMessage.textContent = result.error;
        errorMessage.hidden = false;
      }
    } finally {
      clearTimeout(revealLoading);
      loadingView.element.hidden = true;
      continueButton.update({ disabled: false });
    }
  }

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
