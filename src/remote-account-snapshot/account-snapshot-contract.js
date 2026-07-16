/**
 * remote-account-snapshot/account-snapshot-contract.js
 *
 * Capacidad de infraestructura MÍNIMA para que el flujo de
 * vinculación de cuenta (app/account-linking/) pueda leer y escribir,
 * una sola vez, el snapshot remoto de datos de una cuenta (Sprint 6
 * Plan, Opción A: alcance controlado, explícitamente NO es la capa
 * de Sync).
 *
 * Por qué vive aquí y no dentro de app/account-linking/ (corrección
 * explícita del Sprint 6 Plan): es infraestructura — habla con un
 * almacén remoto — y esa responsabilidad no debe asignarse a un flujo
 * de aplicación. account-linking-flow.js CONSUME este servicio, pero
 * no es su propietario.
 *
 * Por qué esto NO es Sync, deliberadamente, para no condicionar su
 * diseño futuro:
 *   - Expone exactamente DOS operaciones: leer una vez, escribir una
 *     vez. Sin suscripción a cambios, sin reintentos en segundo
 *     plano, sin política de conflictos.
 *   - El nombre del módulo, de la carpeta y de cada función evita a
 *     propósito la palabra "sync" — para que nada lo reutilice por
 *     analogía cuando Sync se diseñe.
 *   - El payload es un snapshot opaco (un blob), no un esquema
 *     granular por entidad — evita pre-comprometer cómo Sync
 *     modelará la sincronización incremental de Attempts/Session en
 *     el futuro.
 *
 * Mismo patrón contrato + adapter que persistence/ y auth/: este
 * archivo no sabe que el proveedor es Supabase.
 *
 * Distinción importante en el valor de retorno de `readSnapshot`:
 *   - `null`  → la cuenta remota existe y está confirmada vacía.
 *   - `undefined` → no se pudo verificar (fallo de red) — nunca debe
 *     tratarse como "vacía"; quien orquesta (account-linking-flow.js)
 *     debe abstenerse de decidir y reintentar en un login posterior.
 *   - objeto `{ attempts, session }` → snapshot real.
 */

export function createAccountSnapshotService(adapter, errorBoundary) {
  async function readSnapshot({ userId, accessToken }) {
    try {
      const result = await adapter.readSnapshot({ userId, accessToken });
      return result ?? null;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'account-snapshot-read-failed', err: String(err) });
      return undefined;
    }
  }

  async function writeSnapshot({ userId, accessToken, payload }) {
    try {
      return await adapter.writeSnapshot({ userId, accessToken, payload });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'account-snapshot-write-failed', err: String(err) });
      return false;
    }
  }

  return Object.freeze({ readSnapshot, writeSnapshot });
}
