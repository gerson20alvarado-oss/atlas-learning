/**
 * presentation/screens/admin/admin-bookmarks-screen.js
 *
 * Sprint 14 — "Ver marcadores / Eliminar marcadores" del MVP. Mismo
 * patrón exacto que admin-reader-progress-screen.js (comparten
 * admin-student-picker.js): buscar estudiante, listar, actuar.
 */

import { createAdminStudentPicker } from '../../components/admin-student-picker/admin-student-picker.js';

export function createAdminBookmarksScreen({ accessToken, profileRepository, bookmarkRepository }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'admin-bookmarks-screen');

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = 'Bookmarks';
  element.appendChild(heading);

  const resultsSection = document.createElement('div');
  resultsSection.setAttribute('data-part', 'results-section');

  async function loadBookmarksFor(student) {
    resultsSection.replaceChildren();

    const nameHeading = document.createElement('h2');
    nameHeading.className = 'al-type-ui-body';
    nameHeading.textContent = `${student.first_name} ${student.last_name}`;
    resultsSection.appendChild(nameHeading);

    const bookmarks = await bookmarkRepository.listAllForUser({ userId: student.user_id, accessToken });
    if (bookmarks.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No bookmarks yet.';
      resultsSection.appendChild(empty);
      return;
    }

    bookmarks.forEach((bookmark) => {
      const row = document.createElement('div');
      row.setAttribute('data-part', 'bookmark-row');

      const label = document.createElement('span');
      label.textContent = `${bookmark.bookId} — page ${bookmark.pageNumber}`;
      row.appendChild(label);

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', async () => {
        removeButton.disabled = true;
        await bookmarkRepository.removeBookmark({
          userId: student.user_id,
          bookId: bookmark.bookId,
          pageNumber: bookmark.pageNumber,
          accessToken,
        });
        await loadBookmarksFor(student);
      });
      row.appendChild(removeButton);

      resultsSection.appendChild(row);
    });
  }

  const picker = createAdminStudentPicker({
    onSearch: (query) => profileRepository.searchProfiles({ query, accessToken }),
    onSelect: (student) => loadBookmarksFor(student),
  });

  element.appendChild(picker.element);
  element.appendChild(resultsSection);

  function destroy() {
    picker.destroy();
    element.remove();
  }

  return Object.freeze({ element, update: () => {}, destroy });
}
