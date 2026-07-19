/**
 * presentation/components/resource-panels/study-workspace-sheet.js
 *
 * El Espacio de Estudio (Sprint Proposal — Nuevo Reader, Etapas 8 y
 * 9 combinadas): aloja, para una página, (a) los ejercicios reales
 * de esa página vía el Exercise Engine ya existente, sin modificar
 * su lógica; (b) las notas libres del estudiante, con guardado
 * automático; (c) las imágenes que el estudiante suba; (d) si existe
 * un `PageResource(answerKey)` para la misma página, una sección
 * colapsable de respuestas oficiales — composición en la interfaz,
 * nunca en el dato (Technical Specification v2.1, §8.3, ya
 * aprobado).
 *
 * Cada ejercicio se resuelve exactamente como ya lo hace
 * app/screen-router.js para la Vista de Lectura heredada
 * (`getExerciseContentContext` + `getExerciseById` +
 * `attemptRepository`) — mismo ciclo Question → Answer → Feedback,
 * el mismo componente real (`createContentBlock`), sin ninguna
 * reconstrucción propia.
 */

import { createContentBlock } from '../content-blocks/content-block-renderer.js';
import { createResourcePanelOverlay } from '../resource-panel-overlay/resource-panel-overlay.js';
import { getExerciseContentContext } from '../../../domain/content/content-repository.js';
import { getExerciseById } from '../../../domain/exercise/exercise-repository.js';
import { evaluateExercise } from '../../../domain/exercise/exercise-evaluator.js';

const NOTES_SAVE_DEBOUNCE_MS = 800;

function resolveExerciseBlocks({ resource, bookId, attemptRepository, userId }) {
  return resource.exerciseIds.map((exerciseId) => {
    const context = getExerciseContentContext(bookId, exerciseId);
    if (!context) {
      return { id: exerciseId, type: 'practice', exerciseId, prompt: '', exercise: null, priorAttempt: null, onCheck: null };
    }
    const { block, lessonId } = context;
    const exercise = getExerciseById(exerciseId);
    if (!exercise) {
      return { ...block, exercise: null, priorAttempt: null, onCheck: null };
    }
    const latestAttempt = attemptRepository.getLatestAttempt(lessonId, exerciseId);
    const priorAttempt = latestAttempt?.isCorrect ? latestAttempt : null;
    const onCheck = (response) => {
      const result = evaluateExercise(exercise, response);
      attemptRepository.recordAttempt({ exerciseId, lessonId, response, isCorrect: result.isCorrect, userId });
      return result;
    };
    return { ...block, exercise, priorAttempt, onCheck };
  });
}

export function createStudyWorkspaceSheet({
  resource,
  answerKeyResource,
  bookId,
  pageNumber,
  userId,
  accessToken,
  attemptRepository,
  studyWorkspaceRepository,
  onClose,
}) {
  const overlay = createResourcePanelOverlay({ title: `Espacio de Estudio — ${resource.pageTemplate}`, onClose });

  const container = document.createElement('div');
  container.setAttribute('data-component', 'study-workspace-sheet');

  // --- Ejercicios reales ---
  const exercisesSection = document.createElement('div');
  exercisesSection.setAttribute('data-part', 'exercises');
  const exerciseBlocks = resolveExerciseBlocks({ resource, bookId, attemptRepository, userId }).map((block) =>
    createContentBlock(block),
  );
  exerciseBlocks.forEach((component) => exercisesSection.appendChild(component.element));

  // --- Notas ---
  const notesLabel = document.createElement('label');
  notesLabel.className = 'al-type-ui-caption';
  notesLabel.setAttribute('data-part', 'notes-label');
  notesLabel.textContent = 'Mis notas';

  const notesTextarea = document.createElement('textarea');
  notesTextarea.setAttribute('data-part', 'notes');
  notesTextarea.setAttribute('aria-label', 'Mis notas');

  let notesSaveTimer = null;
  function scheduleSave() {
    window.clearTimeout(notesSaveTimer);
    notesSaveTimer = window.setTimeout(() => {
      studyWorkspaceRepository.saveEntry({
        userId,
        bookId,
        pageNumber,
        notes: notesTextarea.value,
        imageRefs: currentImageRefs,
        accessToken,
      });
    }, NOTES_SAVE_DEBOUNCE_MS);
  }
  notesTextarea.addEventListener('input', scheduleSave);

  // --- Imágenes ---
  let currentImageRefs = [];
  const imagesGrid = document.createElement('div');
  imagesGrid.setAttribute('data-part', 'images');

  const imageInput = document.createElement('input');
  imageInput.type = 'file';
  imageInput.accept = 'image/*';
  imageInput.setAttribute('data-part', 'image-input');
  imageInput.setAttribute('aria-label', 'Añadir imagen');

  async function renderImages() {
    const thumbnails = await Promise.all(
      currentImageRefs.map(async (path) => {
        const url = await studyWorkspaceRepository.getImageUrl({ path, accessToken });
        const figure = document.createElement('figure');
        figure.setAttribute('data-part', 'image-thumb');
        if (url) {
          const img = document.createElement('img');
          img.src = url;
          img.alt = '';
          figure.appendChild(img);
        }
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.setAttribute('data-part', 'remove-image');
        removeButton.setAttribute('aria-label', 'Quitar imagen');
        removeButton.textContent = '×';
        removeButton.addEventListener('click', async () => {
          await studyWorkspaceRepository.deleteImage({ path, accessToken });
          currentImageRefs = currentImageRefs.filter((ref) => ref !== path);
          await studyWorkspaceRepository.saveEntry({
            userId, bookId, pageNumber, notes: notesTextarea.value, imageRefs: currentImageRefs, accessToken,
          });
          renderImages();
        });
        figure.appendChild(removeButton);
        return figure;
      }),
    );
    imagesGrid.replaceChildren(...thumbnails);
  }

  imageInput.addEventListener('change', async () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    const path = await studyWorkspaceRepository.uploadImage({ userId, bookId, pageNumber, file, accessToken });
    if (path) {
      currentImageRefs = [...currentImageRefs, path];
      await studyWorkspaceRepository.saveEntry({
        userId, bookId, pageNumber, notes: notesTextarea.value, imageRefs: currentImageRefs, accessToken,
      });
      renderImages();
    }
    imageInput.value = '';
  });

  // --- Respuestas oficiales (colapsable, solo si el recurso existe en esta página) ---
  let answerSection = null;
  if (answerKeyResource) {
    answerSection = document.createElement('details');
    answerSection.setAttribute('data-part', 'answer-key');
    const summary = document.createElement('summary');
    summary.className = 'al-type-ui-caption';
    summary.textContent = 'Mostrar respuestas oficiales';
    const answerContent = document.createElement('p');
    answerContent.className = 'al-type-ui-caption';
    answerContent.textContent =
      'Las respuestas oficiales todavía no están disponibles — pendiente de producir el apéndice del libro.';
    answerSection.appendChild(summary);
    answerSection.appendChild(answerContent);
  }

  container.appendChild(exercisesSection);
  container.appendChild(notesLabel);
  container.appendChild(notesTextarea);
  container.appendChild(imagesGrid);
  container.appendChild(imageInput);
  if (answerSection) container.appendChild(answerSection);

  overlay.setContent(container);

  // Carga inicial: entrada ya guardada (notas + imágenes reales).
  studyWorkspaceRepository.getEntry({ userId, bookId, pageNumber, accessToken }).then((entry) => {
    notesTextarea.value = entry.notes;
    currentImageRefs = entry.imageRefs;
    renderImages();
  });

  function destroy() {
    window.clearTimeout(notesSaveTimer);
    exerciseBlocks.forEach((component) => component.destroy());
    overlay.destroy();
  }

  return Object.freeze({ element: overlay.element, destroy });
}
