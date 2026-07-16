/**
 * presentation/components/content-blocks/content-block-renderer.js
 *
 * Despacha cada Content Block a su primitivo de presentación (Design
 * System §19.1: ocho primitivos, contenedores visuales agnósticos de
 * materia). Sprint 3: prose, term, dialogue, aside, example, table.
 * Sprint 4 añadió media (variante image). Sprint 5 (Exercise Engine)
 * añade "practice" (practice-block.js) — el primitivo ya existía en
 * el contrato de datos desde Sprint 3 (C5) y en el contenido real
 * desde Sprint 4, pero sin motor que le diera vida; ahora despacha
 * internamente por `exercise.type` (multipleChoice/fillBlank/typing,
 * Design System §17.3–17.5) o cae al mismo aviso neutral de siempre
 * si el bloque no tiene un Exercise resuelto (actividades abiertas,
 * dependientes de audio real, o tipos aún no soportados — ver
 * domain/content/exercise-catalog.js).
 *
 * Este componente es completamente puro — no reporta al error
 * boundary ni al event bus; eso pertenece a app/, no a Presentation.
 */

import { createProseBlock } from './prose-block.js';
import { createTermBlock } from './term-block.js';
import { createDialogueBlock } from './dialogue-block.js';
import { createAsideBlock } from './aside-block.js';
import { createExampleBlock } from './example-block.js';
import { createTableBlock } from './table-block.js';
import { createMediaBlock } from './media-block.js';
import { createPracticeBlock } from './practice-block.js';

const RENDERERS_BY_TYPE = Object.freeze({
  prose: createProseBlock,
  term: createTermBlock,
  dialogue: createDialogueBlock,
  aside: createAsideBlock,
  example: createExampleBlock,
  table: createTableBlock,
  media: createMediaBlock,
  practice: createPracticeBlock,
});

function createUnsupportedBlock() {
  const element = document.createElement('p');
  element.setAttribute('data-component', 'unsupported-block');
  element.className = 'al-type-ui-caption';
  element.textContent = 'Este tipo de contenido todavía no está disponible.';

  return Object.freeze({
    element,
    update: () => {},
    destroy: () => element.remove(),
  });
}

export function createContentBlock(block) {
  const factory = RENDERERS_BY_TYPE[block.type];
  return factory ? factory(block) : createUnsupportedBlock();
}
