/**
 * presentation/components/content-blocks/practice-block.js
 *
 * Punto de entrada de "practice" en el dispatcher de content-block-
 * renderer.js. Implementa la anatomía compartida de todo ejercicio
 * (Design System §17.1): 1) Question — el `prompt` del bloque, voz de
 * lectura; 2) Answer area — delegada al componente del tipo de
 * Exercise; 3) Feedback — pintado por ese mismo componente, adyacente
 * al área de respuesta; 4) Continue — es el botón compartido de la
 * Session, no vive aquí.
 *
 * `block.hidePrompt` (opcional, Nuevo Reader — Study Workspace):
 * omite la Question cuando el enunciado ya es visible en otro lugar
 * — la página real del libro, en el caso del Espacio de Estudio.
 * Nunca se activa por defecto (`undefined`/`false` en cualquier
 * lugar que no lo pida explícitamente), así que la Vista de Lectura
 * heredada y el resto del Exercise Engine quedan exactamente
 * iguales. La lógica de verificación (Answer area + Feedback) no
 * cambia en absoluto — sigue siendo el mismo `onCheck`/Attempt real.
 *
 * Si `block.exercise` no se resolvió (actividades abiertas,
 * dependientes de audio real, o tipos aún no soportados como
 * matching — ver domain/content/exercise-catalog.js) o el tipo no
 * tiene componente todavía, se muestra el mismo aviso neutral que
 * "practice"/"media" ya usaban desde Sprint 3 — ningún caso especial
 * nuevo, ninguna interactividad fingida.
 *
 * Este archivo es Presentation puro: recibe `block.exercise` y
 * `block.priorAttempt` ya resueltos, y `block.onCheck` ya inyectado
 * (todo compuesto por app/screen-router.js) — nunca conoce Session,
 * Router ni Persistence (Sprint 5 Plan, regla explícita sobre el
 * Exercise Engine, aplicada aquí también por consistencia: ni
 * siquiera este dispatcher de UI llama a un evaluador o a un
 * repositorio directamente).
 */

import { createTypingBlock } from './typing-block.js';
import { createFillBlankBlock } from './fill-blank-block.js';
import { createMultipleChoiceBlock } from './multiple-choice-block.js';

const ANSWER_AREA_FACTORY_BY_TYPE = Object.freeze({
  typing: createTypingBlock,
  fillBlank: createFillBlankBlock,
  multipleChoice: createMultipleChoiceBlock,
});

function createNeutralAnswerArea() {
  const element = document.createElement('p');
  element.setAttribute('data-component', 'practice-block');
  element.setAttribute('data-part', 'unsupported');
  element.className = 'al-type-ui-caption';
  element.textContent = 'Este tipo de contenido todavía no está disponible.';

  return Object.freeze({
    element,
    update: () => {},
    destroy: () => element.remove(),
    getPendingResponse: () => null,
    isAnswered: () => true, // nunca bloquea el Continue compartido de la Section
    checkNow: () => {},
  });
}

export function createPracticeBlock(block) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'practice-block');

  if (!block.hidePrompt) {
    const question = document.createElement('p');
    question.setAttribute('data-part', 'question');
    question.className = 'al-type-reading-body';
    question.textContent = block.prompt ?? '';
    element.appendChild(question);
  }

  const factory = block.exercise ? ANSWER_AREA_FACTORY_BY_TYPE[block.exercise.type] : null;
  const answerArea = factory
    ? factory({ exercise: block.exercise, priorAttempt: block.priorAttempt, onCheck: block.onCheck })
    : createNeutralAnswerArea();

  element.appendChild(answerArea.element);

  function update(nextProps) {
    answerArea.update(nextProps);
  }

  function destroy() {
    answerArea.destroy();
    element.remove();
  }

  return Object.freeze({
    element,
    update,
    destroy,
    getPendingResponse: answerArea.getPendingResponse,
    isAnswered: answerArea.isAnswered,
    checkNow: answerArea.checkNow,
  });
}
