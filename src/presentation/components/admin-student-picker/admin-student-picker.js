/**
 * presentation/components/admin-student-picker/admin-student-picker.js
 *
 * Sprint 14 — Reader Progress y Bookmarks comparten exactamente la
 * misma necesidad: "elige un estudiante, luego actúa sobre sus
 * datos" (a diferencia de Licenses y Worksheet Attempts, que ya
 * tienen una vista con el nombre del dueño embebido y no necesitan
 * elegir nada primero). Un único componente para ese patrón, en vez
 * de repetir el mismo input+lista en dos screens.
 *
 * Componente puro: recibe `onSearch(query)` (normalmente
 * `profileRepository.searchProfiles`) y `onSelect(student)` — no
 * conoce Supabase ni accessToken.
 */

export function createAdminStudentPicker({ onSearch, onSelect }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'admin-student-picker');

  const input = document.createElement('input');
  input.type = 'search';
  input.setAttribute('data-part', 'search-input');
  input.placeholder = 'Search students by name…';

  const resultsList = document.createElement('ul');
  resultsList.setAttribute('data-part', 'results-list');

  element.appendChild(input);
  element.appendChild(resultsList);

  let debounceHandle = null;

  function renderResults(students) {
    resultsList.replaceChildren();
    if (students.length === 0) {
      const empty = document.createElement('li');
      empty.setAttribute('data-part', 'empty-state');
      empty.textContent = input.value.trim() ? 'No students match that name.' : 'Start typing a name.';
      resultsList.appendChild(empty);
      return;
    }
    students.forEach((student) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('data-part', 'result-item');
      button.textContent = `${student.first_name} ${student.last_name}`;
      button.addEventListener('click', () => onSelect(student));
      item.appendChild(button);
      resultsList.appendChild(item);
    });
  }

  async function runSearch(query) {
    const students = await onSearch(query);
    renderResults(students);
  }

  input.addEventListener('input', () => {
    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(() => runSearch(input.value), 250);
  });

  // Primer resultado (lista completa, hasta el límite del backend)
  // sin que el admin tenga que escribir nada — mismo criterio de
  // "nunca una pantalla en blanco" ya usado en el resto de Atlas.
  runSearch('');

  function destroy() {
    clearTimeout(debounceHandle);
    element.remove();
  }

  return Object.freeze({ element, destroy });
}
