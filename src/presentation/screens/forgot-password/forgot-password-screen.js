/**
 * presentation/screens/forgot-password/forgot-password-screen.js
 *
 * Forgot Password — se alcanza únicamente desde el enlace "Forgot
 * your password?" en Login (login-screen.js), nunca por URL directa
 * — mismo criterio que Login se alcanza solo desde Entry, sin ruta
 * de hash propia (ver `authUiStage` en app/screen-router.js).
 *
 * "‹ Sign In" reutiliza `back-nav.js` tal cual — Atlas ya tiene una
 * única convención para "volver al padre" (ícono + nombre exacto del
 * nivel padre, nunca la palabra "back"); este archivo no introduce
 * una segunda.
 *
 * Componente puro: `onRequestReset(email)` inyectado, devuelve
 * `{ success, error }` — mismo contrato que
 * login-screen.js/reset-password-screen.js. Éxito genérico siempre
 * que la llamada responda bien (nunca confirma ni niega si el correo
 * existe — mismo criterio de seguridad que el propio endpoint de
 * Supabase).
 */

import { createPrimaryButton } from '../../components/primary-button/primary-button.js';
import { createStateView } from '../../components/state-views/state-views.js';
import { createAtlasLogoMark } from '../../components/logo/atlas-logo.js';
import { createBackNav } from '../../components/back-nav/back-nav.js';

export function createForgotPasswordScreen({ onBack, onRequestReset }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'forgot-password-screen');

  const backNav = createBackNav({ parentLabel: 'Sign In', onSelect: onBack });

  const logoMark = createAtlasLogoMark({ size: 32 });
  logoMark.setAttribute('data-part', 'logo-mark');

  const heading = document.createElement('p');
  heading.setAttribute('data-part', 'heading');
  heading.className = 'al-type-display';
  heading.textContent = 'Forgot your password?';

  const form = document.createElement('div');
  form.setAttribute('data-part', 'form');

  const emailLabel = document.createElement('label');
  emailLabel.className = 'al-type-ui-label';
  emailLabel.textContent = 'Email';
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.setAttribute('data-part', 'email');
  emailInput.setAttribute('aria-label', 'Email');
  emailInput.autocomplete = 'email';

  const errorMessage = document.createElement('p');
  errorMessage.setAttribute('data-part', 'error');
  errorMessage.setAttribute('role', 'status');
  errorMessage.setAttribute('aria-live', 'polite');
  errorMessage.className = 'al-type-ui-caption';
  errorMessage.hidden = true;

  const sendButton = createPrimaryButton({
    label: 'Send Recovery Email',
    onClick: () => handleSubmit(),
  });
  sendButton.element.setAttribute('data-part', 'send-recovery');

  // Mismo patrón exacto que login-screen.js/reset-password-screen.js:
  // silencioso los primeros 400ms.
  const loadingView = createStateView({ kind: 'loading' });
  loadingView.element.setAttribute('data-part', 'loading');
  loadingView.element.hidden = true;

  form.appendChild(emailLabel);
  form.appendChild(emailInput);
  form.appendChild(errorMessage);
  form.appendChild(loadingView.element);
  form.appendChild(sendButton.element);

  const successMessage = document.createElement('p');
  successMessage.setAttribute('data-part', 'success');
  successMessage.setAttribute('role', 'status');
  successMessage.setAttribute('aria-live', 'polite');
  successMessage.className = 'al-type-ui-body';
  successMessage.textContent = "If that email exists in our system, we've sent a recovery link.";
  successMessage.hidden = true;

  element.appendChild(backNav.element);
  element.appendChild(logoMark);
  element.appendChild(heading);
  element.appendChild(form);
  element.appendChild(successMessage);

  async function handleSubmit() {
    errorMessage.hidden = true;

    const email = emailInput.value.trim();
    if (!email) {
      errorMessage.textContent = 'Please enter your email.';
      errorMessage.hidden = false;
      return;
    }

    sendButton.update({ disabled: true });
    const revealLoading = setTimeout(() => {
      loadingView.element.hidden = false;
    }, 400);

    try {
      const result = await onRequestReset?.(email);
      if (result?.success) {
        form.hidden = true;
        successMessage.hidden = false;
      } else {
        errorMessage.textContent = result?.error ?? 'Something went wrong. Please try again.';
        errorMessage.hidden = false;
      }
    } finally {
      clearTimeout(revealLoading);
      loadingView.element.hidden = true;
      sendButton.update({ disabled: false });
    }
  }

  function update() {}

  function destroy() {
    backNav.destroy();
    sendButton.destroy();
    loadingView.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
