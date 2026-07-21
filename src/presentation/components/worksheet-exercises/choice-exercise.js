/**
 * presentation/components/worksheet-exercises/choice-exercise.js
 *
 * Choice — "underline the correct word in italics": cada item
 * muestra una oración partida en `before`/`after` alrededor del
 * hueco, con sus palabras candidatas como botones seleccionables
 * (nunca un <select>, porque son solo 2-3 palabras cortas — el
 * mismo criterio visual que el propio worksheet impreso, donde las
 * dos opciones están una junto a la otra separadas por "/").
 *
 * Sin límite de intentos propio (mismo criterio que el resto de
 * ALH): el único control real es `unit_attempt_limits`.
 *
 * `reviewPolicy` (esta sesión): 'practice' (default) mantiene el
 * comportamiento de siempre — Check Answers propio, marca
 * correcto/incorrecto por ítem al toque, recalificación libre.
 * 'exam' quita el botón propio por completo y nunca pinta
 * `data-result` (ni al restaurar un intento anterior) — el
 * componente solo captura respuestas; `validate()` sigue existiendo
 * tal cual, para que quien orqueste la pantalla (assessment-screen.js)
 * la invoque una sola vez, al enviar toda la evaluación.
 */

import { getExerciseAvailability } from '../../../domain/exercise-availability/exercise-availability-service.js';
import { createPrimaryButton } from '../primary-button/primary-button.js';

export function createChoiceExercise(
  exercise,
  { initialState, unitCompleted = false, reviewPolicy = 'practice', onGraded, onChange } = {},
) {
  const isExam = reviewPolicy === 'exam';

  const element = document.createElement('div');
  element.setAttribute('data-component', 'choice-exercise');

  const instruction = document.createElement('p');
  instruction.setAttribute('data-part', 'instruction');
  instruction.className = 'al-type-ui-label';
  instruction.textContent = exercise.instruction;
  element.appendChild(instruction);

  const list = document.createElement('div');
  list.setAttribute('data-part', 'items');

  const responses = new Map(); // itemId -> option text | null
  const rowsByItemId = new Map();
  const buttonsByItemId = new Map();

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

    const sentence = document.createElement('p');
    sentence.setAttribute('data-part', 'sentence');

    const before = document.createTextNode(item.before);
    sentence.appendChild(before);

    const choiceGroup = document.createElement('span');
    choiceGroup.setAttribute('data-part', 'choice-group');

    const buttons = [];
    buttonsByItemId.set(item.id, buttons);

    item.options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('data-part', 'choice-option');
      button.textContent = option;
      if (restored === option) button.setAttribute('data-selected', 'true');
      buttons.push(button);

      button.addEventListener('click', () => {
        if (button.disabled) return;
        responses.set(item.id, option);
        buttons.forEach((b) => b.removeAttribute('data-selected'));
        button.setAttribute('data-selected', 'true');
        row.removeAttribute('data-result');
        onChange?.();
      });

      choiceGroup.appendChild(button);
    });

    sentence.appendChild(choiceGroup);
    sentence.appendChild(document.createTextNode(item.after));

    row.appendChild(sentence);
    list.appendChild(row);
  });

  element.appendChild(list);

  let checkButton = null;

  function lockExercise() {
    buttonsByItemId.forEach((buttons) => buttons.forEach((b) => { b.disabled = true; }));
    if (checkButton) checkButton.disabled = true;
  }

  function applyResult(result) {
    result.forEach(({ itemId, isCorrect }) => {
      rowsByItemId.get(itemId).setAttribute('data-result', isCorrect ? 'correct' : 'incorrect');
    });
  }

  // 'exam': nunca se pinta data-result — ni al restaurar un intento
  // anterior, ni habrá ocasión de calificar en vivo (sin botón
  // propio). 'practice': comportamiento de siempre.
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
      isCorrect: responses.get(item.id) === item.correct,
    }));
  }

  return Object.freeze({ element, update, destroy, getResponse, isAnswered, validate });
}
