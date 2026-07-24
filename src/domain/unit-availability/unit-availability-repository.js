/**
 * domain/unit-availability/unit-availability-repository.js
 *
 * Único punto de entrada del dominio para Disponibilidad de
 * Unidades — mismo patrón que license-repository.js.
 *
 * `getDisabledUnitsByBook` normaliza la lista plana de filas a un
 * mapa `{ bookId: [unitNumber, unitNumber, ...] }` — la forma que
 * screen-router.js necesita para cachear en un solo objeto, igual
 * que ya hace con `ownedBookIds`.
 *
 * `isUnitDisabled` es deliberadamente una función pura y síncrona
 * (nunca de red) — es el chequeo que corre dentro de
 * `resolveScreen()`, que hoy es sincrónico de principio a fin; esta
 * función nunca debe convertir eso en asíncrono.
 */

export function createUnitAvailabilityRepository(unitAvailabilityService) {
  async function getDisabledUnitsByBook({ accessToken }) {
    const rows = await unitAvailabilityService.getAllDisabledUnits({ accessToken });
    const byBook = {};
    rows.forEach((row) => {
      if (!byBook[row.book_id]) byBook[row.book_id] = [];
      byBook[row.book_id].push(row.unit_number);
    });
    return byBook;
  }

  function isUnitDisabled(disabledUnitsByBook, bookId, unitNumber) {
    return (disabledUnitsByBook?.[bookId] ?? []).includes(unitNumber);
  }

  async function saveDisabledUnitsForBook({ bookId, unitNumbers, accessToken }) {
    return unitAvailabilityService.replaceDisabledUnitsForBook({ bookId, unitNumbers, accessToken });
  }

  return Object.freeze({ getDisabledUnitsByBook, isUnitDisabled, saveDisabledUnitsForBook });
}
