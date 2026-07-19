/**
 * domain/contracts/study-workspace-entry-shape.js
 *
 * Forma de una StudyWorkspaceEntry (Technical Specification v2.1,
 * §5.4/§13): notas libres del estudiante + referencias a imágenes,
 * por página y por cuenta. `imageRefs` contiene únicamente rutas de
 * Supabase Storage — nunca Base64, nunca el binario, nunca una URL
 * pública permanente (decisión ya aprobada: bucket privado, URL
 * firmada solo en el momento de la lectura).
 */

const STUDY_WORKSPACE_ENTRY_KEYS = Object.freeze(['bookId', 'pageNumber', 'userId', 'notes', 'imageRefs']);

export function createEmptyStudyWorkspaceEntry({ bookId, pageNumber, userId }) {
  return Object.freeze({ bookId, pageNumber, userId, notes: '', imageRefs: [] });
}

export function isValidStudyWorkspaceEntryShape(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  const candidateKeys = Object.keys(candidate);
  return (
    STUDY_WORKSPACE_ENTRY_KEYS.every((key) => key in candidate) &&
    candidateKeys.every((key) => STUDY_WORKSPACE_ENTRY_KEYS.includes(key)) &&
    typeof candidate.bookId === 'string' &&
    Number.isInteger(candidate.pageNumber) &&
    typeof candidate.userId === 'string' &&
    typeof candidate.notes === 'string' &&
    Array.isArray(candidate.imageRefs) &&
    candidate.imageRefs.every((ref) => typeof ref === 'string')
  );
}

export { STUDY_WORKSPACE_ENTRY_KEYS };
