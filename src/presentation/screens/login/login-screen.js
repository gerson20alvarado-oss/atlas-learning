/**
 * presentation/screens/login/login-screen.js
 *
 * Login — Wireframe Review §2.12. Email, password, una acción "sign
 * in". Sin crear cuenta, sin social auth, sin copy de marketing —
 * deliberadamente la pantalla más restringida del sistema, porque el
 * modelo de cuentas provisionadas por administrador no le deja nada
 * más que ofrecer.
 *
 * Componente puro: `onSubmit(email, password)` es inyectado y se
 * espera que devuelva `{ error: string | null }` — si hay error, se
 * pinta con la voz calmada y directa ya establecida (Product Design
 * Doc §7), nunca alarmante. Si no hay error, este componente no
 * navega por sí mismo: el cambio de estado de Auth (fuera de este
 * archivo) dispara el re-render hacia el resto de la app.
 */

import { createPrimaryButton } from '../../components/primary-button/primary-button.js';
import { createStateView } from '../../components/state-views/state-views.js';

export function createLoginScreen({ onBack, onSubmit }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'login-screen');

  const backLink = document.createElement('button');
  backLink.type = 'button';
  backLink.setAttribute('data-part', 'back');
  backLink.className = 'al-type-ui-caption';
  backLink.textContent = '‹ back';
  backLink.addEventListener('click', () => onBack?.());

  const emailLabel = document.createElement('label');
  emailLabel.className = 'al-type-ui-label';
  emailLabel.textContent = 'Email';
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.setAttribute('data-part', 'email');
  emailInput.setAttribute('aria-label', 'Email');

  const passwordLabel = document.createElement('label');
  passwordLabel.className = 'al-type-ui-label';
  passwordLabel.textContent = 'Password';
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.setAttribute('data-part', 'password');
  passwordInput.setAttribute('aria-label', 'Password');

  const errorMessage = document.createElement('p');
  errorMessage.setAttribute('data-part', 'error');
  errorMessage.setAttribute('role', 'status');
  errorMessage.setAttribute('aria-live', 'polite');
  errorMessage.className = 'al-type-ui-caption';
  errorMessage.hidden = true;

  const signInButton = createPrimaryButton({
    label: 'sign in',
    onClick: () => handleSubmit(),
  });
  signInButton.element.setAttribute('data-part', 'sign-in');

  // Objetivo B (Sprint 7, §22.5): silencioso los primeros 400ms — la
  // mayoría de los intentos de login resuelven dentro de esa
  // ventana. Solo si la llamada real a Auth tarda más, aparece el
  // whisper bar. Oculto por defecto: no hay región de carga visible
  // en reposo.
  const loadingView = createStateView({ kind: 'loading' });
  loadingView.element.setAttribute('data-part', 'loading');
  loadingView.element.hidden = true;

  element.appendChild(backLink);
  element.appendChild(emailLabel);
  element.appendChild(emailInput);
  element.appendChild(passwordLabel);
  element.appendChild(passwordInput);
  element.appendChild(errorMessage);
  element.appendChild(loadingView.element);
  element.appendChild(signInButton.element);

  async function handleSubmit() {
    errorMessage.hidden = true;
    signInButton.update({ disabled: true });

    const revealLoading = setTimeout(() => {
      loadingView.element.hidden = false;
    }, 400);

    try {
      const result = await onSubmit?.(emailInput.value, passwordInput.value);
      if (result?.error) {
        errorMessage.textContent = result.error;
        errorMessage.hidden = false;
      }
    } finally {
      clearTimeout(revealLoading);
      loadingView.element.hidden = true;
      signInButton.update({ disabled: false });
    }
  }

  function update() {}

  function destroy() {
    signInButton.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
