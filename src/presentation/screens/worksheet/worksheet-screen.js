/**
 * presentation/screens/worksheet/worksheet-screen.js
 *
 * Ensambla una worksheet completa: encabezado de unidad (con el
 * botón de video, cuando la unidad lo tiene), luego cada sección con
 * sus ejercicios reales, despachados por tipo.
 *
 * Persistencia (esta sesión): antes de construir los ejercicios, se
 * cargan los intentos ya guardados del estudiante para esta unidad
 * (`worksheetAttemptRepository.getAttemptsForUnit`) — así cada
 * componente nace ya con su estado restaurado, sin parpadear entre
 * "vacío" y "con datos". Al calificar (`onGraded`), este componente
 * es quien guarda — nunca el ejercicio en sí (regla de vecinos,
 * mismo criterio que ya rige todo el proyecto).
 */

import { createWorksheetExercise } from '../../components/worksheet-exercises/worksheet-exercise-renderer.js';
import { createVideoPanel } from '../../components/worksheet-exercises/video-panel.js';
import { createSidePanel } from '../../components/side-panel/side-panel.js';

export function createWorksheetScreen({
  unit,
  videoSourceRepository,
  worksheetAttemptRepository,
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

  async function loadAndRenderExercises() {
    const attemptsByExerciseId = worksheetAttemptRepository
      ? await worksheetAttemptRepository.getAttemptsForUnit({ userId, bookId: unit.bookId, unitNumber: unit.unitNumber, accessToken })
      : {};

    if (destroyed) return;
    loadingNotice.remove();

    unit.sections.forEach((section) => {
      const sectionEl = document.createElement('section');
      sectionEl.setAttribute('data-part', 'section');

      const sectionTitle = document.createElement('h2');
      sectionTitle.setAttribute('data-part', 'section-title');
      sectionTitle.className = 'al-type-ui-label';
      sectionTitle.textContent = section.title;
      sectionEl.appendChild(sectionTitle);

      section.exercises.forEach((exercise) => {
        const component = createWorksheetExercise(exercise, {
          initialState: attemptsByExerciseId[exercise.id] ?? null,
          onGraded: ({ response, result, attemptsUsed }) => {
            worksheetAttemptRepository?.saveAttempt({
              userId,
              bookId: unit.bookId,
              unitNumber: unit.unitNumber,
              exerciseId: exercise.id,
              response,
              result,
              attemptsUsed,
              accessToken,
            });
          },
        });
        exerciseComponents.push(component);
        exerciseIds.push(exercise.id);
        sectionEl.appendChild(component.element);
      });

      mainContent.appendChild(sectionEl);
    });
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
