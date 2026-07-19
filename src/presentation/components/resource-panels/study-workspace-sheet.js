/**
 * presentation/components/resource-panels/study-workspace-sheet.js
 *
 * El Espacio de Estudio. Corrección de UX (esta sesión, tras prueba
 * manual): ya no renderiza el enunciado de cada ejercicio — el
 * estudiante ya lo ve en la página real del libro; duplicarlo
 * contradecía "el libro es el protagonista". El Exercise Engine
 * sigue usándose exactamente igual por dentro (Attempt real,
 * `onCheck` real, sin tocar su lógica) — cada bloque de ejercicio
 * solo recibe `hidePrompt: true` (practice-block.js, extensión
 * aditiva) para omitir la Question; Answer area y Feedback quedan
 * intactos, porque ahí sí ocurre algo que el papel no puede dar.
 *
 * Ya no se auto-envuelve en `resource-panel-overlay` — expone su
 * contenido en bruto (`{ element, destroy }`) para que quien lo monte
 * (page-reader-screen.js) decida el contenedor: modal centrado o
 * panel lateral, según el recurso. Arquitectónicamente sigue siendo
 * el mismo componente; solo cambió quién decide su presentación.
 *
 * Aloja, para una página: (a) los ejercicios reales de esa página,
 * sin su enunciado; (b) las notas libres del estudiante, con
 * guardado automático; (c) las imágenes que el estudiante suba; (d)
 * si existe un `PageResource(answerKey)` para la misma página, una
 * sección colapsable de respuestas oficiales — composición en la
 * interfaz, nunca en el dato (Technical Specification v2.1, §8.3).
 */

import { createContentBlock } from '../content-blocks/content-block-renderer.js';
import { getExerciseContentContext } from '../../../domain/content/content-repository.js';
import { getExerciseById } from '../../../domain/exercise/exercise-repository.js';
import { evaluateExercise } from '../../../domain/exercise/exercise-evaluator.js';

const NOTES_SAVE_DEBOUNCE_MS = 800;

function resolveExerciseBlocks({ resource, bookId, attemptRepository, userId }) {
  return resource.exerciseIds.map((exerciseId) => {
    const context = getExerciseContentContext(bookId, exerciseId);
    if (!context) {
      return { id: exerciseId, type: 'practice', exerciseId, hidePrompt: true, exercise: null, priorAttempt: null, onCheck: null };
    }
    const { block, lessonId } = context;
    const exercise = getExerciseById(exerciseId);
    if (!exercise) {
      return { ...block, hidePrompt: true, exercise: null, priorAttempt: null, onCheck: null };
    }
    const latestAttempt = attemptRepository.getLatestAttempt(lessonId, exerciseId);
    const priorAttempt = latestAttempt?.isCorrect ? latestAttempt : null;
    const onCheck = (response) => {
      const result = evaluateExercise(exercise, response);
      attemptRepository.recordAttempt({ exerciseId, lessonId, response, isCorrect: result.isCorrect, userId });
      return result;
    };
    return { ...block, hidePrompt: true, exercise, priorAttempt, onCheck };
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
}) {
  const container = document.createElement('div');
  container.setAttribute('data-component', 'study-workspace-sheet');

  // --- Título propio (el contenedor que lo monte ya no lo provee) ---
  const title = document.createElement('h2');
  title.setAttribute('data-part', 'title');
  title.className = 'al-type-ui-label';
  title.textContent = 'Espacio de Estudio';
  container.appendChild(title);

  // --- Ejercicios reales, sin enunciado duplicado ---
  // Corrección de UX (esta sesión, tras prueba manual): solo se
  // muestran los ejercicios que de verdad tienen un Exercise
  // resuelto. Sin el enunciado encima (hidePrompt), un ejercicio sin
  // Exercise real quedaba como una línea de aviso flotando sin
  // contexto — no es contenido, es ruido visual. El aviso neutral
  // sigue existiendo tal cual en la Vista de Lectura heredada, donde
  // el enunciado que lo precede sí le da sentido.
  const exercisesSection = document.createElement('div');
  exercisesSection.setAttribute('data-part', 'exercises');
  const exerciseBlocks = resolveExerciseBlocks({ resource, bookId, attemptRepository, userId })
    .filter((block) => block.exercise)
    .map((block) => createContentBlock(block));
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

  if (exerciseBlocks.length > 0) container.appendChild(exercisesSection);
  container.appendChild(notesLabel);
  container.appendChild(notesTextarea);
  container.appendChild(imagesGrid);
  container.appendChild(imageInput);
  if (answerSection) container.appendChild(answerSection);

  // Carga inicial: entrada ya guardada (notas + imágenes reales).
  studyWorkspaceRepository.getEntry({ userId, bookId, pageNumber, accessToken }).then((entry) => {
    notesTextarea.value = entry.notes;
    currentImageRefs = entry.imageRefs;
    renderImages();
  });

  function destroy() {
    window.clearTimeout(notesSaveTimer);
    exerciseBlocks.forEach((component) => component.destroy());
    container.remove();
  }

  return Object.freeze({ element: container, destroy });
}
