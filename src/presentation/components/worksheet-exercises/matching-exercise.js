/**
 * presentation/components/worksheet-exercises/matching-exercise.js
 *
 * Matching — cada `item` (el enunciado de la izquierda) se asocia,
 * vía un `<select>`, con una `option` de una lista compartida (la
 * columna de la derecha). Mismo mecanismo de selector que
 * ordering-exercise.js (nunca arrastrar-y-soltar — Atlas no tiene
 * ninguna librería de drag and drop), aplicado aquí a un pool de
 * opciones con texto en vez de posiciones numéricas.
 *
 * Una `option` puede quedar sin usar a propósito (el distractor de
 * Progress Test Unit 1 Vocabulary B, por ejemplo) — este componente
 * nunca exige que todas las opciones se asignen, solo que todos los
 * items tengan una.
 *
 * Sin límite de intentos propio (mismo criterio que el resto de
 * ALH): el único control real es `unit_attempt_limits`.
 *
 * `reviewPolicy` (esta sesión): 'practice' (default) mantiene el
 * comportamiento de siempre — Check Answers propio, marca
 * correcto/incorrecto por ítem al toque. 'exam' quita el botón
 * propio por completo y nunca pinta `data-result` — el componente
 * solo captura respuestas; `validate()` sigue existiendo tal cual,
 * para que assessment-screen.js la invoque una sola vez, al enviar
 * toda la evaluación.
 */

import { getExerciseAvailability } from '../../../domain/exercise-availability/exercise-availability-service.js';
import { createPrimaryButton } from '../primary-button/primary-button.js';

export function createMatchingExercise(
  exercise,
  { initialState, unitCompleted = false, reviewPolicy = 'practice', onGraded, onChange } = {},
) {
  const isExam = reviewPolicy === 'exam';

  const element = document.createElement('div');
  element.setAttribute('data-component', 'matching-exercise');

  const instruction = document.createElement('p');
  instruction.setAttribute('data-part', 'instruction');
  instruction.className = 'al-type-ui-label';
  instruction.textContent = exercise.instruction;
  element.appendChild(instruction);

  const list = document.createElement('div');
  list.setAttribute('data-part', 'items');

  const responses = new Map(); // itemId -> optionId | null
  const selectsByItemId = new Map();
  const rowsByItemId = new Map();

  const previousResponses = initialState?.response ?? {};

  exercise.items.forEach((item, index) => {
    const restored = previousResponses[item.id] ?? null;
    responses.set(item.id, restored);

    const row = document.createElement('div');
    row.setAttribute('data-part', 'item');
    rowsByItemId.set(item.id, row);

    const number = document.createElement('span');
    number.setAttribute('data-part', 'item-number');
    number.textContent = String(index + 1);
    row.appendChild(number);

    const statement = document.createElement('span');
    statement.setAttribute('data-part', 'statement');
    statement.textContent = item.statement;
    row.appendChild(statement);

    const select = document.createElement('select');
    select.setAttribute('data-part', 'option-select');
    select.setAttribute('aria-label', `Match for: ${item.statement}`);
    selectsByItemId.set(item.id, select);

    const blankOption = document.createElement('option');
    blankOption.value = '';
    blankOption.textContent = '–';
    select.appendChild(blankOption);

    exercise.options.forEach((option) => {
      const optionEl = document.createElement('option');
      optionEl.value = option.id;
      optionEl.textContent = option.text;
      select.appendChild(optionEl);
    });

    if (restored) select.value = restored;

    select.addEventListener('change', () => {
      responses.set(item.id, select.value || null);
      row.removeAttribute('data-result');
      onChange?.();
    });

    row.appendChild(select);
    list.appendChild(row);
  });

  element.appendChild(list);

  let checkButton = null;

  function lockExercise() {
    selectsByItemId.forEach((select) => { select.disabled = true; });
    if (checkButton) checkButton.disabled = true;
  }

  function applyResult(result) {
    result.forEach(({ itemId, isCorrect }) => {
      rowsByItemId.get(itemId).setAttribute('data-result', isCorrect ? 'correct' : 'incorrect');
    });
  }

  if (initialState?.result && !isExam) applyResult(initialState.result);

  if (!isExam) {
    const checkButtonComponent = createPrimaryButton({
      label: 'Check answers',
      onClick: () => {
        if (!isAnswered() || !getExerciseAvailability({ unitCompleted }).editable) return;

        const result = validate();
        applyResult(result);

        onGraded?.({ response: getResponse(), result });
      },
    });
    checkButton = checkButtonComponent.element;
    checkButton.setAttribute('data-part', 'check-button');
    element.appendChild(checkButton);
  }

  if (!getExerciseAvailability({ unitCompleted }).editable) lockExercise();

  function update() {}

  function destroy() {
    element.remove();
  }

  function getResponse() {
    return Object.fromEntries(responses);
  }

  function isAnswered() {
    return [...responses.values()].every((v) => v !== null);
  }

  function validate() {
    return exercise.items.map((item) => ({
      itemId: item.id,
      isCorrect: responses.get(item.id) === item.correctOptionId,
    }));
  }

  return Object.freeze({ element, update, destroy, getResponse, isAnswered, validate });
}
