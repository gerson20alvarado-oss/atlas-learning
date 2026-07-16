/**
 * auth/auth-session-shape.js
 *
 * Forma de la AuthSession cacheada localmente (Software Architecture
 * §10.2, §13.3, §19.4: "propiedad de Auth", nunca de Persistence ni
 * de Domain). Vive dentro de `auth/` a propósito — ni siquiera el
 * validador de esta forma debe ser importable desde domain/contracts,
 * para que sea estructuralmente imposible que Domain llegue a
 * conocer nada de Auth por accidente (Sprint 6 Plan, decisión #5).
 */

const AUTH_SESSION_KEYS = Object.freeze([
  'userId',
  'email',
  'accessToken',
  'refreshToken',
  'expiresAt',
]);

export function isValidAuthSessionShape(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  const candidateKeys = Object.keys(candidate);
  return (
    AUTH_SESSION_KEYS.every((key) => key in candidate) &&
    candidateKeys.every((key) => AUTH_SESSION_KEYS.includes(key))
  );
}

export { AUTH_SESSION_KEYS };
