/**
 * presentation/screens/admin/admin-worksheet-attempts-screen.js
 *
 * Sprint 14 — "Ver intentos por unidad / Editar attempts_used /
 * Guardar cambios" del MVP. Edita ÚNICAMENTE
 * unit_attempt_limits.attempts_used (confirmado): worksheet_exercise_attempts
 * ya no controla intentos y esta pantalla nunca lo toca ni lo asume.
 * Reemplaza el uso manual de docs/set-unit-attempts-by-name.sql.
 */

export function createAdminWorksheetAttemptsScreen({ accessToken, unitAttemptRepository }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'admin-worksheet-attempts-screen');

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = 'Worksheet Attempts';
  element.appendChild(heading);

  const list = document.createElement('div');
  list.setAttribute('data-part', 'attempts-list');
  element.appendChild(list);

  async function load() {
    const attempts = await unitAttemptRepository.listAllWithOwner({ accessToken });
    list.replaceChildren();

    if (attempts.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No unit attempts recorded yet.';
      list.appendChild(empty);
      return;
    }

    attempts.forEach((attempt) => {
      const row = document.createElement('div');
      row.setAttribute('data-part', 'attempt-row');

      const label = document.createElement('span');
      const owner = attempt.firstName ? `${attempt.firstName} ${attempt.lastName}` : attempt.userId;
      label.textContent = `${owner} — ${attempt.bookId} — Unit ${attempt.unitNumber}`;
      row.appendChild(label);

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.setAttribute('data-part', 'attempts-used-input');
      input.value = String(attempt.attemptsUsed);
      row.appendChild(input);

      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.setAttribute('data-part', 'save-button');
      saveButton.textContent = 'Save';
      saveButton.addEventListener('click', async () => {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving…';
        const success = await unitAttemptRepository.setAttemptsUsed({
          userId: attempt.userId,
          bookId: attempt.bookId,
          unitNumber: attempt.unitNumber,
          attemptsUsed: Number(input.value),
          accessToken,
        });
        saveButton.disabled = false;
        saveButton.textContent = success ? 'Saved ✓' : 'Failed — retry';
      });
      row.appendChild(saveButton);

      list.appendChild(row);
    });
  }

  load();

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update: () => {}, destroy });
}
