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
 */

export function createDiscussionPrompt(exercise) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'discussion-prompt');

  const instruction = document.createElement('p');
  instruction.setAttribute('data-part', 'instruction');
  instruction.className = 'al-type-ui-label';
  instruction.textContent = exercise.instruction;
  element.appendChild(instruction);

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
