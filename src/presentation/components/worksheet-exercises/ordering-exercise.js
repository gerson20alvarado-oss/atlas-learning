/**
 * presentation/components/worksheet-exercises/ordering-exercise.js
 *
 * Ordenamiento — cada ítem se muestra en su orden impreso original,
 * con un selector de posición (1..N). Deliberadamente sin
 * arrastrar-y-soltar: Atlas no tiene hoy ninguna librería de drag
 * and drop.
 *
 * Sin límite de intentos propio: el estudiante puede presionar
 * "Check answers" cuantas veces quiera mientras la unidad no se haya
 * enviado (en `reviewPolicy: 'practice'` — ver más abajo). El único
 * control de intentos real es `unit_attempt_limits`, un nivel más
 * arriba — este componente nunca cuenta ni recuerda cuántas veces se
 * calificó a sí mismo.
 *
 * Disponibilidad: sigue consumiendo exclusivamente
 * `getExerciseAvailability()` — nunca decide por su cuenta si debe
 * bloquearse.
 *
 * `reviewPolicy` (esta sesión): 'practice' (default) mantiene el
 * comportamiento de siempre. 'exam' quita el Check Answers propio y
 * nunca pinta `data-result` — mismo `validate()` de siempre, invocado
 * una sola vez por assessment-screen.js al enviar toda la evaluación.
 * Sin uso real todavía (Progress Test Unit 1 no usa `ordering`), pero
 * el mismo motor queda listo por si una evaluación futura sí lo hace.
 */

import { getExerciseAvailability } from '../../../domain/exercise-availability/exercise-availability-service.js';
import { createPrimaryButton } from '../primary-button/primary-button.js';

export function createOrderingExercise(
  exercise,
  { initialState, unitCompleted = false, reviewPolicy = 'practice', onGraded, onChange } = {},
) {
  const isExam = reviewPolicy === 'exam';

  const element = document.createElement('div');
  element.setAttribute('data-component', 'ordering-exercise');

  const instruction = document.createElement('p');
  instruction.setAttribute('data-part', 'instruction');
  instruction.className = 'al-type-ui-label';
  instruction.textContent = exercise.instruction;
  element.appendChild(instruction);

  const list = document.createElement('div');
  list.setAttribute('data-part', 'items');

  const positions = new Map(); // itemId -> number | null
  const selectsByItemId = new Map();
  const rowsByItemId = new Map();

  const previousPositionByItemId = new Map();
  (initialState?.response ?? []).forEach((itemId, index) => {
    previousPositionByItemId.set(itemId, index + 1);
  });

  exercise.items.forEach((item) => {
    const restoredPosition = previousPositionByItemId.get(item.id) ?? null;
    positions.set(item.id, restoredPosition);

    const row = document.createElement('div');
    row.setAttribute('data-part', 'item');
    rowsByItemId.set(item.id, row);

    const select = document.createElement('select');
    select.setAttribute('data-part', 'position');
    select.setAttribute('aria-label', `Position for: ${item.text}`);
    selectsByItemId.set(item.id, select);

    const blankOption = document.createElement('option');
    blankOption.value = '';
    blankOption.textContent = '–';
    select.appendChild(blankOption);

    exercise.items.forEach((_, index) => {
      const option = document.createElement('option');
      option.value = String(index + 1);
      option.textContent = String(index + 1);
      select.appendChild(option);
    });

    if (restoredPosition !== null) select.value = String(restoredPosition);

    select.addEventListener('change', () => {
      positions.set(item.id, select.value ? Number(select.value) : null);
      row.removeAttribute('data-result');
      onChange?.();
    });

    const text = document.createElement('span');
    text.setAttribute('data-part', 'text');
    text.textContent = item.text;

    row.appendChild(select);
    row.appendChild(text);
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
    return [...positions.entries()]
      .filter(([, position]) => position !== null)
      .sort((a, b) => a[1] - b[1])
      .map(([itemId]) => itemId);
  }

  function isAnswered() {
    return [...positions.values()].every((p) => p !== null);
  }

  function validate() {
    const response = getResponse();
    return exercise.items.map((item, index) => ({
      itemId: item.id,
      isCorrect: response[index] === exercise.correctOrder[index],
    }));
  }

  return Object.freeze({ element, update, destroy, getResponse, isAnswered, validate });
}
