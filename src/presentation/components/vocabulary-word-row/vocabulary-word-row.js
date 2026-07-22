/**
 * presentation/components/vocabulary-word-row/vocabulary-word-row.js
 *
 * Fila de una palabra dentro de "My Vocabulary" — específica de esta
 * funcionalidad (a diferencia de inline-action-button.js). Cada
 * entrada es una línea de texto suelta, nunca una fila de tabla:
 * sin bordes divisorios, con aire generoso (ver
 * vocabulary-word-row.css) — se lee como una lista escrita a mano,
 * no como datos administrativos.
 *
 * Dos estados, resueltos con estado local propio, mismo patrón que
 * ya usan matching-exercise.js/choice-exercise.js para su propia
 * interacción:
 *   - "mostrando": el texto en voz de lectura + el control "Remove",
 *     invisible hasta que se interactúa (hover/foco) — en reposo, la
 *     pantalla muestra solo palabras, nunca iconografía de gestión.
 *   - "editando": el mismo texto se convierte en un campo editable en
 *     su lugar exacto — Enter confirma, Escape cancela y restaura el
 *     texto anterior. Sin pantalla ni modal de edición separada
 *     (decisión de UX ya cerrada: "editar = solo el texto").
 *
 * Componente puro: recibe { term, onEdit, onRemove } — no conoce
 * Supabase ni el repositorio; quien compone (vocabulary-screen.js)
 * decide qué hacer con cada resultado.
 */

export function createVocabularyWordRow({ term, onEdit, onRemove }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'vocabulary-word-row');

  const display = document.createElement('div');
  display.setAttribute('data-part', 'display');

  const termText = document.createElement('button');
  termText.type = 'button';
  termText.setAttribute('data-part', 'term');
  termText.textContent = term;
  termText.setAttribute('aria-label', `Edit "${term}"`);

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.setAttribute('data-part', 'remove');
  removeButton.textContent = 'Remove';
  removeButton.setAttribute('aria-label', `Remove "${term}"`);

  display.appendChild(termText);
  display.appendChild(removeButton);

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.setAttribute('data-part', 'edit-input');
  editInput.hidden = true;

  element.appendChild(display);
  element.appendChild(editInput);

  let currentTerm = term;

  function enterEditMode() {
    editInput.value = currentTerm;
    display.hidden = true;
    editInput.hidden = false;
    editInput.focus();
    editInput.select();
  }

  function exitEditMode() {
    display.hidden = false;
    editInput.hidden = true;
  }

  termText.addEventListener('click', enterEditMode);

  editInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const nextTerm = editInput.value.trim();
      if (nextTerm && nextTerm !== currentTerm) {
        onEdit?.(nextTerm);
      } else {
        exitEditMode();
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      exitEditMode();
    }
  });

  editInput.addEventListener('blur', () => {
    if (!editInput.hidden) exitEditMode();
  });

  removeButton.addEventListener('click', () => onRemove?.());

  function update(nextProps = {}) {
    if (nextProps.term) {
      currentTerm = nextProps.term;
      termText.textContent = currentTerm;
      termText.setAttribute('aria-label', `Edit "${currentTerm}"`);
      removeButton.setAttribute('aria-label', `Remove "${currentTerm}"`);
      exitEditMode();
    }
  }

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
