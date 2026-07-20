/**
 * presentation/components/worksheet-exercises/worksheet-exercise-renderer.js
 *
 * Único punto que decide qué componente construir según
 * `exercise.type` — mismo patrón que `content-block-renderer.js` ya
 * demuestra en Hi! Korean, aplicado aquí de forma independiente.
 *
 * Tipos construidos en esta etapa (con evidencia real en la Unidad
 * 1): discussion, ruleReveal, ordering, trueFalse.
 *
 * Progress Test Unit 1 (esta sesión) añade tres tipos más, cada uno
 * con evidencia real en ese contenido: matching (asociar enunciado
 * ↔ opción de una lista compartida), choice (elegir entre 2-3
 * palabras dadas dentro de una oración) y shortAnswer (respuesta de
 * texto libre, normalizada al calificar — cubre reordenar palabras,
 * corregir un error, y completar una palabra derivada).
 *
 * Tipos con evidencia real en unidades posteriores (4, 6, 7, 8, 9,
 * 10, 11, 12), diseñados en la arquitectura aprobada pero NO
 * implementados todavía — se agregan aquí, cada uno como una entrada
 * nueva, cuando la unidad correspondiente los necesite de verdad:
 * multipleChoice, fillInBlank, checkbox.
 */

import { createDiscussionPrompt } from './discussion-prompt.js';
import { createRuleRevealCard } from './rule-reveal-card.js';
import { createOrderingExercise } from './ordering-exercise.js';
import { createTrueFalseExercise } from './true-false-exercise.js';
import { createMatchingExercise } from './matching-exercise.js';
import { createChoiceExercise } from './choice-exercise.js';
import { createShortAnswerExercise } from './short-answer-exercise.js';

const EXERCISE_FACTORY_BY_TYPE = Object.freeze({
  discussion: createDiscussionPrompt,
  ruleReveal: createRuleRevealCard,
  ordering: createOrderingExercise,
  trueFalse: createTrueFalseExercise,
  matching: createMatchingExercise,
  choice: createChoiceExercise,
  shortAnswer: createShortAnswerExercise,
});

function createUnsupportedExercise(exercise) {
  const element = document.createElement('p');
  element.setAttribute('data-component', 'worksheet-exercise');
  element.setAttribute('data-part', 'unsupported');
  element.className = 'al-type-ui-caption';
  element.textContent = `Este tipo de ejercicio ("${exercise.type}") todavía no está disponible.`;

  return Object.freeze({
    element,
    update: () => {},
    destroy: () => element.remove(),
    getResponse: () => null,
    isAnswered: () => true,
  });
}

export function createWorksheetExercise(exercise, context = {}) {
  const factory = EXERCISE_FACTORY_BY_TYPE[exercise.type];
  return factory ? factory(exercise, context) : createUnsupportedExercise(exercise);
}
