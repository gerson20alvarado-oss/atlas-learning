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
 *
 * `studyWorkspace` tampoco recibe posición aquí (corrección de UX,
 * esta sesión): dejó de ser un marcador anclado a una página
 * específica — es una pestaña fija del propio Reader, siempre
 * disponible, en cualquier página (page-reader-screen.js,
 * `studyWorkspaceTab`). Un candidato sin posición asignada no es un
 * error — simplemente no genera marcador (§7.3).
 *
 * Posición definitiva de audio/transcripción (esta sesión, segunda
 * corrección tras prueba manual): dentro de la franja de encabezado
 * de la página, a la derecha del título de sección — nunca sobre la
 * ilustración, el ejercicio, ni junto al QR. Horizontales entre sí,
 * no apiladas — la posición vertical anterior (cerca del QR) resultó
 * incorrecta al probarla en el Reader real.
 */

// Separación horizontal calculada, no estimada a ojo: columna de
// lectura = 680px (--al-measure-reading), tarjeta = 168px de ancho.
// Una separación menor a ~0.25 (170px) las solapa. 0.265 deja un
// margen pequeño real entre ambas.
const AUDIO_POSITION = Object.freeze({ x: 0.55, y: 0.07 });
const TRANSCRIPT_POSITION = Object.freeze({ x: 0.815, y: 0.07 });

const DEFAULT_PLACEMENTS = Object.freeze({
  audio: AUDIO_POSITION,
  transcript: TRANSCRIPT_POSITION,
  // answerKey, studyWorkspace: sin entrada a propósito — ninguno de
  // los dos genera marcador propio sobre la página.
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
