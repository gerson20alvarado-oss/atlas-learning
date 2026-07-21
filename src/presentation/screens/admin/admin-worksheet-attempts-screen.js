/**
 * presentation/screens/admin/admin-worksheet-attempts-screen.js
 *
 * "Ver intentos por unidad / Editar attempts_used / Guardar
 * cambios" del MVP. Edita ÚNICAMENTE unit_attempt_limits.attempts_used
 * (confirmado): worksheet_exercise_attempts ya no controla intentos y
 * esta pantalla nunca lo toca ni lo asume.
 *
 * Evoluciones independientes por unidad: cada fila trae
 * `assessmentId` (Worksheet, Progress Test, futuras) — la etiqueta lo
 * muestra junto al `maxAttempts` real de esa evaluación (formato
 * "X / Y") y el guardado lo pasa de vuelta, para no editar nunca la
 * evaluación equivocada.
 *
 * Síntesis de evaluaciones en 0 intentos (corrección de esta
 * sesión): una evaluación nunca enviada no tiene fila en
 * `unit_attempt_limits` — la corrección anterior solo completaba esto
 * en la ficha por estudiante, dejando esta vista global mostrando
 * únicamente Worksheet cuando el Progress Test todavía no se había
 * tocado. Corregido: para cada (estudiante, unidad) que YA aparece en
 * los datos reales, se completan las evaluaciones declaradas en el
 * contenido que todavía no tienen fila, mostradas en 0/maxAttempts,
 * informativas y sin botón de guardar (un PATCH no crea filas). Sigue
 * sin listar estudiantes que nunca tocaron absolutamente nada en esa
 * unidad — eso necesitaría cruzar contra Licenses/Users, fuera de
 * alcance de esta corrección puntual.
 */

import { getAssessment, listAssessmentIds } from '../../../domain/worksheet-content/worksheet-content-repository.js';

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
    const realAttempts = await unitAttemptRepository.listAllWithOwner({ accessToken });

    // Completar, para cada (estudiante, unidad) que ya tiene algún
    // intento real, las evaluaciones declaradas que todavía no
    // tienen fila — mismo criterio que admin-user-detail-screen.js.
    const groupKeys = new Set(realAttempts.map((a) => `${a.userId}|${a.bookId}|${a.unitNumber}`));
    const syntheticAttempts = [];
    groupKeys.forEach((groupKey) => {
      const [userId, bookId, unitNumberStr] = groupKey.split('|');
      const unitNumber = Number(unitNumberStr);
      const owner = realAttempts.find((a) => a.userId === userId && a.bookId === bookId && a.unitNumber === unitNumber);
      const declaredIds = listAssessmentIds(bookId, unitNumber);
      const presentIds = new Set(
        realAttempts
          .filter((a) => a.userId === userId && a.bookId === bookId && a.unitNumber === unitNumber)
          .map((a) => a.assessmentId),
      );
      declaredIds.forEach((assessmentId) => {
        if (!presentIds.has(assessmentId)) {
          syntheticAttempts.push({
            userId,
            firstName: owner?.firstName ?? null,
            lastName: owner?.lastName ?? null,
            bookId,
            unitNumber,
            assessmentId,
            attemptsUsed: 0,
            synthetic: true,
          });
        }
      });
    });

    const attempts = [...realAttempts, ...syntheticAttempts];
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
      const assessmentContent = getAssessment(attempt.bookId, attempt.unitNumber, attempt.assessmentId);
      const assessmentTitle = assessmentContent?.assessmentTitle ?? attempt.assessmentId;
      const maxAttempts = assessmentContent?.maxAttempts ?? '—';
      label.textContent =
        `${owner} — ${attempt.bookId} — Unit ${attempt.unitNumber} — ${assessmentTitle}: ` +
        `${attempt.attemptsUsed} / ${maxAttempts}` +
        (attempt.synthetic ? ' (not started)' : '');
      row.appendChild(label);

      if (attempt.synthetic) {
        list.appendChild(row);
        return;
      }

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
          assessmentId: attempt.assessmentId,
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
