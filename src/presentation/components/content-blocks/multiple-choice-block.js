/**
 * presentation/components/content-blocks/multiple-choice-block.js
 *
 * Multiple choice (Design System §17.3): opciones como filas de ancho
 * completo; rest → selected → tras responder: chosen-correct/
 * chosen-incorrect/actual-correct revelada, todas las opciones
 * quedan deshabilitadas. "One tap selects; the session's continue/
 * check action confirms" — seleccionar una opción NUNCA evalúa por
 * sí sola; solo `checkNow()` (invocado por el Continue/Check
 * compartido) lo hace.
 *
 * Ningún ejercicio de Hi! Korean 3A Lesson 1-1 usa este tipo todavía
 * (el libro, en esta lección, es principalmente producción/
 * transformación) — este componente existe porque el Exercise Engine
 * debe soportar los tres tipos aprobados independientemente de qué
 * tipos use el primer libro real (Sprint 5 Plan: "nunca diseñes el
 * motor pensando únicamente en Hi! Korean").
 */

export function createMultipleChoiceBlock({ exercise, priorAttempt, onCheck }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'multiple-choice-block');

  let selectedOptionId = priorAttempt ? priorAttempt.response : null;
  let locked = Boolean(priorAttempt);

  const optionsList = document.createElement('div');
  optionsList.setAttribute('data-part', 'options');

  const feedback = document.createElement('p');
  feedback.setAttribute('data-part', 'feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.hidden = true;

  const optionButtons = new Map();

  exercise.options.forEach((option) => {
    const optionEl = document.createElement('button');
    optionEl.type = 'button';
    optionEl.setAttribute('data-part', 'option');
    optionEl.textContent = option.text;
    optionEl.disabled = locked;
    if (option.id === selectedOptionId) {
      optionEl.setAttribute('data-state', 'selected');
    }
    optionEl.addEventListener('click', () => {
      if (locked) return;
      selectedOptionId = option.id;
      optionButtons.forEach((el, id) => {
        el.toggleAttribute('data-state', id === option.id);
        if (id === option.id) el.setAttribute('data-state', 'selected');
        else el.removeAttribute('data-state');
      });
    });
    optionButtons.set(option.id, optionEl);
    optionsList.appendChild(optionEl);
  });

  element.appendChild(optionsList);
  element.appendChild(feedback);

  function paintPostAnswerStates(result) {
    optionButtons.forEach((el, id) => {
      el.disabled = true;
      if (id === selectedOptionId && result.isCorrect) {
        el.setAttribute('data-state', 'chosen-correct');
      } else if (id === selectedOptionId && !result.isCorrect) {
        el.setAttribute('data-state', 'chosen-incorrect');
      } else if (id === exercise.correctOptionId) {
        el.setAttribute('data-state', 'actual-correct');
      } else {
        el.removeAttribute('data-state');
      }
    });

    feedback.hidden = false;
    if (result.isCorrect) {
      feedback.setAttribute('data-verdict', 'correct');
      feedback.textContent = 'Correct.';
    } else {
      feedback.setAttribute('data-verdict', 'incorrect');
      feedback.textContent = `Incorrect. The answer is ${result.correctAnswerDisplay}.`;
    }
  }

  if (priorAttempt) {
    paintPostAnswerStates({ isCorrect: true, correctAnswerDisplay: '' });
  }

  function getPendingResponse() {
    return locked ? null : selectedOptionId;
  }

  function isAnswered() {
    return locked;
  }

  function checkNow() {
    if (locked || selectedOptionId === null) return;
    const result = onCheck(selectedOptionId);
    locked = true;
    paintPostAnswerStates(result);
  }

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy, getPendingResponse, isAnswered, checkNow });
}
