/**
 * presentation/screens/admin/admin-user-detail-screen.js
 *
 * "Ver perfil" del MVP, extendido a una ficha completa: un admin que
 * ya identificó a un estudiante concreto necesita ver (y en varios
 * casos actuar sobre) todo lo relacionado a esa cuenta en un solo
 * lugar, sin repetir la búsqueda en cuatro pantallas distintas.
 * Reutiliza exactamente los mismos repositorios que las pantallas
 * globales (Licenses, Worksheet Attempts, Reader Progress,
 * Bookmarks) — misma fuente de datos, ningún método nuevo aquí.
 *
 * Corrección de regresión (Evaluaciones Independientes): una
 * evaluación sin intentos todavía (ej. Progress Test antes de que el
 * estudiante lo toque) no tiene fila en `unit_attempt_limits` — nunca
 * la tuvo, ni antes de esta arquitectura. Antes no importaba porque
 * solo existía una evaluación por unidad; ahora, mostrar solo lo que
 * hay en la base de datos deja al Progress Test invisible mientras
 * nadie lo haya enviado. `listAssessmentIds`/`getAssessment` (mismo
 * contenido que ya resuelve la pantalla del estudiante) completan lo
 * que falta con entradas "0 / maxAttempts", nunca inventadas — el
 * `maxAttempts` es el mismo que gobierna la app real.
 */

import { listAssessmentIds, getAssessment } from '../../../domain/worksheet-content/worksheet-content-repository.js';

function createSectionTitle(text) {
  const el = document.createElement('h2');
  el.setAttribute('data-part', 'section-title');
  el.className = 'al-type-ui-body';
  el.textContent = text;
  return el;
}

export function createAdminUserDetailScreen({
  userId,
  accessToken,
  profileRepository,
  licenseRepository,
  unitAttemptRepository,
  readerPositionRepository,
  bookmarkRepository,
  onBack,
}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'admin-user-detail-screen');

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = 'Student';
  element.appendChild(heading);

  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.setAttribute('data-part', 'back-button');
  backButton.textContent = '← Back to Users';
  backButton.addEventListener('click', onBack);
  element.appendChild(backButton);

  const profileSection = document.createElement('div');
  profileSection.setAttribute('data-part', 'profile-section');
  element.appendChild(profileSection);

  const licensesSection = document.createElement('div');
  licensesSection.setAttribute('data-part', 'licenses-section');
  element.appendChild(licensesSection);

  const attemptsSection = document.createElement('div');
  attemptsSection.setAttribute('data-part', 'attempts-section');
  element.appendChild(attemptsSection);

  const positionsSection = document.createElement('div');
  positionsSection.setAttribute('data-part', 'positions-section');
  element.appendChild(positionsSection);

  const bookmarksSection = document.createElement('div');
  bookmarksSection.setAttribute('data-part', 'bookmarks-section');
  element.appendChild(bookmarksSection);

  async function loadProfile() {
    const profile = await profileRepository.getProfile({ userId, accessToken });
    profileSection.replaceChildren();
    const name = document.createElement('p');
    name.setAttribute('data-part', 'profile-name');
    name.textContent = profile
      ? `${profile.first_name} ${profile.last_name} (${profile.role})`
      : 'Profile not found.';
    profileSection.appendChild(name);
  }

  async function loadLicenses() {
    const allLicenses = await licenseRepository.listAllLicenses({ accessToken });
    const licenses = allLicenses.filter((l) => l.userId === userId);
    licensesSection.replaceChildren(createSectionTitle('Licenses'));
    if (licenses.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No licenses for this student.';
      licensesSection.appendChild(empty);
      return;
    }
    licenses.forEach((license) => {
      const row = document.createElement('div');
      row.setAttribute('data-part', 'license-row');
      const label = document.createElement('span');
      label.textContent = `${license.bookId} — ${license.status}`;
      row.appendChild(label);

      const toggleButton = document.createElement('button');
      toggleButton.type = 'button';
      toggleButton.textContent = license.status === 'revoked' ? 'Reactivate' : 'Revoke';
      toggleButton.addEventListener('click', async () => {
        toggleButton.disabled = true;
        const nextStatus = license.status === 'revoked' ? 'activated' : 'revoked';
        await licenseRepository.setLicenseStatus({ licenseId: license.id, status: nextStatus, accessToken });
        await loadLicenses();
      });
      row.appendChild(toggleButton);
      licensesSection.appendChild(row);
    });
  }

  async function loadAttempts() {
    const allAttempts = await unitAttemptRepository.listAllWithOwner({ accessToken });
    const realAttempts = allAttempts.filter((a) => a.userId === userId);

    // Completar evaluaciones declaradas en el contenido que todavía
    // no tienen fila real (0 intentos) — solo para las unidades donde
    // el estudiante ya tiene AL MENOS una evaluación con datos reales
    // (mismo criterio que "No unit attempts yet" de abajo: una unidad
    // que el estudiante nunca tocó de ninguna forma sigue sin
    // aparecer, igual que antes).
    const unitKeys = new Set(realAttempts.map((a) => `${a.bookId}|${a.unitNumber}`));
    const syntheticAttempts = [];
    unitKeys.forEach((unitKey) => {
      const [bookId, unitNumberStr] = unitKey.split('|');
      const unitNumber = Number(unitNumberStr);
      const declaredIds = listAssessmentIds(bookId, unitNumber);
      const presentIds = new Set(
        realAttempts.filter((a) => a.bookId === bookId && a.unitNumber === unitNumber).map((a) => a.assessmentId),
      );
      declaredIds.forEach((assessmentId) => {
        if (!presentIds.has(assessmentId)) {
          syntheticAttempts.push({ userId, bookId, unitNumber, assessmentId, attemptsUsed: 0, synthetic: true });
        }
      });
    });

    const attempts = [...realAttempts, ...syntheticAttempts];
    attemptsSection.replaceChildren(createSectionTitle('Assessment Attempts'));
    if (attempts.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No unit attempts yet.';
      attemptsSection.appendChild(empty);
      return;
    }
    attempts.forEach((attempt) => {
      const row = document.createElement('div');
      row.setAttribute('data-part', 'attempt-row');

      const assessmentContent = getAssessment(attempt.bookId, attempt.unitNumber, attempt.assessmentId);
      const assessmentTitle = assessmentContent?.assessmentTitle ?? attempt.assessmentId;
      const maxAttempts = assessmentContent?.maxAttempts;

      const label = document.createElement('span');
      label.textContent =
        `${attempt.bookId} — Unit ${attempt.unitNumber} — ${assessmentTitle}: ` +
        `${attempt.attemptsUsed} / ${maxAttempts ?? '—'}` +
        (attempt.synthetic ? ' (not started)' : '');
      row.appendChild(label);

      if (attempt.synthetic) {
        // Sin fila real en unit_attempt_limits todavía — un PATCH
        // (UPDATE) no crea filas nuevas, así que "Save" fallaría en
        // silencio. Se muestra informativo, nunca editable, hasta
        // que el propio estudiante genere la fila real (su primer
        // Submit).
        attemptsSection.appendChild(row);
        return;
      }

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.value = String(attempt.attemptsUsed);
      row.appendChild(input);

      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.textContent = 'Save';
      saveButton.addEventListener('click', async () => {
        saveButton.disabled = true;
        await unitAttemptRepository.setAttemptsUsed({
          userId,
          bookId: attempt.bookId,
          unitNumber: attempt.unitNumber,
          assessmentId: attempt.assessmentId,
          attemptsUsed: Number(input.value),
          accessToken,
        });
        saveButton.disabled = false;
      });
      row.appendChild(saveButton);
      attemptsSection.appendChild(row);
    });
  }

  async function loadPositions() {
    const positions = await readerPositionRepository.listForUser({ userId, accessToken });
    positionsSection.replaceChildren(createSectionTitle('Reader Progress'));
    if (positions.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No reading progress yet.';
      positionsSection.appendChild(empty);
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
        await readerPositionRepository.resetPosition({ userId, bookId: position.bookId, accessToken });
        await loadPositions();
      });
      row.appendChild(resetButton);
      positionsSection.appendChild(row);
    });
  }

  async function loadBookmarks() {
    const bookmarks = await bookmarkRepository.listAllForUser({ userId, accessToken });
    bookmarksSection.replaceChildren(createSectionTitle('Bookmarks'));
    if (bookmarks.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No bookmarks yet.';
      bookmarksSection.appendChild(empty);
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
          userId,
          bookId: bookmark.bookId,
          pageNumber: bookmark.pageNumber,
          accessToken,
        });
        await loadBookmarks();
      });
      row.appendChild(removeButton);
      bookmarksSection.appendChild(row);
    });
  }

  Promise.all([loadProfile(), loadLicenses(), loadAttempts(), loadPositions(), loadBookmarks()]);

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update: () => {}, destroy });
}
