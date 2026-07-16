/**
 * presentation/components/content-blocks/fill-blank-block.js
 *
 * Fill in the blank (Design System §17.4): "an inline field within
 * the sentence... Width ≈ expected answer + 2ch; bottom-border-only
 * style." Mismo ciclo de verificación externa que typing-block.js
 * (`checkNow()` invocado por el Continue/Check compartido) — nunca
 * se auto-envía.
 */

export function createFillBlankBlock({ exercise, priorAttempt, onCheck }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'fill-blank-block');

  const expectedLength = (exercise.acceptedAnswers?.[0] ?? '').length || 4;

  const input = document.createElement('input');
  input.type = 'text';
  input.setAttribute('data-part', 'blank');
  input.setAttribute('aria-label', 'Completa el espacio en blanco');
  input.style.width = `${expectedLength + 2}ch`;

  const feedback = document.createElement('span');
  feedback.setAttribute('data-part', 'feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.hidden = true;

  element.appendChild(input);
  element.appendChild(feedback);

  let locked = Boolean(priorAttempt);

  function paintFeedback(result) {
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
    input.value = priorAttempt.response;
    input.disabled = true;
    paintFeedback({ isCorrect: true, correctAnswerDisplay: priorAttempt.response });
  }

  function getPendingResponse() {
    if (locked) return null;
    const value = input.value.trim();
    return value.length > 0 ? value : null;
  }

  function isAnswered() {
    return locked;
  }

  function checkNow() {
    if (locked) return;
    const response = getPendingResponse();
    if (response === null) return;
    const result = onCheck(response);
    locked = true;
    input.disabled = true;
    paintFeedback(result);
  }

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy, getPendingResponse, isAnswered, checkNow });
}
