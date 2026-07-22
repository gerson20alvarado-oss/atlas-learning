/**
 * presentation/screens/vocabulary/vocabulary-screen.js
 *
 * My Vocabulary — cuaderno personal de vocabulario, exclusivo de
 * American Language Hub (habilitado a nivel de libro, ver
 * `library-catalog.js#enabledActivities`). Sin intentos, sin
 * calificación, sin relación con el sistema de Assessment ni con
 * Writing — capacidad completamente aislada, con su propia tabla
 * (`vocabulary_entries`) y su propio repositorio.
 *
 * Reutiliza `back-nav.js` sin ningún cambio. Los dos componentes de
 * interacción son nuevos: `inline-action-button.js` (genérico,
 * reutilizable a futuro, no exclusivo de esta pantalla) y
 * `vocabulary-word-row.js` (específico de esta funcionalidad).
 *
 * Duplicados (contrato de producto ya cerrado: "sin duplicados
 * dentro de la misma unidad"): la validación real vive en la base de
 * datos (restricción única) — esta pantalla solo interpreta
 * `reason: 'duplicate'` que ya le llega resuelto del repositorio, y
 * lo muestra como un mensaje inline breve, nunca bloqueante.
 *
 * Eliminar es inmediato, sin diálogo de confirmación (decisión de UX
 * ya cerrada: bajo riesgo, no amerita interrumpir el ritmo) — con un
 * aviso temporal "Removed — Undo" como red de seguridad.
 *
 * Componente puro: recibe `vocabulary` (bookId/unitId/unitNumber/
 * unitTitle, ya resuelto por quien compone), `vocabularyEntryRepository`,
 * `userId`/`accessToken`, `onBack` — no conoce Supabase ni el router.
 */

import { createBackNav } from '../../components/back-nav/back-nav.js';
import { createInlineActionButton } from '../../components/inline-action-button/inline-action-button.js';
import { createVocabularyWordRow } from '../../components/vocabulary-word-row/vocabulary-word-row.js';

const UNDO_WINDOW_MS = 6000;

export function createVocabularyScreen({ vocabulary, vocabularyEntryRepository, userId, accessToken, onBack }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'vocabulary-screen');

  const header = document.createElement('header');
  header.setAttribute('data-part', 'header');

  const backNav = createBackNav({ parentLabel: 'library', onSelect: () => onBack?.() });
  header.appendChild(backNav.element);

  const unitNumberBadge = document.createElement('span');
  unitNumberBadge.setAttribute('data-part', 'unit-number');
  unitNumberBadge.textContent = String(vocabulary.unitNumber);
  header.appendChild(unitNumberBadge);

  const unitTitle = document.createElement('h1');
  unitTitle.setAttribute('data-part', 'unit-title');
  unitTitle.className = 'al-type-title';
  unitTitle.textContent = vocabulary.unitTitle;
  header.appendChild(unitTitle);

  const activityTitle = document.createElement('p');
  activityTitle.setAttribute('data-part', 'activity-title');
  activityTitle.className = 'al-type-ui-label';
  activityTitle.textContent = 'My Vocabulary';
  header.appendChild(activityTitle);

  element.appendChild(header);

  const body = document.createElement('div');
  body.setAttribute('data-part', 'body');

  // --- Fila para agregar: input + inline-action-button ---
  const addRow = document.createElement('div');
  addRow.setAttribute('data-part', 'add-row');

  const addInput = document.createElement('input');
  addInput.type = 'text';
  addInput.setAttribute('data-part', 'add-input');
  addInput.setAttribute('aria-label', 'Add a word or expression');
  addInput.placeholder = 'Add a word or expression…';

  const addButton = createInlineActionButton({ label: 'Add', disabled: true, onClick: () => handleAdd() });

  addRow.appendChild(addInput);
  addRow.appendChild(addButton.element);
  body.appendChild(addRow);

  const statusMessage = document.createElement('p');
  statusMessage.setAttribute('data-part', 'status');
  statusMessage.className = 'al-type-ui-caption';
  statusMessage.hidden = true;
  body.appendChild(statusMessage);

  const list = document.createElement('div');
  list.setAttribute('data-part', 'list');
  body.appendChild(list);

  const emptyState = document.createElement('p');
  emptyState.setAttribute('data-part', 'empty-state');
  emptyState.className = 'al-type-ui-body';
  emptyState.textContent = 'Your vocabulary notebook for this unit is empty.';
  emptyState.hidden = true;
  body.appendChild(emptyState);

  element.appendChild(body);

  let entries = [];
  let rowsByEntryId = new Map();
  let destroyed = false;
  let undoHandle = null;

  addInput.addEventListener('input', () => {
    addButton.update({ disabled: addInput.value.trim() === '' });
    statusMessage.hidden = true;
  });

  addInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (addInput.value.trim() !== '') handleAdd();
    }
  });

  function showStatus(text, tone) {
    statusMessage.textContent = text;
    statusMessage.setAttribute('data-tone', tone);
    statusMessage.hidden = false;
  }

  function highlightExistingTerm(term) {
    const normalized = term.trim().toLowerCase();
    const match = entries.find((entry) => entry.term.trim().toLowerCase() === normalized);
    if (!match) return;
    const row = rowsByEntryId.get(match.id);
    row?.element.setAttribute('data-flash', 'true');
    setTimeout(() => row?.element.removeAttribute('data-flash'), 1200);
  }

  async function handleAdd() {
    const term = addInput.value.trim();
    if (!term) return;

    addButton.update({ disabled: true });
    const result = await vocabularyEntryRepository.addEntry({
      userId,
      bookId: vocabulary.bookId,
      unitNumber: vocabulary.unitNumber,
      term,
      accessToken,
    });

    if (destroyed) return;

    if (result.success) {
      entries.push(result.entry);
      renderList();
      addInput.value = '';
      addInput.focus();
      statusMessage.hidden = true;
    } else if (result.reason === 'duplicate') {
      showStatus('You already added this word in this unit.', 'error');
      highlightExistingTerm(term);
      addButton.update({ disabled: false });
    } else {
      showStatus('Something went wrong. Please try again.', 'error');
      addButton.update({ disabled: false });
    }
  }

  async function handleEdit(entry, nextTerm) {
    const result = await vocabularyEntryRepository.updateEntry({ entryId: entry.id, term: nextTerm, accessToken });
    if (destroyed) return;

    if (result.success) {
      entry.term = result.entry.term;
      rowsByEntryId.get(entry.id)?.update({ term: entry.term });
    } else if (result.reason === 'duplicate') {
      showStatus('You already added this word in this unit.', 'error');
      rowsByEntryId.get(entry.id)?.update({ term: entry.term }); // restaura el texto anterior
    } else {
      showStatus('Something went wrong. Please try again.', 'error');
      rowsByEntryId.get(entry.id)?.update({ term: entry.term });
    }
  }

  async function handleRemove(entry) {
    const success = await vocabularyEntryRepository.removeEntry({ entryId: entry.id, accessToken });
    if (destroyed || !success) return;

    entries = entries.filter((e) => e.id !== entry.id);
    renderList();

    clearTimeout(undoHandle);
    showStatus(`Removed "${entry.term}".`, 'neutral');
    const undoLink = document.createElement('button');
    undoLink.type = 'button';
    undoLink.setAttribute('data-part', 'undo');
    undoLink.textContent = 'Undo';
    undoLink.addEventListener('click', async () => {
      clearTimeout(undoHandle);
      statusMessage.hidden = true;
      const result = await vocabularyEntryRepository.addEntry({
        userId,
        bookId: vocabulary.bookId,
        unitNumber: vocabulary.unitNumber,
        term: entry.term,
        accessToken,
      });
      if (destroyed || !result.success) return;
      entries.push(result.entry);
      renderList();
    });
    statusMessage.appendChild(document.createTextNode(' '));
    statusMessage.appendChild(undoLink);

    undoHandle = setTimeout(() => {
      if (!destroyed) statusMessage.hidden = true;
    }, UNDO_WINDOW_MS);
  }

  function renderList() {
    rowsByEntryId.forEach((row) => row.destroy());
    rowsByEntryId = new Map();
    list.replaceChildren();

    emptyState.hidden = entries.length > 0;

    entries.forEach((entry) => {
      const row = createVocabularyWordRow({
        term: entry.term,
        onEdit: (nextTerm) => handleEdit(entry, nextTerm),
        onRemove: () => handleRemove(entry),
      });
      rowsByEntryId.set(entry.id, row);
      list.appendChild(row.element);
    });
  }

  async function loadEntries() {
    entries = await vocabularyEntryRepository.listEntries({
      userId,
      bookId: vocabulary.bookId,
      unitNumber: vocabulary.unitNumber,
      accessToken,
    });
    if (destroyed) return;
    renderList();
  }

  loadEntries();

  function update() {}

  function destroy() {
    destroyed = true;
    clearTimeout(undoHandle);
    backNav.destroy();
    addButton.destroy();
    rowsByEntryId.forEach((row) => row.destroy());
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
