/**
 * unit-availability/unit-availability-contract.js
 *
 * Capacidad de infraestructura para Disponibilidad de Unidades —
 * mismo patrón contrato + adapter que el resto de Atlas.
 *
 * `getAllDisabledUnits` nunca lanza: ante cualquier fallo, degrada a
 * una lista vacía — que, dado el modelo invertido de esta tabla,
 * significa "nada deshabilitado en ningún libro". Es exactamente el
 * default seguro que exige la especificación funcional aprobada: un
 * fallo de red nunca debe bloquear el acceso de un estudiante a
 * contenido que debería poder ver.
 */

export function createUnitAvailabilityService(adapter, errorBoundary) {
  async function getAllDisabledUnits({ accessToken }) {
    try {
      return await adapter.getAllDisabledUnits({ accessToken });
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'unit-availability-read-failed', err: String(err) });
      return [];
    }
  }

  async function replaceDisabledUnitsForBook({ bookId, unitNumbers, accessToken }) {
    try {
      await adapter.replaceDisabledUnitsForBook({ bookId, unitNumbers, accessToken });
      return { success: true, error: null };
    } catch (err) {
      errorBoundary.reportRecoverable({ reason: 'unit-availability-save-failed', bookId, err: String(err) });
      return { success: false, error: 'No pudimos guardar los cambios. Intenta de nuevo.' };
    }
  }

  return Object.freeze({ getAllDisabledUnits, replaceDisabledUnitsForBook });
}
