/**
 * presentation/screens/license-activation/license-activation-screen.js
 *
 * Único punto de entrada a la activación de licencias (Arquitectura
 * de Licencias, §6) — se llega aquí desde el botón "+ Activate a
 * License Key" de la Biblioteca, nunca desde un libro específico
 * (no existe tal cosa: un libro sin licencia no aparece).
 *
 * El libro al que pertenece el código se resuelve del lado del
 * servidor (`activate_license`, SECURITY DEFINER) — este componente
 * nunca lo conoce de antemano, solo lo muestra una vez la activación
 * responde.
 *
 * Componente puro: recibe `licenseRepository` ya compuesto y
 * `onActivated(bookId)`/`onBack` — no conoce Supabase directamente.
 */

export function createLicenseActivationScreen({ licenseRepository, accessToken, onActivated, onBack, resolveBookTitle }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'license-activation-screen');

  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.setAttribute('data-part', 'back');
  backButton.textContent = '‹ Library';
  backButton.addEventListener('click', () => onBack?.());

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = 'Activate a License Key';

  const description = document.createElement('p');
  description.setAttribute('data-part', 'description');
  description.className = 'al-type-ui-body';
  description.textContent = 'Enter the License Key you received to add a book to your Library.';

  const form = document.createElement('form');
  form.setAttribute('data-part', 'form');

  const input = document.createElement('input');
  input.type = 'text';
  input.setAttribute('data-part', 'key-input');
  input.setAttribute('aria-label', 'License Key');
  input.placeholder = 'XXXX-XXXX-XXXX-XXXX';
  input.maxLength = 19; // 16 caracteres + 3 guiones

  // Formatea en mayúsculas y con guiones cada 4 caracteres a medida
  // que el usuario escribe — nunca cambia lo que se envía a
  // activate_license, solo lo que se ve mientras se escribe.
  input.addEventListener('input', () => {
    const raw = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
    input.value = raw.match(/.{1,4}/g)?.join('-') ?? raw;
  });

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.setAttribute('data-part', 'submit');
  submitButton.textContent = 'Activate';

  form.appendChild(input);
  form.appendChild(submitButton);

  const statusMessage = document.createElement('p');
  statusMessage.setAttribute('data-part', 'status');
  statusMessage.hidden = true;

  const REASON_MESSAGES = Object.freeze({
    not_found: "We couldn't find that License Key. Please check it and try again.",
    already_used: 'This License Key has already been used.',
    revoked: 'This License Key is no longer valid.',
    expired: 'This License Key has expired.',
    network_error: 'Something went wrong. Please try again.',
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const keyCode = input.value.trim();
    if (!keyCode) return;

    submitButton.disabled = true;
    statusMessage.hidden = true;

    const result = await licenseRepository.activateLicense({ keyCode, accessToken });

    submitButton.disabled = false;

    if (result.success) {
      statusMessage.setAttribute('data-tone', 'success');
      const bookTitle = resolveBookTitle?.(result.bookId) ?? 'your book';
      statusMessage.textContent = `${bookTitle} has been added to your Library.`;
      statusMessage.hidden = false;
      input.value = '';
      onActivated?.(result.bookId);
    } else {
      statusMessage.setAttribute('data-tone', 'error');
      statusMessage.textContent = REASON_MESSAGES[result.reason] ?? 'This License Key could not be activated.';
      statusMessage.hidden = false;
    }
  });

  element.appendChild(backButton);
  element.appendChild(heading);
  element.appendChild(description);
  element.appendChild(form);
  element.appendChild(statusMessage);

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
