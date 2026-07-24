/**
 * presentation/screens/admin/admin-unit-availability-screen.js
 *
 * Disponibilidad de Unidades (dominio Acceso) — sigue el diseño UX
 * ya aprobado: selector de libro, lista de unidades con un
 * interruptor por fila, un único "Save Changes" (nunca autoguardado
 * — el costo de un error aquí es real, a diferencia de Vocabulary).
 *
 * Recibe `eligibleBooks` y `listUnitsForBook` ya resueltos por quien
 * compone (screen-router.js) — este archivo nunca importa nada del
 * dominio Contenido directamente, ni sabe cómo se enumeran las
 * unidades de un libro; solo pinta lo que se le entrega.
 *
 * Los cambios se acumulan localmente (el interruptor responde de
 * inmediato) pero no se escriben hasta que el administrador confirma
 * "Save Changes" — un error de guardado nunca descarta lo que el
 * administrador ya había cambiado en pantalla.
 */

export function createAdminUnitAvailabilityScreen({
  accessToken,
  unitAvailabilityRepository,
  eligibleBooks,
  listUnitsForBook,
}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'admin-unit-availability-screen');

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = 'Content Availability';
  element.appendChild(heading);

  const bookSelect = document.createElement('select');
  bookSelect.setAttribute('data-part', 'book-select');
  eligibleBooks.forEach((book) => {
    const option = document.createElement('option');
    option.value = book.id;
    option.textContent = book.title;
    bookSelect.appendChild(option);
  });
  element.appendChild(bookSelect);

  const statusMessage = document.createElement('p');
  statusMessage.setAttribute('data-part', 'status');
  statusMessage.setAttribute('role', 'status');
  statusMessage.setAttribute('aria-live', 'polite');
  statusMessage.className = 'al-type-ui-caption';
  statusMessage.hidden = true;
  element.appendChild(statusMessage);

  const list = document.createElement('div');
  list.setAttribute('data-part', 'unit-list');
  element.appendChild(list);

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.setAttribute('data-part', 'save-changes');
  saveButton.textContent = 'Save Changes';
  saveButton.disabled = true;
  element.appendChild(saveButton);

  let currentBookId = eligibleBooks[0]?.id ?? null;
  let savedDisabledSet = new Set(); // lo que sí está guardado en el servidor
  let pendingDisabledSet = new Set(); // lo que el administrador ha cambiado en pantalla, sin guardar todavía
  let switchesByUnit = new Map();

  function setsAreEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const value of a) if (!b.has(value)) return false;
    return true;
  }

  function refreshSaveButtonState() {
    saveButton.disabled = setsAreEqual(pendingDisabledSet, savedDisabledSet);
  }

  function renderUnits() {
    switchesByUnit = new Map();
    list.replaceChildren();

    const units = listUnitsForBook(currentBookId);

    if (units.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'al-type-ui-body';
      empty.textContent = 'This book has no units yet.';
      list.appendChild(empty);
      return;
    }

    units.forEach((unit) => {
      const row = document.createElement('div');
      row.setAttribute('data-part', 'unit-row');

      const label = document.createElement('span');
      label.setAttribute('data-part', 'unit-label');
      label.textContent = `Unit ${unit.unitNumber} — ${unit.unitTitle}`;

      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.setAttribute('data-part', 'unit-toggle');
      toggle.checked = !pendingDisabledSet.has(unit.unitNumber);
      toggle.setAttribute('aria-label', `Unit ${unit.unitNumber} enabled`);

      const stateLabel = document.createElement('span');
      stateLabel.setAttribute('data-part', 'unit-state-label');
      stateLabel.textContent = toggle.checked ? 'Enabled' : 'Disabled';

      toggle.addEventListener('change', () => {
        if (toggle.checked) {
          pendingDisabledSet.delete(unit.unitNumber);
        } else {
          pendingDisabledSet.add(unit.unitNumber);
        }
        stateLabel.textContent = toggle.checked ? 'Enabled' : 'Disabled';
        row.setAttribute('data-enabled', String(toggle.checked));
        refreshSaveButtonState();
      });

      row.setAttribute('data-enabled', String(toggle.checked));
      row.appendChild(toggle);
      row.appendChild(label);
      row.appendChild(stateLabel);
      list.appendChild(row);
      switchesByUnit.set(unit.unitNumber, toggle);
    });
  }

  async function loadBook(bookId) {
    currentBookId = bookId;
    statusMessage.hidden = true;
    const byBook = await unitAvailabilityRepository.getDisabledUnitsByBook({ accessToken });
    savedDisabledSet = new Set(byBook[bookId] ?? []);
    pendingDisabledSet = new Set(savedDisabledSet);
    renderUnits();
    refreshSaveButtonState();
  }

  bookSelect.addEventListener('change', () => loadBook(bookSelect.value));

  saveButton.addEventListener('click', async () => {
    saveButton.disabled = true;
    statusMessage.hidden = true;

    const previousSaved = new Set(savedDisabledSet);
    const nextDisabled = [...pendingDisabledSet];

    const result = await unitAvailabilityRepository.saveDisabledUnitsForBook({
      bookId: currentBookId,
      unitNumbers: nextDisabled,
      accessToken,
    });

    if (result.success) {
      savedDisabledSet = new Set(pendingDisabledSet);
      const enabledChanges = [...previousSaved].filter((n) => !pendingDisabledSet.has(n));
      const disabledChanges = [...pendingDisabledSet].filter((n) => !previousSaved.has(n));
      const parts = [];
      if (disabledChanges.length > 0) parts.push(`Unit ${disabledChanges.join(', ')} disabled`);
      if (enabledChanges.length > 0) parts.push(`Unit ${enabledChanges.join(', ')} enabled`);
      statusMessage.textContent = parts.length > 0 ? parts.join(' · ') : 'No changes.';
      statusMessage.setAttribute('data-tone', 'success');
    } else {
      // El fallo no descarta pendingDisabledSet — el administrador
      // conserva exactamente lo que ya había cambiado en pantalla.
      statusMessage.textContent = result.error;
      statusMessage.setAttribute('data-tone', 'error');
    }
    statusMessage.hidden = false;
    refreshSaveButtonState();
  });

  if (currentBookId) loadBook(currentBookId);

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
