/**
 * presentation/components/content-blocks/typing-block.js
 *
 * Typing (Design System §17.5): "Free response: prompt in reading
 * voice, one full-width input... submit via the continue/check
 * action." El envío ocurre cuando el botón compartido de la Session
 * (Continue/Check) invoca `checkNow()` — este componente nunca se
 * auto-envía ni conoce Session/Router (Sprint 5 Plan, "observación
 * arquitectónica adicional"): solo captura texto y expone su estado.
 *
 * Bloqueo tras responder (§17.3, aplicado igual aquí): una vez
 * verificado, el input queda deshabilitado para esa misma
 * instancia — correcto o incorrecto. Un reintento genuino ocurre
 * al volver a entrar a la Lección (nueva instancia, ver
 * app/screen-router.js: solo se restaura como "ya respondido" si el
 * último Attempt fue correcto).
 */

export function createTypingBlock({ exercise, priorAttempt, onCheck }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'typing-block');

  const input = document.createElement('input');
  input.type = 'text';
  input.setAttribute('data-part', 'input');
  input.setAttribute('aria-label', 'Tu respuesta');

  const feedback = document.createElement('p');
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
