/**
 * presentation/screens/admin/admin-reader-progress-screen.js
 *
 * Sprint 14 — "Ver progreso / Reiniciar progreso" del MVP. A
 * diferencia de Licenses/Worksheet Attempts, ReaderPosition no tiene
 * una vista con el nombre del dueño ya embebido — de ahí que esta
 * pantalla elija primero al estudiante (admin-student-picker.js,
 * compartido con Bookmarks) y luego liste sus posiciones.
 */

import { createAdminStudentPicker } from '../../components/admin-student-picker/admin-student-picker.js';

export function createAdminReaderProgressScreen({ accessToken, profileRepository, readerPositionRepository }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'admin-reader-progress-screen');

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = 'Reader Progress';
  element.appendChild(heading);

  const resultsSection = document.createElement('div');
  resultsSection.setAttribute('data-part', 'results-section');

  async function loadPositionsFor(student) {
    resultsSection.replaceChildren();

    const nameHeading = document.createElement('h2');
    nameHeading.className = 'al-type-ui-body';
    nameHeading.textContent = `${student.first_name} ${student.last_name}`;
    resultsSection.appendChild(nameHeading);

    const positions = await readerPositionRepository.listForUser({ userId: student.user_id, accessToken });
    if (positions.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No reading progress yet.';
      resultsSection.appendChild(empty);
      return;
    }

    positions.forEach((position) => {
      const row = document.createElement('div');
      row.setAttribute('data-part', 'position-row');

      const label = document.createElement('span');
      label.textContent = `${position.bookId} — page ${position.pageNumber}`;
      row.appendChild(label);

      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.textContent = 'Reset progress';
      resetButton.addEventListener('click', async () => {
        resetButton.disabled = true;
        await readerPositionRepository.resetPosition({
          userId: student.user_id,
          bookId: position.bookId,
          accessToken,
        });
        await loadPositionsFor(student);
      });
      row.appendChild(resetButton);

      resultsSection.appendChild(row);
    });
  }

  const picker = createAdminStudentPicker({
    onSearch: (query) => profileRepository.searchProfiles({ query, accessToken }),
    onSelect: (student) => loadPositionsFor(student),
  });

  element.appendChild(picker.element);
  element.appendChild(resultsSection);

  function destroy() {
    picker.destroy();
    element.remove();
  }

  return Object.freeze({ element, update: () => {}, destroy });
}
