/**
 * presentation/components/worksheet-exercises/true-false-exercise.js
 *
 * Verdadero/Falso con corrección — el campo de texto para corregir
 * el enunciado solo aparece cuando el estudiante marca Falso.
 *
 * Calificación automática: `validate()` compara la elección V/F
 * contra `item.correct` — nunca revela la respuesta esperada. Máximo
 * `MAX_GRADING_ATTEMPTS` intentos.
 *
 * Alcance real: el texto de corrección libre NO se califica
 * automáticamente (comparar texto libre de forma confiable no es un
 * problema resuelto con una comparación simple) — sí se restaura al
 * volver, como cualquier otro dato guardado, aunque no participe en
 * la calificación.
 *
 * Persistencia (esta sesión): igual que ordering-exercise.js, nunca
 * habla con Supabase — recibe `initialState`, invoca `onGraded(...)`.
 */

import { MAX_GRADING_ATTEMPTS } from '../../../domain/contracts/worksheet-exercise-lifecycle.js';

export function createTrueFalseExercise(exercise, { initialState, onGraded } = {}) {
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
      });

      label.appendChild(radio);
      label.appendChild(document.createTextNode(value === 'true' ? 'True' : 'False'));
      choiceGroup.appendChild(label);
    });

    correctionField.addEventListener('input', () => {
      responses.get(item.id).correction = correctionField.value;
    });

    row.appendChild(choiceGroup);
    row.appendChild(correctionField);
    list.appendChild(row);
  });

  element.appendChild(list);

  // --- Calificación ---
  let attemptsUsed = initialState?.attemptsUsed ?? 0;

  const gradingRow = document.createElement('div');
  gradingRow.setAttribute('data-part', 'grading-row');

  const checkButton = document.createElement('button');
  checkButton.type = 'button';
  checkButton.setAttribute('data-part', 'check-button');
  checkButton.textContent = 'Check answers';

  const attemptsLabel = document.createElement('span');
  attemptsLabel.setAttribute('data-part', 'attempts-label');

  function updateAttemptsLabel() {
    const remaining = MAX_GRADING_ATTEMPTS - attemptsUsed;
    attemptsLabel.textContent = remaining > 0 ? `${remaining} attempt${remaining === 1 ? '' : 's'} left` : 'No attempts left';
  }
  updateAttemptsLabel();

  gradingRow.appendChild(checkButton);
  gradingRow.appendChild(attemptsLabel);
  element.appendChild(gradingRow);

  function lockExercise() {
    radiosByItemId.forEach((radios) => radios.forEach((r) => { r.disabled = true; }));
    correctionFieldsByItemId.forEach((f) => { f.disabled = true; });
    checkButton.disabled = true;
  }

  function applyResult(result) {
    result.forEach(({ itemId, isCorrect }) => {
      rowsByItemId.get(itemId).setAttribute('data-result', isCorrect ? 'correct' : 'incorrect');
    });
  }

  if (initialState?.result) {
    applyResult(initialState.result);
    if (attemptsUsed >= MAX_GRADING_ATTEMPTS) lockExercise();
  }

  checkButton.addEventListener('click', () => {
    if (!isAnswered() || attemptsUsed >= MAX_GRADING_ATTEMPTS) return;
    attemptsUsed += 1;

    const result = validate();
    applyResult(result);
    updateAttemptsLabel();
    if (attemptsUsed >= MAX_GRADING_ATTEMPTS) lockExercise();

    onGraded?.({ response: getResponse(), result, attemptsUsed });
  });

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
