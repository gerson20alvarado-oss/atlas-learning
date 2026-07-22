/**
 * vocabulary-entry/adapters/supabase-vocabulary-entry-adapter.js
 *
 * Única pieza que sabe que el vocabulario personal vive en
 * `vocabulary_entries(id, user_id, book_id, unit_number, term,
 * created_at, updated_at)` — ver docs/vocabulary-entries-schema.sql.
 *
 * Primera capacidad de Atlas que necesita interpretar un código de
 * error específico de Postgres: la violación de la restricción de
 * unicidad (23505) al intentar agregar o editar una entrada que
 * duplica una palabra ya existente en la misma unidad — la
 * respuesta HTTP de PostgREST en ese caso es 409 Conflict. Se
 * traduce aquí, en el borde del sistema, para que nunca escape un
 * error crudo de base de datos hacia el dominio ni la pantalla.
 */

const POSTGRES_UNIQUE_VIOLATION = '23505';

export function createSupabaseVocabularyEntryAdapter({ supabaseUrl, supabaseAnonKey, fetchImpl = fetch }) {
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

  async function isDuplicateConflict(response) {
    if (response.status !== 409) return false;
    try {
      const body = await response.clone().json();
      return body?.code === POSTGRES_UNIQUE_VIOLATION;
    } catch {
      // Cuerpo no parseable como JSON: no podemos confirmar que es
      // específicamente un duplicado — se trata como error genérico
      // más abajo, nunca se asume silenciosamente.
      return false;
    }
  }

  async function listEntries({ userId, bookId, unitNumber, accessToken }) {
    assertConfigured();
    const url =
      `${supabaseUrl}/rest/v1/vocabulary_entries?user_id=eq.${encodeURIComponent(userId)}` +
      `&book_id=eq.${encodeURIComponent(bookId)}&unit_number=eq.${unitNumber}` +
      `&select=id,term,updated_at&order=created_at.asc`;
    const response = await fetchImpl(url, { headers: authHeaders(accessToken) });
    if (!response.ok) {
      throw new Error(`Lectura de vocabulario falló con estado ${response.status}`);
    }
    return response.json();
  }

  async function addEntry({ userId, bookId, unitNumber, term, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(`${supabaseUrl}/rest/v1/vocabulary_entries`, {
      method: 'POST',
      headers: authHeaders(accessToken, {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
      body: JSON.stringify({ user_id: userId, book_id: bookId, unit_number: unitNumber, term }),
    });
    if (!response.ok) {
      if (await isDuplicateConflict(response)) {
        return { success: false, reason: 'duplicate' };
      }
      throw new Error(`Agregar palabra falló con estado ${response.status}`);
    }
    const rows = await response.json();
    return { success: true, entry: rows[0] };
  }

  async function updateEntry({ entryId, term, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(
      `${supabaseUrl}/rest/v1/vocabulary_entries?id=eq.${encodeURIComponent(entryId)}`,
      {
        method: 'PATCH',
        headers: authHeaders(accessToken, {
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        }),
        body: JSON.stringify({ term, updated_at: new Date().toISOString() }),
      },
    );
    if (!response.ok) {
      if (await isDuplicateConflict(response)) {
        return { success: false, reason: 'duplicate' };
      }
      throw new Error(`Editar palabra falló con estado ${response.status}`);
    }
    const rows = await response.json();
    return { success: true, entry: rows[0] };
  }

  async function removeEntry({ entryId, accessToken }) {
    assertConfigured();
    const response = await fetchImpl(
      `${supabaseUrl}/rest/v1/vocabulary_entries?id=eq.${encodeURIComponent(entryId)}`,
      { method: 'DELETE', headers: authHeaders(accessToken) },
    );
    if (!response.ok) {
      throw new Error(`Eliminar palabra falló con estado ${response.status}`);
    }
    return true;
  }

  return Object.freeze({ listEntries, addEntry, updateEntry, removeEntry });
}
