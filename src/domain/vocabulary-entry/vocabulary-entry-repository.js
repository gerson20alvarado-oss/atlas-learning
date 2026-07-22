/**
 * domain/vocabulary-entry/vocabulary-entry-repository.js
 *
 * Único punto de entrada del dominio para My Vocabulary — mismo
 * patrón que reader-position-repository.js/bookmark-repository.js.
 * Normaliza las filas planas del adapter a camelCase, la forma que
 * vocabulary-screen.js consume.
 */

export function createVocabularyEntryRepository(vocabularyEntryService) {
  async function listEntries({ userId, bookId, unitNumber, accessToken }) {
    const rows = await vocabularyEntryService.listEntries({ userId, bookId, unitNumber, accessToken });
    return rows.map((row) => ({ id: row.id, term: row.term, updatedAt: row.updated_at }));
  }

  async function addEntry({ userId, bookId, unitNumber, term, accessToken }) {
    const result = await vocabularyEntryService.addEntry({ userId, bookId, unitNumber, term, accessToken });
    if (!result.success) return result;
    return { success: true, entry: { id: result.entry.id, term: result.entry.term, updatedAt: result.entry.updated_at } };
  }

  async function updateEntry({ entryId, term, accessToken }) {
    const result = await vocabularyEntryService.updateEntry({ entryId, term, accessToken });
    if (!result.success) return result;
    return { success: true, entry: { id: result.entry.id, term: result.entry.term, updatedAt: result.entry.updated_at } };
  }

  async function removeEntry({ entryId, accessToken }) {
    return vocabularyEntryService.removeEntry({ entryId, accessToken });
  }

  return Object.freeze({ listEntries, addEntry, updateEntry, removeEntry });
}
