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

  return Object.freeze({ getProfile, hasProfile, createProfile });
}
