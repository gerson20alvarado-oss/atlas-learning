/**
 * auth/auth-contract.js
 *
 * Único punto de entrada público de la capa Auth (Software
 * Architecture §9.2: "Auth — Owns identity state and session
 * tokens"). Mismo patrón que persistence/storage-contract.js:
 * este archivo no sabe qué proveedor hay detrás — solo conoce el
 * `adapter` inyectado (Sprint 6 Plan: "diseña una capa de
 * Authentication desacoplada del proveedor. Supabase será
 * únicamente la primera implementación de esa abstracción").
 * Sustituir Supabase por otro proveedor en el futuro se limita a
 * escribir un nuevo adapter — este archivo no cambia.
 *
 * El token/identidad cacheados son propiedad de Auth (§10.2, §19.4):
 * este módulo es el ÚNICO que lee/escribe la clave de storage
 * dedicada — ninguna otra capa debe tocar `auth-session` en
 * Persistence directamente.
 *
 * `getSession()` es síncrono — nunca espera red (C3/C6): un
 * estudiante ya autenticado sigue viendo contenido ya cargado sin
 * que ninguna interacción dependa de una llamada de red (§13.3,
 * §13.6). `refreshToken()` es una operación de fondo, invisible
 * durante una Learning Session activa, con la misma postura no-
 * bloqueante que Sync (§11.3) — si falla, no cierra la sesión local
 * ni bloquea nada: Auth "must never gate access to already-loaded
 * Book content while offline" (§9.2).
 */

import { isValidAuthSessionShape } from './auth-session-shape.js';

const AUTH_SESSION_STORAGE_KEY = 'auth-session';

export function createAuthContract({ adapter, storage, errorBoundary }) {
  function readCachedSession() {
    const raw = storage.read(AUTH_SESSION_STORAGE_KEY);
    if (raw === null) return null;
    return isValidAuthSessionShape(raw) ? raw : null;
  }

  let cachedSession = readCachedSession();
  let listeners = [];

  function persist(session) {
    if (session) storage.write(AUTH_SESSION_STORAGE_KEY, session);
    else storage.remove(AUTH_SESSION_STORAGE_KEY);
  }

  function notify() {
    listeners.forEach((listener) => listener(cachedSession));
  }

  /** Síncrono a propósito — nunca debe convertirse en una llamada de red. */
  function getSession() {
    return cachedSession;
  }

  async function signIn(email, password) {
    try {
      const session = await adapter.signInWithPassword({ email, password });
      cachedSession = session;
      persist(session);
      notify();
      return { session, error: null };
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'auth-sign-in-failed', err: String(err) });
      return { session: null, error: 'No pudimos iniciar sesión. Verifica tus datos e intenta de nuevo.' };
    }
  }

  async function signOut() {
    try {
      await adapter.signOut(cachedSession);
    } catch (err) {
      // Un fallo cerrando sesión en el proveedor no debe impedir que
      // el estudiante cierre sesión localmente (§18.2: recuperable,
      // nunca debe atrapar al usuario en un estado inconsistente).
      errorBoundary.reportRecoverable({ reason: 'auth-sign-out-failed', err: String(err) });
    }
    cachedSession = null;
    persist(null);
    notify();
  }

  /** Operación de fondo — nunca invocada como condición para renderizar contenido ya cargado (§13.6). */
  async function refreshToken() {
    if (!cachedSession) return null;
    try {
      const refreshed = await adapter.refreshSession({ refreshToken: cachedSession.refreshToken });
      cachedSession = refreshed;
      persist(refreshed);
      notify();
      return refreshed;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'auth-refresh-failed', err: String(err) });
      return null;
    }
  }

  function onAuthStateChange(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }

  return Object.freeze({ getSession, signIn, signOut, refreshToken, onAuthStateChange });
}
