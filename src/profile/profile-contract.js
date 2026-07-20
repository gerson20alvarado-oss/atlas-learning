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

  return Object.freeze({ getProfile, createProfile });
}
