/**
 * presentation/screens/admin/admin-licenses-screen.js
 *
 * Sprint 14 — "Ver licencias / Activar / Revocar" del MVP, vista
 * global (todas las cuentas). Reutiliza licenseRepository.listAllLicenses
 * y setLicenseStatus tal cual — ningún método ni tabla nueva.
 */

export function createAdminLicensesScreen({ accessToken, licenseRepository }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'admin-licenses-screen');

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = 'Licenses';
  element.appendChild(heading);

  const list = document.createElement('div');
  list.setAttribute('data-part', 'licenses-list');
  element.appendChild(list);

  async function load() {
    const licenses = await licenseRepository.listAllLicenses({ accessToken });
    list.replaceChildren();

    if (licenses.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No license keys yet.';
      list.appendChild(empty);
      return;
    }

    licenses.forEach((license) => {
      const row = document.createElement('div');
      row.setAttribute('data-part', 'license-row');

      const label = document.createElement('span');
      const owner = license.firstName ? `${license.firstName} ${license.lastName}` : 'Unassigned';
      label.textContent = `${license.keyCode} — ${license.bookId} — ${license.status} — ${owner}`;
      row.appendChild(label);

      if (license.userId) {
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.textContent = license.status === 'revoked' ? 'Reactivate' : 'Revoke';
        toggleButton.addEventListener('click', async () => {
          toggleButton.disabled = true;
          const nextStatus = license.status === 'revoked' ? 'activated' : 'revoked';
          await licenseRepository.setLicenseStatus({ licenseId: license.id, status: nextStatus, accessToken });
          await load();
        });
        row.appendChild(toggleButton);
      }

      list.appendChild(row);
    });
  }

  load();

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update: () => {}, destroy });
}
