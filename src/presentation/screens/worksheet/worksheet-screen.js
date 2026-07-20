/**
 * presentation/screens/worksheet/worksheet-screen.js
 *
 * Ensambla una worksheet completa: encabezado de unidad (con el
 * botón de video, cuando la unidad lo tiene), luego cada sección con
 * sus ejercicios reales, y un botón "Submit worksheet" al final.
 *
 * Modelo de intentos (decisión de producto cerrada, esta sesión):
 * Atlas maneja únicamente intentos por unidad — `unit_attempt_limits`
 * es la única fuente de verdad, 2 intentos por unidad. El concepto de
 * "intentos por ejercicio" se eliminó por completo, columna de
 * Supabase incluida (`worksheet_exercise_attempts.attempts_used`,
 * ver docs/worksheet-attempts-schema.sql). Mientras la unidad no se
 * haya enviado, cada ejercicio permite recalificarse sin límite —
 * `ordering-exercise.js`/`true-false-exercise.js` ya no cuentan ni
 * recuerdan cuántas veces se calificaron a sí mismos.
 *
 * El único momento en que se consume un intento sigue siendo
 * presionar "Submit worksheet" — acción explícita del estudiante, sin
 * inferencia automática (revisión de esta sesión, tras encontrar en
 * pruebas reales que la detección automática podía marcar ejercicios
 * sin responder como "incorrectos" antes de que el estudiante
 * llegara a ellos).
 *
 * `unitCompleted` (al menos una pasada ya registrada) sigue siendo lo
 * único que `getExerciseAvailability()` evalúa para decidir si un
 * ejercicio es editable — ya no existe una segunda razón de bloqueo
 * por intentos de ejercicio agotados.
 */

import { createWorksheetExercise } from '../../components/worksheet-exercises/worksheet-exercise-renderer.js';
import { createVideoPanel } from '../../components/worksheet-exercises/video-panel.js';
import { createSidePanel } from '../../components/side-panel/side-panel.js';
import { createPrimaryButton } from '../../components/primary-button/primary-button.js';
import { GRADABLE_EXERCISE_TYPES } from '../../../domain/contracts/worksheet-exercise-lifecycle.js';

function collectGradableExerciseIds(unit) {
  const ids = [];
  unit.sections.forEach((section) => {
    section.exercises.forEach((exercise) => {
      if (GRADABLE_EXERCISE_TYPES.includes(exercise.type)) ids.push(exercise.id);
    });
  });
  return ids;
}

export function createWorksheetScreen({
  unit,
  videoSourceRepository,
  worksheetAttemptRepository,
  unitAttemptRepository,
  userId,
  accessToken,
  onBack,
}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'worksheet-screen');

  const header = document.createElement('header');
  header.setAttribute('data-part', 'header');

  if (onBack) {
    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.setAttribute('data-part', 'back');
    backButton.textContent = '‹ Library';
    backButton.addEventListener('click', () => onBack());
    header.appendChild(backButton);
  }

  const unitNumber = document.createElement('span');
  unitNumber.setAttribute('data-part', 'unit-number');
  unitNumber.textContent = String(unit.unitNumber);

  const unitTitle = document.createElement('h1');
  unitTitle.setAttribute('data-part', 'unit-title');
  unitTitle.className = 'al-type-title';
  unitTitle.textContent = unit.unitTitle;

  header.appendChild(unitNumber);
  header.appendChild(unitTitle);

  const completedBanner = document.createElement('p');
  completedBanner.setAttribute('data-part', 'completed-banner');
  completedBanner.className = 'al-type-ui-caption';
  completedBanner.textContent = 'This unit has been completed — showing your results (read-only).';
  completedBanner.hidden = true;
  header.appendChild(completedBanner);

  const body = document.createElement('div');
  body.setAttribute('data-part', 'body');

  const mainContent = document.createElement('div');
  mainContent.setAttribute('data-part', 'main-content');

  const loadingNotice = document.createElement('p');
  loadingNotice.setAttribute('data-part', 'loading');
  loadingNotice.className = 'al-type-ui-caption';
  loadingNotice.textContent = 'Loading…';
  mainContent.appendChild(loadingNotice);

  const sidePanelSlot = document.createElement('div');
  sidePanelSlot.setAttribute('data-part', 'side-panel-slot');
  sidePanelSlot.hidden = true;

  body.appendChild(mainContent);
  body.appendChild(sidePanelSlot);

  let activeSidePanel = null;

  function closeSidePanel() {
    activeSidePanel?.destroy();
    activeSidePanel = null;
    sidePanelSlot.replaceChildren();
    sidePanelSlot.hidden = true;
    body.removeAttribute('data-side-panel-open');
  }

  if (unit.video) {
    const watchButton = document.createElement('button');
    watchButton.type = 'button';
    watchButton.setAttribute('data-part', 'watch-video');
    watchButton.textContent = `▶ ${unit.video.label}`;
    watchButton.addEventListener('click', () => {
      closeSidePanel();
      const panelContent = createVideoPanel({ video: unit.video, videoSourceRepository });
      const panel = createSidePanel({ title: unit.video.label, onClose: closeSidePanel });
      panel.setContent(panelContent.element);
      activeSidePanel = { destroy: () => { panelContent.destroy(); panel.destroy(); } };
      sidePanelSlot.hidden = false;
      sidePanelSlot.replaceChildren(panel.element);
      body.setAttribute('data-side-panel-open', 'true');
    });
    header.appendChild(watchButton);
  }

  element.appendChild(header);
  element.appendChild(body);

  let exerciseComponents = [];
  let exerciseIds = [];
  let destroyed = false;
  const gradableExerciseIds = collectGradableExerciseIds(unit);
  const gradedResultsByExerciseId = new Map(); // id evaluable -> resultado (validate() output)

  // --- Submit worksheet: progreso + botón, al final de la worksheet ---
  const submitRow = document.createElement('div');
  submitRow.setAttribute('data-part', 'submit-row');
  submitRow.hidden = true; // oculto por completo cuando la unidad ya está completada

  const progressLabel = document.createElement('p');
  progressLabel.setAttribute('data-part', 'progress-label');
  progressLabel.className = 'al-type-ui-caption';

  const submitButton = createPrimaryButton({ label: 'Submit worksheet', onClick: () => handleSubmit() });
  submitButton.element.setAttribute('data-part', 'submit-button');

  submitRow.appendChild(progressLabel);
  submitRow.appendChild(submitButton.element);

  function updateProgress() {
    const done = gradableExerciseIds.filter((id) => gradedResultsByExerciseId.has(id)).length;
    const total = gradableExerciseIds.length;
    progressLabel.textContent = `${done} of ${total} exercise${total === 1 ? '' : 's'} completed`;
    submitButton.update({ disabled: done < total });
  }

  async function handleSubmit() {
    submitButton.update({ disabled: true });

    const newAttemptsUsed = await unitAttemptRepository?.incrementAttempt({
      bookId: unit.bookId,
      unitNumber: unit.unitNumber,
      accessToken,
    });

    if (destroyed) return;
    showCompletionSummary(newAttemptsUsed ?? null);
  }

  function showCompletionSummary(attemptsUsed) {
    const correctCount = [...gradedResultsByExerciseId.values()]
      .flat()
      .filter((item) => item.isCorrect).length;
    const totalGraded = [...gradedResultsByExerciseId.values()].flat().length;

    const summary = document.createElement('div');
    summary.setAttribute('data-part', 'completion-summary');

    const summaryTitle = document.createElement('p');
    summaryTitle.setAttribute('data-part', 'summary-title');
    summaryTitle.className = 'al-type-title';
    summaryTitle.textContent = `You've submitted ${unit.unitTitle}`;

    const summaryScore = document.createElement('p');
    summaryScore.setAttribute('data-part', 'summary-score');
    summaryScore.className = 'al-type-ui-body';
    summaryScore.textContent = `${correctCount} of ${totalGraded} correct.`;

    // "Attempt X of Y completed" + intentos restantes, siempre
    // explícitos — nunca un mensaje genérico cuando sí se conoce el
    // número real (Flujo de Intentos, decisión de producto cerrada).
    const summaryAttempts = document.createElement('p');
    summaryAttempts.setAttribute('data-part', 'summary-attempts');
    summaryAttempts.className = 'al-type-ui-caption';

    const attemptsRemaining = unit.maxAttempts != null && attemptsUsed != null
      ? Math.max(0, unit.maxAttempts - attemptsUsed)
      : null;

    if (attemptsUsed != null && unit.maxAttempts != null) {
      summaryAttempts.textContent =
        `Attempt ${attemptsUsed} of ${unit.maxAttempts} completed. ` +
        (attemptsRemaining > 0
          ? `${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`
          : 'No attempts remaining.');
    } else {
      summaryAttempts.textContent = 'Your attempt has been recorded.';
    }

    const continueButton = createPrimaryButton({
      label: 'Continue',
      onClick: async () => {
        const attemptsByExerciseId = await worksheetAttemptRepository.getAttemptsForUnit({
          userId,
          bookId: unit.bookId,
          unitNumber: unit.unitNumber,
          accessToken,
        });
        if (destroyed) return;
        renderExercises({ attemptsByExerciseId, unitCompleted: true });
      },
    });
    continueButton.element.setAttribute('data-part', 'summary-continue');

    summary.appendChild(summaryTitle);
    summary.appendChild(summaryScore);
    summary.appendChild(summaryAttempts);
    summary.appendChild(continueButton.element);

    // "Start New Attempt" — visible únicamente cuando quedan
    // intentos disponibles. Nunca toca attempts_used (ya refleja
    // correctamente el intento recién consumido) — solo borra las
    // respuestas de esta unidad para que la worksheet se reconstruya
    // en blanco, y el estudiante empiece de nuevo de verdad.
    if (attemptsRemaining > 0) {
      const startNewButton = createPrimaryButton({
        label: 'Start new attempt',
        onClick: async () => {
          startNewButton.update({ disabled: true });
          await worksheetAttemptRepository.deleteAttemptsForUnit({
            userId,
            bookId: unit.bookId,
            unitNumber: unit.unitNumber,
            accessToken,
          });
          if (destroyed) return;
          renderExercises({ attemptsByExerciseId: {}, unitCompleted: false });
        },
      });
      startNewButton.element.setAttribute('data-part', 'summary-start-new');
      summary.appendChild(startNewButton.element);
    }

    mainContent.replaceChildren(summary);
    submitRow.hidden = true;
  }

  function renderExercises({ attemptsByExerciseId, unitCompleted }) {
    exerciseComponents.forEach((component) => component.destroy());
    exerciseComponents = [];
    exerciseIds = [];
    gradedResultsByExerciseId.clear();
    mainContent.replaceChildren();
    completedBanner.hidden = !unitCompleted;

    unit.sections.forEach((section) => {
      const sectionEl = document.createElement('section');
      sectionEl.setAttribute('data-part', 'section');

      const sectionTitle = document.createElement('h2');
      sectionTitle.setAttribute('data-part', 'section-title');
      sectionTitle.className = 'al-type-ui-label';
      sectionTitle.textContent = section.title;
      sectionEl.appendChild(sectionTitle);

      section.exercises.forEach((exercise) => {
        const initialState = attemptsByExerciseId[exercise.id] ?? null;
        if (initialState?.result) gradedResultsByExerciseId.set(exercise.id, initialState.result);

        const component = createWorksheetExercise(exercise, {
          initialState,
          unitCompleted,
          onGraded: ({ response, result }) => {
            worksheetAttemptRepository?.saveAttempt({
              userId,
              bookId: unit.bookId,
              unitNumber: unit.unitNumber,
              exerciseId: exercise.id,
              response,
              result,
              accessToken,
            });
            gradedResultsByExerciseId.set(exercise.id, result);
            updateProgress();
          },
        });
        exerciseComponents.push(component);
        exerciseIds.push(exercise.id);
        sectionEl.appendChild(component.element);
      });

      mainContent.appendChild(sectionEl);
    });

    if (!unitCompleted && gradableExerciseIds.length > 0) {
      mainContent.appendChild(submitRow);
      submitRow.hidden = false;
      updateProgress();
    }
  }

  async function loadAndRenderExercises() {
    const [attemptsByExerciseId, unitAttemptsUsed] = await Promise.all([
      worksheetAttemptRepository
        ? worksheetAttemptRepository.getAttemptsForUnit({ userId, bookId: unit.bookId, unitNumber: unit.unitNumber, accessToken })
        : Promise.resolve({}),
      unitAttemptRepository
        ? unitAttemptRepository.getAttemptsUsed({ userId, bookId: unit.bookId, unitNumber: unit.unitNumber, accessToken })
        : Promise.resolve(0),
    ]);

    if (destroyed) return;
    loadingNotice.remove();

    // Al menos una pasada ya registrada = de solo lectura. "Iniciar
    // una nueva pasada" con intentos todavía disponibles queda fuera
    // de esta versión (ver docstring del archivo).
    renderExercises({ attemptsByExerciseId, unitCompleted: unitAttemptsUsed >= 1 });
  }

  loadAndRenderExercises();

  function destroy() {
    destroyed = true;
    closeSidePanel();
    exerciseComponents.forEach((component) => component.destroy());
    element.remove();
  }

  function getAllResponses() {
    const responses = {};
    exerciseComponents.forEach((component, index) => {
      responses[exerciseIds[index]] = component.getResponse();
    });
    return responses;
  }

  return Object.freeze({ element, destroy, getAllResponses });
}
