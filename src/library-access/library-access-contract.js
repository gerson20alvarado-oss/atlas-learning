/**
 * library-access/library-access-contract.js
 *
 * Capacidad de infraestructura mínima para que Atlas pueda leer, de
 * la fuente de datos configurada, qué libros tiene autorizados una
 * cuenta (Control de Acceso por Libro, diseño cerrado antes de este
 * sprint). Mismo patrón contrato + adapter que persistence/,
 * auth/ y remote-account-snapshot/ ya usan: este archivo no sabe que
 * el proveedor es Supabase, ni que existe ningún proveedor en
 * particular.
 *
 * Alcance deliberadamente mínimo — una sola operación, de solo
 * lectura:
 *   - Ninguna escritura desde Atlas. La relación userId→libros la
 *     administras tú, fuera de la aplicación (decisión de Producto:
 *     "sin autoservicio, sin UI de administración").
 *   - Sin suscripción a cambios, sin caché — se resuelve contra la
 *     fuente configurada en cada lectura (Sprint de implementación,
 *     riesgo aceptado: sin caché local en esta primera versión).
 *
 * Distinción de retorno, mismo criterio que account-snapshot-
 * contract.js:
 *   - `null`     → la cuenta existe y está confirmada sin libros
 *                  autorizados (Caso 5, biblioteca vacía).
 *   - `undefined` → no se pudo verificar (fallo de red) — nunca se
 *                  trata como "todos los libros" ni se bloquea al
 *                  estudiante; quien orquesta decide (degradar a
 *                  "sin libros" es la mitigación ya acordada).
 *   - array de ids → la lista real de libros autorizados.
 */

export function createLibraryAccessService(adapter, errorBoundary) {
  async function readAuthorizedBookIds({ userId, accessToken }) {
    try {
      const result = await adapter.readAuthorizedBookIds({ userId, accessToken });
      return result ?? null;
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'library-access-read-failed', err: String(err) });
      return undefined;
    }
  }

  return Object.freeze({ readAuthorizedBookIds });
}
