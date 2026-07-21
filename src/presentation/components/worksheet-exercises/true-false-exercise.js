/**
 * presentation/components/worksheet-exercises/true-false-exercise.js
 *
 * Verdadero/Falso con corrección — el campo de texto para corregir
 * el enunciado solo aparece cuando el estudiante marca Falso.
 *
 * Sin límite de intentos propio: el estudiante puede presionar
 * "Check answers" cuantas veces quiera mientras la unidad no se haya
 * enviado (en `reviewPolicy: 'practice'` — ver más abajo). El único
 * control de intentos real es `unit_attempt_limits`.
 *
 * Alcance real, sin cambios: el texto de corrección libre sigue sin
 * calificarse automáticamente.
 *
 * `reviewPolicy` (esta sesión): 'practice' (default) mantiene el
 * comportamiento de siempre. 'exam' quita el Check Answers propio y
 * nunca pinta `data-result` — mismo `validate()` de siempre, invocado
 * una sola vez por assessment-screen.js al enviar toda la evaluación.
 */

import { getExerciseAvailability } from '../../../domain/exercise-availability/exercise-availability-service.js';
import { createPrimaryButton } from '../primary-button/primary-button.js';

export function createTrueFalseExercise(
  exercise,
  { initialState, unitCompleted = false, reviewPolicy = 'practice', onGraded, onChange } = {},
) {
  const isExam = reviewPolicy === 'exam';

  const element = document.createElement('div');
  element.setAttribute('data-component', 'true-false-exercise');

  const instruction = document.createElement('p');
  instruction.setAttribute('data-part', 'instruction');
  instruction.className = 'al-type-ui-label';
  instruction.textContent = exercise.instruction;
  element.appendChild(instruction);

  const list = document.createElement('div');
  list.setAttribute('data-part', 'items');

  const responses = new Map();
  const rowsByItemId = new Map();
  const radiosByItemId = new Map();
  const correctionFieldsByItemId = new Map();

  const previousResponses = initialState?.response ?? {};

  exercise.items.forEach((item) => {
    const restored = previousResponses[item.id] ?? { selected: null, correction: '' };
    responses.set(item.id, { selected: restored.selected, correction: restored.correction });

    const row = document.createElement('div');
    row.setAttribute('data-part', 'item');
    rowsByItemId.set(item.id, row);

    const statement = document.createElement('p');
    statement.setAttribute('data-part', 'statement');
    statement.textContent = item.statement;
    row.appendChild(statement);

    const choiceGroup = document.createElement('div');
    choiceGroup.setAttribute('data-part', 'choice-group');

    const correctionField = document.createElement('input');
    correctionField.type = 'text';
    correctionField.setAttribute('data-part', 'correction');
    correctionField.setAttribute('aria-label', 'Corrección');
    correctionField.placeholder = 'Write the correct sentence...';
    correctionField.hidden = restored.selected !== 'false';
    correctionField.value = restored.correction ?? '';
    correctionFieldsByItemId.set(item.id, correctionField);

    const radios = [];
    radiosByItemId.set(item.id, radios);

    ['true', 'false'].forEach((value) => {
      const label = document.createElement('label');
      label.setAttribute('data-part', 'choice');

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `tf-${item.id}`;
      radio.value = value;
      if (restored.selected === value) radio.checked = true;
      radios.push(radio);

      radio.addEventListener('change', () => {
        const response = responses.get(item.id);
        response.selected = value;
        correctionField.hidden = value !== 'false';
        if (value !== 'false') {
          response.correction = '';
          correctionField.value = '';
        }
        row.removeAttribute('data-result');
        onChange?.();
      });

      label.appendChild(radio);
      label.appendChild(document.createTextNode(value === 'true' ? 'True' : 'False'));
      choiceGroup.appendChild(label);
    });

    correctionField.addEventListener('input', () => {
      responses.get(item.id).correction = correctionField.value;
      onChange?.();
    });

    row.appendChild(choiceGroup);
    row.appendChild(correctionField);
    list.appendChild(row);
  });

  element.appendChild(list);

  let checkButton = null;

  function lockExercise() {
    radiosByItemId.forEach((radios) => radios.forEach((r) => { r.disabled = true; }));
    correctionFieldsByItemId.forEach((f) => { f.disabled = true; });
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
    return [...responses.values()].every((r) => r.selected !== null);
  }

  function validate() {
    return exercise.items.map((item) => ({
      itemId: item.id,
      isCorrect: (responses.get(item.id).selected === 'true') === item.correct,
    }));
  }

  return Object.freeze({ element, update, destroy, getResponse, isAnswered, validate });
}
