/**
 * presentation/screens/admin/admin-users-screen.js
 *
 * Sprint 14 — "Buscar usuarios" + "Ver perfil" del MVP. Reutiliza
 * profileRepository.searchProfiles (Sprint 14) tal cual; la
 * navegación a la ficha es responsabilidad de quien compone la
 * screen (screen-router.js), nunca de este componente — mismo
 * criterio de vecinos que el resto del proyecto.
 */

import { createAdminStudentPicker } from '../../components/admin-student-picker/admin-student-picker.js';

export function createAdminUsersScreen({ accessToken, profileRepository, onSelectStudent }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'admin-users-screen');

  const heading = document.createElement('h1');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-title';
  heading.textContent = 'Users';
  element.appendChild(heading);

  const picker = createAdminStudentPicker({
    onSearch: (query) => profileRepository.searchProfiles({ query, accessToken }),
    onSelect: (student) => onSelectStudent(student.user_id),
  });
  element.appendChild(picker.element);

  function destroy() {
    picker.destroy();
    element.remove();
  }

  return Object.freeze({ element, update: () => {}, destroy });
}
