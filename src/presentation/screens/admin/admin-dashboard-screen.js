/**
 * presentation/screens/admin/admin-dashboard-screen.js
 *
 * Sprint 14 — primera pantalla de Admin Console. MVP deliberadamente
 * mínimo: tres conteos, ningún gráfico ni tendencia (eso puede venir
 * en un sprint posterior si hace falta de verdad). Cada número se
 * resuelve con un método ya expuesto en Sprint 14 sobre los mismos
 * repositorios del estudiante (countStudents, countLicensesByStatus,
 * listAllWithOwner) — cero lógica de agregación nueva en Supabase.
 */

function createStatCard({ label, value }) {
  const card = document.createElement('div');
  card.setAttribute('data-part', 'stat-card');

  const valueEl = document.createElement('p');
  valueEl.setAttribute('data-part', 'stat-value');
  valueEl.textContent = value;

  const labelEl = document.createElement('p');
  labelEl.setAttribute('data-part', 'stat-label');
  labelEl.textContent = label;

  card.appendChild(valueEl);
  card.appendChild(labelEl);
  return card;
}

export function createAdminDashboardScreen({
  accessToken,
  profileRepository,
  licenseRepository,
  unitAttemptRepository,
}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'admin-dashboard-screen');

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = 'Dashboard';
  element.appendChild(heading);

  const statsRow = document.createElement('div');
  statsRow.setAttribute('data-part', 'stats-row');
  element.appendChild(statsRow);

  async function load() {
    const [studentCount, activeLicenseCount, unitAttempts] = await Promise.all([
      profileRepository.countStudents({ accessToken }),
      licenseRepository.countLicensesByStatus({ status: 'activated', accessToken }),
      unitAttemptRepository.listAllWithOwner({ accessToken }),
    ]);

    const unitsWithAtLeastOneAttempt = unitAttempts.filter((row) => row.attemptsUsed >= 1).length;
    const unitsAtLimit = unitAttempts.filter((row) => row.attemptsUsed >= 2).length;

    statsRow.replaceChildren(
      createStatCard({ label: 'Students', value: studentCount }),
      createStatCard({ label: 'Active licenses', value: activeLicenseCount }),
      createStatCard({ label: 'Units attempted', value: unitsWithAtLeastOneAttempt }),
      createStatCard({ label: 'Units at attempt limit', value: unitsAtLimit }),
    );
  }

  load();

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update: () => {}, destroy });
}
