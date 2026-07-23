/**
 * presentation/screens/reset-password/reset-password-screen.js
 *
 * Restablecimiento de Contraseña — se alcanza únicamente vía el
 * enlace de recuperación de Supabase (ver
 * app/bootstrap.js#translateSupabaseRecoveryHash y
 * core/router/route-table.js), nunca desde la navegación normal de
 * Atlas. Mismo patrón exacto que login-screen.js/
 * profile-setup-screen.js: componente puro, `onUpdatePassword`
 * inyectado, devuelve `{ success, error }` — este componente no
 * navega por sí mismo; `onSuccess` se invoca tras mostrar el estado
 * de éxito, y es screen-router.js quien decide a dónde ir (Login).
 *
 * Sin back-nav a propósito, mismo criterio que profile-setup-screen.js:
 * no hay a dónde volver — este flujo nace de un enlace de correo, no
 * de la navegación interna de la app.
 *
 * El botón de mostrar/ocultar contraseña es nuevo porque ningún
 * campo de contraseña existente en Atlas lo tenía — controla ambos
 * campos a la vez (una sola acción, un solo control, como pide el
 * requisito).
 */

import { createPrimaryButton } from '../../components/primary-button/primary-button.js';
import { createStateView } from '../../components/state-views/state-views.js';
import { createAtlasLogoMark } from '../../components/logo/atlas-logo.js';

const MIN_PASSWORD_LENGTH = 6; // mismo mínimo por defecto que exige Supabase Auth
const SUCCESS_REDIRECT_DELAY_MS = 1500; // tiempo para que el estado de éxito sea visible antes de redirigir

export function createResetPasswordScreen({ onUpdatePassword, onSuccess }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'reset-password-screen');

  const logoMark = createAtlasLogoMark({ size: 32 });
  logoMark.setAttribute('data-part', 'logo-mark');

  const heading = document.createElement('p');
  heading.setAttribute('data-part', 'heading');
  heading.className = 'al-type-display';
  heading.textContent = 'Create a New Password';

  const form = document.createElement('div');
  form.setAttribute('data-part', 'form');

  const newPasswordLabel = document.createElement('label');
  newPasswordLabel.className = 'al-type-ui-label';
  newPasswordLabel.textContent = 'New Password';
  const newPasswordInput = document.createElement('input');
  newPasswordInput.type = 'password';
  newPasswordInput.setAttribute('data-part', 'new-password');
  newPasswordInput.setAttribute('aria-label', 'New Password');
  newPasswordInput.autocomplete = 'new-password';

  const confirmPasswordLabel = document.createElement('label');
  confirmPasswordLabel.className = 'al-type-ui-label';
  confirmPasswordLabel.textContent = 'Confirm Password';
  const confirmPasswordInput = document.createElement('input');
  confirmPasswordInput.type = 'password';
  confirmPasswordInput.setAttribute('data-part', 'confirm-password');
  confirmPasswordInput.setAttribute('aria-label', 'Confirm Password');
  confirmPasswordInput.autocomplete = 'new-password';

  let passwordsVisible = false;
  const toggleVisibilityButton = document.createElement('button');
  toggleVisibilityButton.type = 'button';
  toggleVisibilityButton.setAttribute('data-part', 'toggle-visibility');
  toggleVisibilityButton.textContent = 'Show passwords';
  toggleVisibilityButton.addEventListener('click', () => {
    passwordsVisible = !passwordsVisible;
    const type = passwordsVisible ? 'text' : 'password';
    newPasswordInput.type = type;
    confirmPasswordInput.type = type;
    toggleVisibilityButton.textContent = passwordsVisible ? 'Hide passwords' : 'Show passwords';
  });

  const errorMessage = document.createElement('p');
  errorMessage.setAttribute('data-part', 'error');
  errorMessage.setAttribute('role', 'status');
  errorMessage.setAttribute('aria-live', 'polite');
  errorMessage.className = 'al-type-ui-caption';
  errorMessage.hidden = true;

  const updateButton = createPrimaryButton({
    label: 'Update Password',
    onClick: () => handleSubmit(),
  });
  updateButton.element.setAttribute('data-part', 'update-password');

  // Mismo patrón exacto que login-screen.js/profile-setup-screen.js:
  // silencioso los primeros 400ms, la mayoría de las actualizaciones
  // resuelven dentro de esa ventana.
  const loadingView = createStateView({ kind: 'loading' });
  loadingView.element.setAttribute('data-part', 'loading');
  loadingView.element.hidden = true;

  form.appendChild(newPasswordLabel);
  form.appendChild(newPasswordInput);
  form.appendChild(confirmPasswordLabel);
  form.appendChild(confirmPasswordInput);
  form.appendChild(toggleVisibilityButton);
  form.appendChild(errorMessage);
  form.appendChild(loadingView.element);
  form.appendChild(updateButton.element);

  const successMessage = document.createElement('p');
  successMessage.setAttribute('data-part', 'success');
  successMessage.setAttribute('role', 'status');
  successMessage.setAttribute('aria-live', 'polite');
  successMessage.className = 'al-type-ui-body';
  successMessage.textContent = 'Your password has been updated. Redirecting to sign in…';
  successMessage.hidden = true;

  element.appendChild(logoMark);
  element.appendChild(heading);
  element.appendChild(form);
  element.appendChild(successMessage);

  async function handleSubmit() {
    errorMessage.hidden = true;

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      errorMessage.textContent = `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
      errorMessage.hidden = false;
      return;
    }
    if (newPassword !== confirmPassword) {
      errorMessage.textContent = 'Passwords do not match.';
      errorMessage.hidden = false;
      return;
    }

    updateButton.update({ disabled: true });
    const revealLoading = setTimeout(() => {
      loadingView.element.hidden = false;
    }, 400);

    try {
      const result = await onUpdatePassword?.(newPassword);
      if (result?.success) {
        form.hidden = true;
        successMessage.hidden = false;
        setTimeout(() => onSuccess?.(), SUCCESS_REDIRECT_DELAY_MS);
      } else {
        errorMessage.textContent = result?.error ?? 'Something went wrong. Please try again.';
        errorMessage.hidden = false;
      }
    } finally {
      clearTimeout(revealLoading);
      loadingView.element.hidden = true;
      updateButton.update({ disabled: false });
    }
  }

  function update() {}

  function destroy() {
    updateButton.destroy();
    loadingView.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
