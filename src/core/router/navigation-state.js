/**
 * core/router/navigation-state.js
 *
 * Forma de la Navigation State (Sprint 1 Plan §9.3; Software
 * Architecture §16.2–16.3). Jerárquica y colección-shaped desde el
 * día uno: ningún campo representa "el libro actual" como singleton
 * (C8), y la forma misma hace inexpresable saltar un nivel de la
 * jerarquía Library → Book → Unit → Lesson → Section.
 *
 * En Sprint 1 no hay datos de dominio reales — todos los campos
 * quedan en null casi siempre — pero Sprint 2+ solo necesita empezar
 * a poblar esta forma, nunca rediseñarla.
 */

const NAVIGATION_STATE_KEYS = Object.freeze([
  'libraryPosition',
  'bookPosition',
  'unitPosition',
  'lessonPosition',
  'mode',
  'pagePosition',
  'assessmentPosition',
  'writingUnitPosition',
  'vocabularyUnitPosition',
  'passwordRecoveryParams',
  'adminSection',
  'adminUserId',
]);

export function createEmptyNavigationState() {
  return Object.freeze({
    libraryPosition: null,
    bookPosition: null,
    unitPosition: null,
    lessonPosition: null,
    mode: null,
    // Nuevo Reader (Sprint Proposal — Nuevo Reader, Etapa 7): número
    // de página dentro de un Book — nunca reutiliza lessonPosition,
    // que conserva exactamente su significado de siempre. Mismo
    // patrón que los cinco campos anteriores: siempre presente como
    // clave, null salvo en la ruta que sí lo puebla. Uso exclusivo
    // del Reader — ningún otro flujo (Library, Book, Unit, Lesson)
    // lo lee ni lo escribe.
    pagePosition: null,
    // Evoluciones independientes por unidad (esta sesión): qué
    // evaluación de la unidad se solicitó ('worksheet',
    // 'progress-test', futuras) — exclusivo de contenido con
    // contentMode 'worksheet'. `null` significa "sin segmento en la
    // URL", que screen-router.js resuelve a 'worksheet' por defecto
    // (compatibilidad: ningún enlace existente a `/read/:n` cambia
    // de comportamiento).
    assessmentPosition: null,
    // Writing (esta sesión): completamente separado de
    // `assessmentPosition` a propósito — Writing no es una
    // evaluación, y ni siquiera el nombre del campo de routing debe
    // sugerir que pertenece al sistema de Assessment. `null` fuera de
    // la ruta `/book/:id/writing/:unitNumber`.
    writingUnitPosition: null,
    // My Vocabulary (esta sesión): mismo criterio exacto que
    // writingUnitPosition — campo propio, sin relación con
    // assessmentPosition ni con writingUnitPosition. `null` fuera de
    // la ruta `/book/:id/vocabulary/:unitNumber`.
    vocabularyUnitPosition: null,
    // Restablecimiento de Contraseña (esta sesión): el fragmento
    // ORIGINAL completo que Supabase entrega en su enlace de
    // recuperación (access_token, refresh_token, expires_in,
    // token_type, type=recovery), preservado tal cual — nunca
    // reducido a un solo campo — y re-codificado únicamente para
    // sobrevivir como segmento de ruta (ver
    // app/bootstrap.js#translateSupabaseRecoveryHash para el porqué
    // de esta traducción). Se interpreta recién en
    // screen-router.js, nunca aquí — este archivo no sabe qué es
    // Supabase.
    passwordRecoveryParams: null,
    // Admin Console (Sprint 14): jerarquía completamente separada de
    // la de contenido (Library → Book → Unit → Lesson) — un
    // adminSection nunca coexiste con bookPosition/unitPosition en
    // la misma Navigation State. 'dashboard' | 'users' |
    // 'user-detail' | 'licenses' | 'worksheet-attempts' |
    // 'reader-progress' | 'bookmarks' | null.
    adminSection: null,
    // Único caso que necesita un identificador propio dentro de
    // Admin: la ficha de un estudiante concreto ('user-detail').
    // Análogo a bookPosition/unitPosition — el id no se valida aquí,
    // solo se transporta (screen-router.js decide qué hacer si no
    // existe).
    adminUserId: null,
  });
}

/**
 * Valida que un objeto tenga exactamente la forma esperada — usado
 * por el router para no publicar nunca un estado con estructura
 * inválida. Defensa en profundidad, no solo convención de código.
 */
export function isValidNavigationState(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  const candidateKeys = Object.keys(candidate);
  return (
    NAVIGATION_STATE_KEYS.every((key) => key in candidate) &&
    candidateKeys.every((key) => NAVIGATION_STATE_KEYS.includes(key))
  );
}
