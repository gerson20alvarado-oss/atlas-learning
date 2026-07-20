/**
 * presentation/components/worksheet-exercises/ordering-exercise.js
 *
 * Ordenamiento — cada ítem se muestra en su orden impreso original,
 * con un selector de posición (1..N). Deliberadamente sin
 * arrastrar-y-soltar: Atlas no tiene hoy ninguna librería de drag
 * and drop, e introducir una solo para este componente habría sido
 * una dependencia nueva no pedida.
 *
 * Calificación automática: `validate()` compara la posición elegida
 * de cada ítem contra `exercise.correctOrder`, y marca cada fila
 * como correcta/incorrecta — nunca revela cuál era la posición
 * correcta. Máximo `MAX_GRADING_ATTEMPTS` intentos.
 *
 * Persistencia (esta sesión): este componente NUNCA habla con
 * Supabase ni con ningún repositorio (regla de vecinos, igual que
 * `audio-panel.js` nunca guarda posición de audio). Recibe
 * `initialState` ya resuelto (respuesta, resultado y intentos
 * previos, o `null` si nunca se intentó) y restaura la UI a partir
 * de eso; al calificar, invoca `onGraded(...)` — es
 * `worksheet-screen.js` quien decide guardar, vía
 * `worksheetAttemptRepository`.
 */

import { MAX_GRADING_ATTEMPTS } from '../../../domain/contracts/worksheet-exercise-lifecycle.js';

export function createOrderingExercise(exercise, { initialState, onGraded } = {}) {
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

  // Si hay una respuesta previa, precomputamos su posición por ítem
  // para restaurar cada <select> al construirlo.
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
    });

    const text = document.createElement('span');
    text.setAttribute('data-part', 'text');
    text.textContent = item.text;

    row.appendChild(select);
    row.appendChild(text);
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
    selectsByItemId.forEach((select) => { select.disabled = true; });
    checkButton.disabled = true;
  }

  function applyResult(result) {
    result.forEach(({ itemId, isCorrect }) => {
      rowsByItemId.get(itemId).setAttribute('data-result', isCorrect ? 'correct' : 'incorrect');
    });
  }

  // Restaurar resultado previo, si lo hay — incluido el bloqueo si ya
  // se agotaron los intentos en una visita anterior.
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
