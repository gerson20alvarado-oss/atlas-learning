/**
 * presentation/components/resource-panels/study-workspace-sheet.js
 *
 * El Espacio de Estudio — cuaderno personal del estudiante, y nada
 * más (corrección de concepto, esta sesión, tras prueba manual). No
 * es una superficie para resolver ejercicios — el estudiante ya ve
 * el ejercicio en la página real del libro. Por diseño, deja de
 * conocer por completo la existencia del Exercise Engine: no importa
 * `content-block-renderer.js`, no resuelve `exerciseId`, no llama a
 * `attemptRepository`. Su contenido es idéntico en cualquier página
 * del libro — gramática, vocabulario, audio, lo que sea — nunca
 * varía según el tipo de recurso.
 *
 * Consecuencia real, ya conocida y aceptada: ningún `Attempt` se
 * genera desde este panel. El estudiante lee la pregunta en la
 * página, escribe lo que quiera en sus notas, y puede revelar la
 * respuesta oficial para autoevaluarse — nada de eso queda
 * registrado como intento verificado.
 *
 * Contiene, siempre, exactamente lo mismo: título (con su
 * equivalente en coreano), notas con guardado automático, adjuntar
 * imágenes, y una sección colapsable de respuestas oficiales.
 */

const ANSWER_KEY_PENDING_MESSAGE = 'Aquí podrás ver las respuestas oficiales cuando estén disponibles.';
const NOTES_SAVE_DEBOUNCE_MS = 800;

export function createStudyWorkspaceSheet({
  answerKeyResource,
  bookId,
  pageNumber,
  userId,
  accessToken,
  studyWorkspaceRepository,
}) {
  const container = document.createElement('div');
  container.setAttribute('data-component', 'study-workspace-sheet');

  // --- Título, con su equivalente en coreano ---
  const title = document.createElement('h2');
  title.setAttribute('data-part', 'title');
  title.className = 'al-type-ui-label';
  title.textContent = 'Espacio de Estudio';

  const titleKo = document.createElement('p');
  titleKo.setAttribute('data-part', 'title-ko');
  titleKo.className = 'al-type-ui-caption';
  titleKo.lang = 'ko';
  titleKo.textContent = '학습 공간';

  const titleDivider = document.createElement('hr');
  titleDivider.setAttribute('data-part', 'divider');

  // --- Notas ---
  const notesLabel = document.createElement('label');
  notesLabel.className = 'al-type-ui-label';
  notesLabel.setAttribute('data-part', 'notes-label');
  notesLabel.textContent = 'Mis notas';

  const notesTextarea = document.createElement('textarea');
  notesTextarea.setAttribute('data-part', 'notes');
  notesTextarea.setAttribute('aria-label', 'Mis notas');
  notesTextarea.placeholder = 'Escribe aquí tus notas...';

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
  imageInput.id = `study-workspace-image-input-${bookId}-${pageNumber}`;
  imageInput.setAttribute('data-part', 'image-input');
  imageInput.setAttribute('aria-label', 'Añadir imagen');

  const imageInputLabel = document.createElement('label');
  imageInputLabel.setAttribute('data-part', 'image-input-label');
  imageInputLabel.setAttribute('for', imageInput.id);
  imageInputLabel.textContent = '📎 Elegir archivo';

  const imageInputStatus = document.createElement('span');
  imageInputStatus.setAttribute('data-part', 'image-input-status');
  imageInputStatus.className = 'al-type-ui-caption';
  imageInputStatus.textContent = 'Ningún archivo seleccionado';

  const imageInputRow = document.createElement('div');
  imageInputRow.setAttribute('data-part', 'image-input-row');
  imageInputRow.appendChild(imageInputLabel);
  imageInputRow.appendChild(imageInput);
  imageInputRow.appendChild(imageInputStatus);

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
    imageInputStatus.textContent = file.name;
    const path = await studyWorkspaceRepository.uploadImage({ userId, bookId, pageNumber, file, accessToken });
    if (path) {
      currentImageRefs = [...currentImageRefs, path];
      await studyWorkspaceRepository.saveEntry({
        userId, bookId, pageNumber, notes: notesTextarea.value, imageRefs: currentImageRefs, accessToken,
      });
      renderImages();
    }
    imageInput.value = '';
    imageInputStatus.textContent = 'Ningún archivo seleccionado';
  });

  // --- Respuestas oficiales — siempre presente, mismo contenido en
  // toda página sin recurso real todavía; se completará sola cuando
  // el apéndice del libro se produzca (ver page-resource-catalog.js).
  const answerDivider = document.createElement('hr');
  answerDivider.setAttribute('data-part', 'divider');

  const answerSection = document.createElement('details');
  answerSection.setAttribute('data-part', 'answer-key');
  answerSection.open = true;
  const summary = document.createElement('summary');
  summary.textContent = 'Mostrar respuestas oficiales';
  const answerContent = document.createElement('p');
  answerContent.className = 'al-type-ui-caption';
  answerContent.textContent = ANSWER_KEY_PENDING_MESSAGE;
  answerSection.appendChild(summary);
  answerSection.appendChild(answerContent);

  container.appendChild(title);
  container.appendChild(titleKo);
  container.appendChild(titleDivider);
  container.appendChild(notesLabel);
  container.appendChild(notesTextarea);
  container.appendChild(imageInputRow);
  container.appendChild(imagesGrid);
  container.appendChild(answerDivider);
  container.appendChild(answerSection);

  // Carga inicial: entrada ya guardada (notas + imágenes reales).
  studyWorkspaceRepository.getEntry({ userId, bookId, pageNumber, accessToken }).then((entry) => {
    notesTextarea.value = entry.notes;
    currentImageRefs = entry.imageRefs;
    renderImages();
  });

  function destroy() {
    window.clearTimeout(notesSaveTimer);
    container.remove();
  }

  return Object.freeze({ element: container, destroy });
}
