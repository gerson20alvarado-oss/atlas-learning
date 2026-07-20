/**
 * presentation/components/worksheet-exercises/discussion-prompt.js
 *
 * Preguntas de discusión/producción oral abiertas — sin respuesta
 * única. No captura nada por su cuenta: la arquitectura ya aprobada
 * asigna esa función al Espacio de Estudio existente (genérico,
 * indiferente al libro), no a un campo propio de cada ejercicio —
 * duplicarlo aquí habría sido inconsistente con esa misma decisión.
 * `getResponse()`/`isAnswered()` existen por contrato (todo
 * componente los expone), pero devuelven un valor honesto: no hay
 * nada que este componente capture, y una pregunta abierta nunca
 * bloquea el avance del estudiante.
 *
 * `exercise.image` (esta sesión): algunos ejercicios de Comprehension
 * citan "the picture from the video" — el estudiante la necesita ver
 * ahí mismo para responder, no escondida detrás del botón "Watch the
 * video" (un recurso distinto, ImageSource, no VideoSource: es una
 * foto fija impresa junto al ejercicio, nunca un frame extraído del
 * video). Mismo aviso honesto que video-panel.js mientras resuelve o
 * si el archivo todavía no se subió a Storage — nunca una URL rota
 * silenciosa.
 */

export function createDiscussionPrompt(exercise, { imageSourceRepository } = {}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'discussion-prompt');

  const instruction = document.createElement('p');
  instruction.setAttribute('data-part', 'instruction');
  instruction.className = 'al-type-ui-label';
  instruction.textContent = exercise.instruction;
  element.appendChild(instruction);

  let destroyed = false;

  if (exercise.image) {
    const imageStatus = document.createElement('p');
    imageStatus.setAttribute('data-part', 'image-status');
    imageStatus.className = 'al-type-ui-caption';
    imageStatus.textContent = 'Cargando imagen…';
    element.appendChild(imageStatus);

    if (imageSourceRepository) {
      imageSourceRepository.getImageUrl(exercise.image.assetPath).then((url) => {
        if (destroyed) return;
        imageStatus.remove();

        if (!url) {
          const unavailable = document.createElement('p');
          unavailable.setAttribute('data-part', 'image-status');
          unavailable.className = 'al-type-ui-caption';
          unavailable.textContent = 'Esta imagen todavía no está disponible.';
          element.appendChild(unavailable);
          return;
        }

        const img = document.createElement('img');
        img.setAttribute('data-part', 'exercise-image');
        img.src = url;
        img.alt = exercise.image.alt ?? '';
        element.appendChild(img);
      });
    } else {
      imageStatus.textContent = 'Esta imagen todavía no está disponible.';
    }
  }

  if (exercise.quote) {
    const quote = document.createElement('blockquote');
    quote.setAttribute('data-part', 'quote');
    quote.textContent = exercise.quote;
    element.appendChild(quote);
  }

  if (exercise.prompts?.length) {
    const list = document.createElement('ol');
    list.setAttribute('data-part', 'prompts');
    exercise.prompts.forEach((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.appendChild(item);
    });
    element.appendChild(list);
  }

  if (exercise.example) {
    const example = document.createElement('p');
    example.setAttribute('data-part', 'example');
    example.textContent = exercise.example;
    element.appendChild(example);
  }

  function update() {}

  function destroy() {
    destroyed = true;
    element.remove();
  }

  function getResponse() {
    return null; // sin captura propia, a propósito — ver docstring
  }

  function isAnswered() {
    return true; // una pregunta abierta nunca bloquea el avance
  }

  return Object.freeze({ element, update, destroy, getResponse, isAnswered });
}
