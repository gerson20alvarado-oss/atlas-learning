/**
 * unit-availability/adapters/supabase-unit-availability-adapter.js
 *
 * Única pieza que sabe que la disponibilidad vive en
 * `disabled_units(book_id, unit_number, disabled_at)` — ver
 * docs/unit-availability-schema.sql.
 *
 * `getAllDisabledUnits` trae TODAS las filas, de todos los libros, en
 * una sola consulta — igual que `licenseRepository.getOwnedBookIds`
 * trae todos los libros de un usuario en una sola llamada. Esto
 * permite que quien la use (screen-router.js) la resuelva una sola
 * vez al arranque y la mantenga en caché, sin tener que preguntar
 * "¿y este libro en particular?" en cada navegación — mismo patrón
 * exacto ya usado para `ownedBookIds`.
 *
 * `replaceDisabledUnitsForBook` reemplaza el conjunto completo para
 * un libro (borra todo lo anterior, inserta el nuevo conjunto) — la
 * misma semántica de "Save Changes" de una sola acción que ya define
 * el diseño UX aprobado, nunca una escritura incremental unidad por
 * unidad.
 */

export function createSupabaseUnitAvailabilityAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
  function assertConfigured() {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase no está configurado (supabaseUrl/supabaseAnonKey ausentes en config/env.public.js).',
      );
    }
  }

  function authHeaders(accessToken, extra = {}) {
    return { apikey: supabaseAnonKey, Authorization: `Bearer ${accessToken}`, ...extra };
  }

  async function getAllDisabledUnits({ accessToken }) {
    assertConfigured();
    const url = `${supabaseUrl}/rest/v1/disabled_units?select=book_id,unit_number`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de disponibilidad falló con estado ${response.status}`);
    }
    return response.json();
  }

  async function replaceDisabledUnitsForBook({ bookId, unitNumbers, accessToken }) {
    assertConfigured();

    const deleteResponse = await fetchImpl(
      `${supabaseUrl}/rest/v1/disabled_units?book_id=eq.${encodeURIComponent(bookId)}`,
      { method: 'DELETE', headers: authHeaders(accessToken) },
    );
    if (!deleteResponse.ok) {
      throw new Error(`Reemplazo de disponibilidad (borrado previo) falló con estado ${deleteResponse.status}`);
    }

    if (unitNumbers.length === 0) return; // todo habilitado — nada que insertar

    const insertResponse = await fetchImpl(`${supabaseUrl}/rest/v1/disabled_units`, {
      method: 'POST',
      headers: authHeaders(accessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(unitNumbers.map((unitNumber) => ({ book_id: bookId, unit_number: unitNumber }))),
    });
    if (!insertResponse.ok) {
      throw new Error(`Reemplazo de disponibilidad (inserción) falló con estado ${insertResponse.status}`);
    }
  }

  return Object.freeze({ getAllDisabledUnits, replaceDisabledUnitsForBook });
}
