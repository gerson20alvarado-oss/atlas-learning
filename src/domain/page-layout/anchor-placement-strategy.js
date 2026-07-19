/**
 * domain/page-layout/anchor-placement-strategy.js
 *
 * AnchorPlacementStrategy (Technical Specification v2.1, §7):
 * traduce un PageResource en una posición visual — coordenadas
 * normalizadas (0–1). Configurada por `pageTemplate`, confirmada con
 * evidencia real de dos capítulos (Track 01/02/03 siempre en la
 * misma región relativa, independientemente del capítulo).
 *
 * `LayoutRule` no existe como archivo aparte en este modelo — la
 * Technical Specification v2.1 §6.2 ya lo simplificó a una función
 * de paso: cada `PageResource` ya es, él mismo, el candidato. Esta
 * estrategia es la única pieza que decide dónde.
 *
 * `answerKey` nunca recibe posición aquí — decisión ya aprobada
 * (Technical Specification v2.1, §7.4): en Hi! Korean se consume
 * dentro del sheet de `studyWorkspace`, nunca con marcador propio.
 * Un candidato sin posición asignada no es un error — simplemente no
 * genera marcador (§7.3).
 */

// Confirmado con evidencia real (dos capítulos, tres páginas de
// audio verificadas visualmente contra el PDF): el audio vive
// siempre en la misma región relativa, junto al título.
const AUDIO_POSITION = Object.freeze({ x: 0.88, y: 0.06 });

// Sin evidencia editorial que fijar — a diferencia del audio, estos
// dos recursos son adiciones propias de Atlas, sin un ícono
// impreso en la página real que igualar. Posiciones elegidas por
// consistencia visual, no por patrón del libro.
const TRANSCRIPT_POSITION = Object.freeze({ x: 0.76, y: 0.06 });
const STUDY_WORKSPACE_POSITION = Object.freeze({ x: 0.88, y: 0.92 });

const DEFAULT_PLACEMENTS = Object.freeze({
  audio: AUDIO_POSITION,
  transcript: TRANSCRIPT_POSITION,
  studyWorkspace: STUDY_WORKSPACE_POSITION,
  // answerKey: sin entrada a propósito — nunca genera marcador propio.
});

/**
 * Fábrica — nunca un singleton implícito. Hoy existe una única
 * configuración real (Hi! Korean 3A, "patrón estándar" ya
 * confirmado); un `pageTemplate` con una convención distinta, o un
 * libro futuro, tendría su propia instancia sin tocar esta.
 */
export function createAnchorPlacementStrategy(placements = DEFAULT_PLACEMENTS) {
  function place(resource) {
    const position = placements[resource.type];
    if (!position) return null; // candidato sin posición asignada — no es un error
    return { resource, position };
  }

  return Object.freeze({ place });
}
