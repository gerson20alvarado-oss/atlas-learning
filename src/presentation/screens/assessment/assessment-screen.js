/**
 * presentation/screens/assessment/assessment-screen.js
 *
 * Ensambla una evaluación completa (Worksheet, Progress Test, o
 * cualquier evaluación futura de la misma unidad — Quiz, Speaking
 * Assessment, Final Assessment): encabezado (con el botón de video,
 * cuando la unidad lo tiene), luego cada sección con sus ejercicios
 * reales, y un botón "Submit {título de la evaluación}" al final.
 *
 * Evoluciones independientes por unidad (esta sesión): este archivo
 * reemplaza a worksheet-screen.js — el componente nunca fue
 * realmente específico de "worksheet", solo recibía ese nombre
 * porque era la única evaluación que existía. Ahora recibe un objeto
 * `assessment` ya aplanado por
 * `domain/worksheet-content/worksheet-content-repository.js#getAssessment()`
 * ({ bookId, unitNumber, unitTitle, video, assessmentId,
 * assessmentTitle, maxAttempts, sections }) — Worksheet y Progress
 * Test se renderizan con exactamente esta misma función, cada una
 * con su propio `assessmentId`, nunca compartiendo intentos ni
 * respuestas entre sí (`unitAttemptRepository`/
 * `worksheetAttemptRepository` ya filtran por `assessmentId` en cada
 * llamada — ver docs/assessment-id-migration.sql).
 *
 * Modelo de intentos: 2 intentos por evaluación (declarados en
 * `assessment.maxAttempts`, propiedad de la evaluación, ya no de la
 * unidad). El concepto de "intentos por ejercicio" no existe —
 * mientras la evaluación no se haya enviado, cada ejercicio permite
 * recalificarse sin límite. El único momento en que se consume un
 * intento sigue siendo presionar "Submit" — acción explícita del
 * estudiante, sin inferencia automática.
 *
 * Transición entre evaluaciones (esta sesión, decisión de producto
 * cerrada): nunca automática. Si quien compone la pantalla
 * (screen-router.js) pasa `nextAssessment: { label, onSelect }`, el
 * Summary de la evaluación actual muestra ese botón — pero el
 * Summary en sí (puntaje, intentos restantes, Start New Attempt)
 * sigue existiendo exactamente igual, sin recortes. El estudiante
 * decide cuándo continuar; nunca se le empuja a la siguiente
 * evaluación.
 */

import { createWorksheetExercise } from '../../components/worksheet-exercises/worksheet-exercise-renderer.js';
import { createVideoPanel } from '../../components/worksheet-exercises/video-panel.js';
import { createSidePanel } from '../../components/side-panel/side-panel.js';
import { createPrimaryButton } from '../../components/primary-button/primary-button.js';
import { GRADABLE_EXERCISE_TYPES } from '../../../domain/contracts/worksheet-exercise-lifecycle.js';

function collectGradableExerciseIds(assessment) {
  const ids = [];
  assessment.sections.forEach((section) => {
    section.exercises.forEach((exercise) => {
      if (GRADABLE_EXERCISE_TYPES.includes(exercise.type)) ids.push(exercise.id);
    });
  });
  return ids;
}

export function createAssessmentScreen({
  assessment,
  videoSourceRepository,
  imageSourceRepository,
  worksheetAttemptRepository,
  unitAttemptRepository,
  userId,
  accessToken,
  onBack,
  nextAssessment, // { label, onSelect } | undefined — ver docstring
}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'assessment-screen');
  element.setAttribute('data-assessment-id', assessment.assessmentId);

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
  unitNumber.textContent = String(assessment.unitNumber);

  const unitTitle = document.createElement('h1');
  unitTitle.setAttribute('data-part', 'unit-title');
  unitTitle.className = 'al-type-title';
  unitTitle.textContent = assessment.unitTitle;

  // Subtítulo de evaluación — hace explícito, siempre, en qué
  // evaluación de la unidad está el estudiante (Worksheet vs.
  // Progress Test vs. futuras) — antes no hacía falta porque solo
  // existía una.
  const assessmentTitleEl = document.createElement('p');
  assessmentTitleEl.setAttribute('data-part', 'assessment-title');
  assessmentTitleEl.className = 'al-type-ui-label';
  assessmentTitleEl.textContent = assessment.assessmentTitle;

  header.appendChild(unitNumber);
  header.appendChild(unitTitle);
  header.appendChild(assessmentTitleEl);

  const completedBanner = document.createElement('p');
  completedBanner.setAttribute('data-part', 'completed-banner');
  completedBanner.className = 'al-type-ui-caption';
  completedBanner.textContent = `This ${assessment.assessmentTitle} has been completed — showing your results (read-only).`;
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

  // Bug fix (esta sesión): "Watch the video" es exclusivo de
  // Worksheet — Progress Test nunca debe mostrarlo, aunque
  // `assessment.video` llegue poblado (getAssessment() copia
  // unit.video a cualquier evaluación por igual). Único cambio: se
  // agrega la comprobación de assessmentId a esta condición, nada
  // más se tocó.
  if (assessment.video && assessment.assessmentId === 'worksheet') {
    const watchButton = document.createElement('button');
    watchButton.type = 'button';
    watchButton.setAttribute('data-part', 'watch-video');
    watchButton.textContent = `▶ ${assessment.video.label}`;
    watchButton.addEventListener('click', () => {
      closeSidePanel();
      const panelContent = createVideoPanel({ video: assessment.video, videoSourceRepository });
      const panel = createSidePanel({ title: assessment.video.label, onClose: closeSidePanel });
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
  const gradableExerciseIds = collectGradableExerciseIds(assessment);
  const gradedResultsByExerciseId = new Map(); // id evaluable -> resultado (validate() output)

  // Política de revisión (esta sesión): 'exam' quita el Check
  // Answers propio de cada ejercicio — nada se califica hasta
  // Submit. Por eso la disponibilidad del botón ya no puede
  // depender de "ya se calificó" (gradedResultsByExerciseId, que
  // nunca se puebla antes de Submit en este modo); depende de
  // "ya se respondió" (isAnswered(), que todo ejercicio expone sin
  // cambios). 'practice' (Worksheet) sigue exactamente igual que
  // siempre.
  const isExam = assessment.reviewPolicy === 'exam';

  // --- Submit: progreso + botón, al final de la evaluación ---
  const submitRow = document.createElement('div');
  submitRow.setAttribute('data-part', 'submit-row');
  submitRow.hidden = true; // oculto por completo cuando la evaluación ya está completada

  const progressLabel = document.createElement('p');
  progressLabel.setAttribute('data-part', 'progress-label');
  progressLabel.className = 'al-type-ui-caption';

  const submitButton = createPrimaryButton({
    label: `Submit ${assessment.assessmentTitle}`,
    onClick: () => handleSubmit(),
  });
  submitButton.element.setAttribute('data-part', 'submit-button');

  submitRow.appendChild(progressLabel);
  submitRow.appendChild(submitButton.element);

  function updateProgress() {
    const total = gradableExerciseIds.length;
    let done;

    if (isExam) {
      done = exerciseComponents.filter(
        (component, index) => gradableExerciseIds.includes(exerciseIds[index]) && component.isAnswered(),
      ).length;
      progressLabel.textContent = `${done} of ${total} question${total === 1 ? '' : 's'} answered`;
    } else {
      done = gradableExerciseIds.filter((id) => gradedResultsByExerciseId.has(id)).length;
      progressLabel.textContent = `${done} of ${total} exercise${total === 1 ? '' : 's'} completed`;
    }

    submitButton.update({ disabled: done < total });
  }

  async function handleSubmit() {
    submitButton.update({ disabled: true });

    if (isExam) {
      // Modo examen: calificar aquí, una sola vez, al enviar — nunca
      // durante la sesión de respuesta (ningún ejercicio tiene su
      // propio Check Answers en este modo, así que `validate()`
      // nunca se invocó todavía). Guarda cada respuesta+resultado
      // igual que siempre lo hacía `onGraded`, solo que disparado
      // una vez para todos los ejercicios en vez de uno por uno.
      await Promise.all(
        exerciseComponents.map(async (component, index) => {
          const exerciseId = exerciseIds[index];
          if (!gradableExerciseIds.includes(exerciseId)) return;
          const result = component.validate();
          const response = component.getResponse();
          gradedResultsByExerciseId.set(exerciseId, result);
          await worksheetAttemptRepository?.saveAttempt({
            userId,
            bookId: assessment.bookId,
            unitNumber: assessment.unitNumber,
            assessmentId: assessment.assessmentId,
            exerciseId,
            response,
            result,
            accessToken,
          });
        }),
      );
      if (destroyed) return;
    }

    const newAttemptsUsed = await unitAttemptRepository?.incrementAttempt({
      bookId: assessment.bookId,
      unitNumber: assessment.unitNumber,
      assessmentId: assessment.assessmentId,
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
    summaryTitle.textContent = `You've submitted ${assessment.assessmentTitle}`;
    summary.appendChild(summaryTitle);

    const attemptsRemaining = assessment.maxAttempts != null && attemptsUsed != null
      ? Math.max(0, assessment.maxAttempts - attemptsUsed)
      : null;

    if (isExam) {
      // Modo examen (decisión de producto cerrada): únicamente
      // agregado — Score, Correct Answers, Percentage, Attempts
      // Remaining. Nunca cuál ítem falló, ni aquí ni al revisar
      // después (los ejercicios en este modo jamás pintan
      // data-result — ver los componentes de worksheet-exercises/).
      const percentage = totalGraded > 0 ? Math.round((correctCount / totalGraded) * 100) : 0;

      const summaryScore = document.createElement('p');
      summaryScore.setAttribute('data-part', 'summary-score');
      summaryScore.className = 'al-type-ui-body';
      summaryScore.textContent = `Score: ${correctCount} / ${totalGraded}`;
      summary.appendChild(summaryScore);

      const summaryCorrect = document.createElement('p');
      summaryCorrect.setAttribute('data-part', 'summary-correct-count');
      summaryCorrect.className = 'al-type-ui-body';
      summaryCorrect.textContent = `Correct Answers: ${correctCount}`;
      summary.appendChild(summaryCorrect);

      const summaryPercentage = document.createElement('p');
      summaryPercentage.setAttribute('data-part', 'summary-percentage');
      summaryPercentage.className = 'al-type-ui-body';
      summaryPercentage.textContent = `Percentage: ${percentage}%`;
      summary.appendChild(summaryPercentage);

      const summaryAttemptsRemaining = document.createElement('p');
      summaryAttemptsRemaining.setAttribute('data-part', 'summary-attempts-remaining');
      summaryAttemptsRemaining.className = 'al-type-ui-caption';
      summaryAttemptsRemaining.textContent =
        attemptsRemaining != null
          ? `Attempts Remaining: ${attemptsRemaining}`
          : 'Your attempt has been recorded.';
      summary.appendChild(summaryAttemptsRemaining);
    } else {
      const summaryScore = document.createElement('p');
      summaryScore.setAttribute('data-part', 'summary-score');
      summaryScore.className = 'al-type-ui-body';
      summaryScore.textContent = `${correctCount} of ${totalGraded} correct.`;
      summary.appendChild(summaryScore);

      // "Attempt X of Y completed" + intentos restantes, siempre
      // explícitos — nunca un mensaje genérico cuando sí se conoce el
      // número real (Flujo de Intentos, decisión de producto cerrada).
      const summaryAttempts = document.createElement('p');
      summaryAttempts.setAttribute('data-part', 'summary-attempts');
      summaryAttempts.className = 'al-type-ui-caption';

      if (attemptsUsed != null && assessment.maxAttempts != null) {
        summaryAttempts.textContent =
          `Attempt ${attemptsUsed} of ${assessment.maxAttempts} completed. ` +
          (attemptsRemaining > 0
            ? `${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`
            : 'No attempts remaining.');
      } else {
        summaryAttempts.textContent = 'Your attempt has been recorded.';
      }
      summary.appendChild(summaryAttempts);
    }

    const continueButton = createPrimaryButton({
      label: 'Continue',
      onClick: async () => {
        const attemptsByExerciseId = await worksheetAttemptRepository.getAttemptsForUnit({
          userId,
          bookId: assessment.bookId,
          unitNumber: assessment.unitNumber,
          assessmentId: assessment.assessmentId,
          accessToken,
        });
        if (destroyed) return;
        renderExercises({ attemptsByExerciseId, unitCompleted: true });
      },
    });
    continueButton.element.setAttribute('data-part', 'summary-continue');
    summary.appendChild(continueButton.element);

    // "Start New Attempt" — visible únicamente cuando quedan
    // intentos disponibles. Nunca toca attempts_used (ya refleja
    // correctamente el intento recién consumido) — solo borra las
    // respuestas de ESTA evaluación (nunca las de otra evaluación de
    // la misma unidad) para que se reconstruya en blanco. En modo
    // examen, esto significa responder TODA la evaluación de nuevo —
    // nunca "corregir solo lo que falló" (nunca se supo qué falló).
    if (attemptsRemaining > 0) {
      const startNewButton = createPrimaryButton({
        label: 'Start new attempt',
        onClick: async () => {
          startNewButton.update({ disabled: true });
          await worksheetAttemptRepository.deleteAttemptsForUnit({
            userId,
            bookId: assessment.bookId,
            unitNumber: assessment.unitNumber,
            assessmentId: assessment.assessmentId,
            accessToken,
          });
          if (destroyed) return;
          renderExercises({ attemptsByExerciseId: {}, unitCompleted: false });
        },
      });
      startNewButton.element.setAttribute('data-part', 'summary-start-new');
      summary.appendChild(startNewButton.element);
    }

    // Transición a la siguiente evaluación (decisión de producto
    // cerrada): nunca automática, nunca obligatoria. Solo aparece si
    // screen-router.js declaró que existe una siguiente evaluación
    // para esta unidad — este componente no sabe (ni le importa)
    // cuál es; solo reporta la elección. También se agrega en
    // renderExercises() más abajo — ver esa función para el porqué.
    appendNextAssessmentButton(summary);

    mainContent.replaceChildren(summary);
    submitRow.hidden = true;
  }

  /**
   * Corrección de regresión (esta sesión): el botón "Continue to X"
   * vivía únicamente dentro de showCompletionSummary(), que solo se
   * muestra una vez, justo después de presionar Submit. Cualquier
   * visita posterior (recarga de página, volver más tarde) salta
   * directo a la vista de solo lectura vía renderExercises(), donde
   * el botón nunca existió — el estudiante quedaba sin forma de
   * llegar al Progress Test una vez que esa primera vista se perdía.
   * Ahora este helper se llama desde AMBOS lugares: el Summary
   * transitorio y la vista persistente de solo lectura, así el botón
   * está disponible siempre que la evaluación esté completada, no
   * solo la primera vez.
   */
  function appendNextAssessmentButton(container) {
    if (!nextAssessment) return;
    const nextButton = createPrimaryButton({
      label: nextAssessment.label,
      onClick: () => nextAssessment.onSelect(),
    });
    nextButton.element.setAttribute('data-part', 'summary-next-assessment');
    container.appendChild(nextButton.element);
  }

  function renderExercises({ attemptsByExerciseId, unitCompleted }) {
    exerciseComponents.forEach((component) => component.destroy());
    exerciseComponents = [];
    exerciseIds = [];
    gradedResultsByExerciseId.clear();
    mainContent.replaceChildren();
    completedBanner.hidden = !unitCompleted;

    assessment.sections.forEach((section) => {
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
          imageSourceRepository,
          reviewPolicy: assessment.reviewPolicy,
          // Modo examen: nada dispara onGraded (sin Check Answers
          // propio) — cada cambio de respuesta debe recalcular la
          // disponibilidad de Submit por su cuenta.
          onChange: isExam ? updateProgress : undefined,
          onGraded: ({ response, result }) => {
            worksheetAttemptRepository?.saveAttempt({
              userId,
              bookId: assessment.bookId,
              unitNumber: assessment.unitNumber,
              assessmentId: assessment.assessmentId,
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

    // Corrección de regresión: la evaluación completada NUNCA debe
    // impedir llegar a la siguiente — este botón vive aquí también
    // (no solo en el Summary transitorio), visible en cada visita
    // mientras la evaluación siga en modo de solo lectura.
    if (unitCompleted && nextAssessment) {
      const nextAssessmentRow = document.createElement('div');
      nextAssessmentRow.setAttribute('data-part', 'next-assessment-row');
      appendNextAssessmentButton(nextAssessmentRow);
      mainContent.appendChild(nextAssessmentRow);
    }
  }

  async function loadAndRenderExercises() {
    const [attemptsByExerciseId, unitAttemptsUsed] = await Promise.all([
      worksheetAttemptRepository
        ? worksheetAttemptRepository.getAttemptsForUnit({
            userId,
            bookId: assessment.bookId,
            unitNumber: assessment.unitNumber,
            assessmentId: assessment.assessmentId,
            accessToken,
          })
        : Promise.resolve({}),
      unitAttemptRepository
        ? unitAttemptRepository.getAttemptsUsed({
            userId,
            bookId: assessment.bookId,
            unitNumber: assessment.unitNumber,
            assessmentId: assessment.assessmentId,
            accessToken,
          })
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
