/**
 * profile/profile-contract.js
 *
 * Capacidad de infraestructura de perfiles — mismo patrón contrato +
 * adapter que el resto del proyecto. `getProfile` nunca lanza: ante
 * cualquier fallo, se trata como "no tiene perfil todavía"
 * (degradación segura) — en el peor caso, se le vuelve a pedir el
 * nombre, nunca se rompe la pantalla. `createProfile` sí propaga
 * su éxito/fallo real, porque el flujo de completar perfil necesita
 * saber si debe reintentar.
 */

export function createProfileService(adapter, errorBoundary) {
  async function getProfile({ userId, accessToken }) {
    try {
      return await adapter.getProfile({ userId, accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'profile-read-failed', userId, err: String(err) });
      return null;
    }
  }

  async function createProfile({ userId, firstName, lastName, accessToken }) {
    try {
      await adapter.createProfile({ userId, firstName, lastName, accessToken });
      return true;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'profile-create-failed', userId, err: String(err) });
      return false;
    }
  }

  /** Admin Console (Sprint 14) — nunca lanza: ante fallo, lista vacía. */
  async function searchProfiles({ query, accessToken }) {
    try {
      const rows = await adapter.searchProfiles({ query, accessToken });
      return rows ?? [];
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'profile-search-failed', query, err: String(err) });
      return [];
    }
  }

  /** Admin Console (Sprint 14) — nunca lanza: ante fallo, 0 (nunca fabricado). */
  async function countStudents({ accessToken }) {
    try {
      return await adapter.countStudents({ accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'profile-count-failed', err: String(err) });
      return 0;
    }
  }

  return Object.freeze({ getProfile, createProfile, searchProfiles, countStudents });
}
