/**
 * presentation/screens/writing/writing-screen.js
 *
 * Writing — actividad independiente, fuera del sistema de Assessment
 * por completo. Sin intentos, sin calificación, sin Submit, sin
 * Summary. El estudiante escribe, el texto se autoguarda, y puede
 * continuar a la Worksheet cuando quiera — nunca una obligación,
 * nunca un bloqueo.
 *
 * Deliberadamente NO reutiliza assessment-screen.js ni ningún
 * componente de worksheet-exercises/ — ni la forma de sus datos
 * (`WritingActivity` no es un `Assessment`), ni su ciclo de vida
 * (no hay `unitCompleted`, no hay "intentos restantes"), ni su
 * persistencia (`writingResponseRepository`, tabla propia
 * `writing_responses`, sin relación con `unit_attempt_limits` ni
 * `worksheet_exercise_attempts`).
 *
 * Autoguardado (decisión de producto): debounce de 800ms tras dejar
 * de escribir — ni por cada tecla (saturaría la red sin necesidad),
 * ni solo al salir (el estudiante podría cerrar la pestaña y perder
 * el párrafo). El indicador "✓ Saved automatically" es la única
 * señal de guardado — nunca un botón "Save": el estudiante no debe
 * pensar en guardar, solo en escribir.
 */

import { createBackNav } from '../../components/back-nav/back-nav.js';
import { createPrimaryButton } from '../../components/primary-button/primary-button.js';

const AUTOSAVE_DEBOUNCE_MS = 800;

export function createWritingScreen({
  writing,
  writingResponseRepository,
  userId,
  accessToken,
  onBack,
  onContinue,
}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'writing-screen');

  const header = document.createElement('header');
  header.setAttribute('data-part', 'header');

  const backNav = createBackNav({ parentLabel: 'Library', onSelect: () => onBack?.() });
  backNav.element.setAttribute('data-part', 'back');
  header.appendChild(backNav.element);

  const unitNumber = document.createElement('span');
  unitNumber.setAttribute('data-part', 'unit-number');
  unitNumber.textContent = String(writing.unitNumber);
  header.appendChild(unitNumber);

  const unitTitle = document.createElement('h1');
  unitTitle.setAttribute('data-part', 'unit-title');
  unitTitle.className = 'al-type-title';
  unitTitle.textContent = writing.unitTitle;
  header.appendChild(unitTitle);

  const activityTitle = document.createElement('p');
  activityTitle.setAttribute('data-part', 'activity-title');
  activityTitle.className = 'al-type-ui-label';
  activityTitle.textContent = writing.title;
  header.appendChild(activityTitle);

  element.appendChild(header);

  const body = document.createElement('div');
  body.setAttribute('data-part', 'body');

  const instructions = document.createElement('p');
  instructions.setAttribute('data-part', 'instructions');
  instructions.textContent = writing.instructions;
  body.appendChild(instructions);

  const editorWrapper = document.createElement('div');
  editorWrapper.setAttribute('data-part', 'editor-wrapper');

  const textarea = document.createElement('textarea');
  textarea.setAttribute('data-part', 'editor');
  textarea.setAttribute('aria-label', writing.title);
  textarea.placeholder = 'Start writing here…';
  editorWrapper.appendChild(textarea);

  body.appendChild(editorWrapper);

  const statusRow = document.createElement('div');
  statusRow.setAttribute('data-part', 'status-row');

  const saveIndicator = document.createElement('p');
  saveIndicator.setAttribute('data-part', 'save-indicator');
  saveIndicator.className = 'al-type-ui-caption';
  saveIndicator.textContent = '';
  statusRow.appendChild(saveIndicator);

  body.appendChild(statusRow);

  if (onContinue) {
    const continueButton = createPrimaryButton({
      label: 'Continue to Worksheet',
      onClick: () => onContinue(),
    });
    continueButton.element.setAttribute('data-part', 'continue-button');
    body.appendChild(continueButton.element);
  }

  element.appendChild(body);

  let destroyed = false;
  let debounceHandle = null;
  let hasLoaded = false;

  function setIndicator(state) {
    // 'saving' | 'saved' | '' — nunca un error visible al estudiante
    // aquí: un fallo de guardado ya se reporta al errorBoundary desde
    // el repositorio (degradación silenciosa, mismo criterio que el
    // resto de Atlas para autoguardado no crítico).
    if (state === 'saving') {
      saveIndicator.textContent = 'Saving…';
      saveIndicator.removeAttribute('data-state');
    } else if (state === 'saved') {
      saveIndicator.textContent = '✓ Saved automatically';
      saveIndicator.setAttribute('data-state', 'saved');
    } else {
      saveIndicator.textContent = '';
      saveIndicator.removeAttribute('data-state');
    }
  }

  async function persist() {
    if (destroyed) return;
    setIndicator('saving');
    const success = await writingResponseRepository.saveEntry({
      userId,
      bookId: writing.bookId,
      unitNumber: writing.unitNumber,
      responseText: textarea.value,
      accessToken,
    });
    if (destroyed) return;
    setIndicator(success ? 'saved' : '');
  }

  textarea.addEventListener('input', () => {
    if (!hasLoaded) return; // nunca autoguardar mientras se restaura el texto inicial
    clearTimeout(debounceHandle);
    setIndicator('');
    debounceHandle = setTimeout(persist, AUTOSAVE_DEBOUNCE_MS);
  });

  async function loadInitialText() {
    const responseText = await writingResponseRepository.getEntry({
      userId,
      bookId: writing.bookId,
      unitNumber: writing.unitNumber,
      accessToken,
    });
    if (destroyed) return;
    textarea.value = responseText;
    hasLoaded = true;
    if (responseText) setIndicator('saved');
  }

  loadInitialText();

  function update() {}

  function destroy() {
    destroyed = true;
    clearTimeout(debounceHandle);
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
