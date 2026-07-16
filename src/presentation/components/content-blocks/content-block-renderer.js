/**
 * presentation/components/content-blocks/content-block-renderer.js
 *
 * Despacha cada Content Block a su primitivo de presentación (Design
 * System §19.1: ocho primitivos, contenedores visuales agnósticos de
 * materia — nunca "el estilo de Grammar" o "el estilo de
 * Vocabulary"). Sprint 3 implementa seis: prose, term, dialogue,
 * aside, example, table.
 *
 * "media" (sin assets reales todavía) y "practice" (Exercise Engine,
 * Roadmap Phase 5) son primitivos válidos en el contrato de datos
 * (entity-shapes.js ya los reconoce, C5) pero no tienen renderer
 * todavía. En vez de fallar, se muestra un aviso neutral y en calma
 * — "silencio es una decisión de diseño válida" aplicado a un tipo
 * de contenido que este sprint no cubre, no un error del sistema.
 * Este componente es completamente puro — no reporta al error
 * boundary ni al event bus; eso pertenece a app/, no a Presentation.
 */

import { createProseBlock } from './prose-block.js';
import { createTermBlock } from './term-block.js';
import { createDialogueBlock } from './dialogue-block.js';
import { createAsideBlock } from './aside-block.js';
import { createExampleBlock } from './example-block.js';
import { createTableBlock } from './table-block.js';

const RENDERERS_BY_TYPE = Object.freeze({
  prose: createProseBlock,
  term: createTermBlock,
  dialogue: createDialogueBlock,
  aside: createAsideBlock,
  example: createExampleBlock,
  table: createTableBlock,
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
