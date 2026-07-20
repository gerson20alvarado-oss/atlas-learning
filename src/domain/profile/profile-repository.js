/**
 * domain/profile/profile-repository.js
 *
 * Único punto de entrada del dominio para el perfil de usuario.
 * `hasProfile` es azúcar sobre `getProfile` — la pregunta real que
 * hace quien orquesta la pantalla ("¿ya tiene perfil, o hay que
 * completarlo?") sin que cada punto de llamada repita la
 * comparación contra `null`.
 */

export function createProfileRepository(profileService) {
  async function getProfile({ userId, accessToken }) {
    return profileService.getProfile({ userId, accessToken });
  }

  async function hasProfile({ userId, accessToken }) {
    const profile = await profileService.getProfile({ userId, accessToken });
    return profile !== null;
  }

  async function createProfile({ userId, firstName, lastName, accessToken }) {
    return profileService.createProfile({ userId, firstName, lastName, accessToken });
  }

  /**
   * Admin Console (Sprint 14) — azúcar sobre getProfile, mismo
   * criterio que hasProfile: la pregunta real que hace
   * screen-router.js ("¿esta cuenta puede ver Admin?") sin repetir
   * la comparación de role en cada punto de llamada. Conservador por
   * defecto: cualquier perfil ausente o sin `role` se trata como no-
   * admin, nunca al revés.
   */
  async function isAdmin({ userId, accessToken }) {
    const profile = await profileService.getProfile({ userId, accessToken });
    return profile?.role === 'admin';
  }

  async function searchProfiles({ query, accessToken }) {
    return profileService.searchProfiles({ query, accessToken });
  }

  async function countStudents({ accessToken }) {
    return profileService.countStudents({ accessToken });
  }

  return Object.freeze({ getProfile, hasProfile, createProfile, isAdmin, searchProfiles, countStudents });
}
