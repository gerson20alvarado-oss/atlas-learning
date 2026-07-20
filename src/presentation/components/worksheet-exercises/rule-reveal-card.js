/**
 * presentation/components/worksheet-exercises/rule-reveal-card.js
 *
 * Patrón "revelar, no calificar" — usado tanto para la respuesta de
 * Comprehension B ("Watch the video, check your answer") como para
 * la caja de regla lingüística de Authentic English. Mismo
 * principio que `answerKey` ya usa en Hi! Korean (Technical
 * Specification v2.1, §8.3) — pero un componente propio de ALH,
 * nunca el mismo componente compartido entre libros.
 *
 * Sin `validate()`: no hay una respuesta del estudiante que
 * comparar, solo contenido que se revela a su propio ritmo.
 */

export function createRuleRevealCard(exercise) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'rule-reveal-card');

  const instruction = document.createElement('p');
  instruction.setAttribute('data-part', 'instruction');
  instruction.className = 'al-type-ui-label';
  instruction.textContent = exercise.instruction;
  element.appendChild(instruction);

  const details = document.createElement('details');
  details.setAttribute('data-part', 'reveal');

  const summary = document.createElement('summary');
  summary.textContent = exercise.revealLabel ?? 'Show answer';
  details.appendChild(summary);

  if (exercise.revealTitle) {
    const title = document.createElement('p');
    title.setAttribute('data-part', 'reveal-title');
    title.textContent = exercise.revealTitle;
    details.appendChild(title);
  }

  const text = document.createElement('p');
  text.setAttribute('data-part', 'reveal-text');
  text.textContent = exercise.revealText;
  details.appendChild(text);

  element.appendChild(details);

  function update() {}

  function destroy() {
    element.remove();
  }

  function getResponse() {
    return null; // nada que capturar — es contenido revelado, no una respuesta del estudiante
  }

  function isAnswered() {
    return true;
  }

  return Object.freeze({ element, update, destroy, getResponse, isAnswered });
}
