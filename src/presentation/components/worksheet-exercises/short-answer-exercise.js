/**
 * presentation/components/worksheet-exercises/short-answer-exercise.js
 *
 * Short answer — un campo de texto libre por item, calificado
 * comparando una versión normalizada de la respuesta (minúsculas,
 * espacios colapsados, sin puntuación final) contra una lista de
 * `acceptableAnswers` — nunca coincidencia exacta de mayúsculas o
 * puntuación, porque eso penalizaría al estudiante por algo que no
 * es el punto gramatical del ejercicio.
 *
 * Un mismo componente cubre tres necesidades reales de Progress Test
 * Unit 1: reconstruir una oración a partir de palabras desordenadas
 * (Grammar B), corregir el error de una oración (Grammar D), y
 * completar una palabra derivada (Vocabulary A) — las tres son, en
 * el fondo, "escribe la respuesta correcta y compárala tal cual".
 *
 * Sin límite de intentos propio (mismo criterio que el resto de
 * ALH): el único control real es `unit_attempt_limits`.
 */

import { getExerciseAvailability } from '../../../domain/exercise-availability/exercise-availability-service.js';

function normalize(text) {
  return (text ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.?!]+$/, '');
}

export function createShortAnswerExercise(exercise, { initialState, unitCompleted = false, onGraded } = {}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'short-answer-exercise');

  const instruction = document.createElement('p');
  instruction.setAttribute('data-part', 'instruction');
  instruction.className = 'al-type-ui-label';
  instruction.textContent = exercise.instruction;
  element.appendChild(instruction);

  const list = document.createElement('div');
  list.setAttribute('data-part', 'items');

  const responses = new Map(); // itemId -> string
  const rowsByItemId = new Map();
  const inputsByItemId = new Map();

  const previousResponses = initialState?.response ?? {};

  exercise.items.forEach((item) => {
    const restored = previousResponses[item.id] ?? '';
    responses.set(item.id, restored);

    const row = document.createElement('div');
    row.setAttribute('data-part', 'item');
    rowsByItemId.set(item.id, row);

    const prompt = document.createElement('p');
    prompt.setAttribute('data-part', 'prompt');
    prompt.textContent = item.prompt;
    row.appendChild(prompt);

    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('data-part', 'answer-input');
    input.setAttribute('aria-label', item.prompt);
    input.value = restored;
    inputsByItemId.set(item.id, input);

    input.addEventListener('input', () => {
      responses.set(item.id, input.value);
      row.removeAttribute('data-result');
    });

    row.appendChild(input);
    list.appendChild(row);
  });

  element.appendChild(list);

  const checkButton = document.createElement('button');
  checkButton.type = 'button';
  checkButton.setAttribute('data-part', 'check-button');
  checkButton.textContent = 'Check answers';
  element.appendChild(checkButton);

  function lockExercise() {
    inputsByItemId.forEach((input) => { input.disabled = true; });
    checkButton.disabled = true;
  }

  function applyResult(result) {
    result.forEach(({ itemId, isCorrect }) => {
      rowsByItemId.get(itemId).setAttribute('data-result', isCorrect ? 'correct' : 'incorrect');
    });
  }

  if (initialState?.result) applyResult(initialState.result);
  if (!getExerciseAvailability({ unitCompleted }).editable) lockExercise();

  checkButton.addEventListener('click', () => {
    if (!isAnswered() || !getExerciseAvailability({ unitCompleted }).editable) return;

    const result = validate();
    applyResult(result);

    onGraded?.({ response: getResponse(), result });
  });

  function update() {}

  function destroy() {
    element.remove();
  }

  function getResponse() {
    return Object.fromEntries(responses);
  }

  function isAnswered() {
    return [...responses.values()].every((v) => v.trim() !== '');
  }

  function validate() {
    return exercise.items.map((item) => {
      const given = normalize(responses.get(item.id));
      const isCorrect = item.acceptableAnswers.some((answer) => normalize(answer) === given);
      return { itemId: item.id, isCorrect };
    });
  }

  return Object.freeze({ element, update, destroy, getResponse, isAnswered, validate });
}
