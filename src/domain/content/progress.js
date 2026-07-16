/**
 * domain/content/progress.js
 *
 * Progress es siempre un valor derivado, nunca un contador propio
 * (Software Architecture §3, §15.2): se computa a partir del
 * historial de Attempts, jamás mantenido aparte.
 *
 * Sprint 2 todavía no tiene Attempts — Progress & Memory
 * Architecture (Attempt, Error Record) llega en Sprint 4 (Roadmap,
 * Phase 4). Estas funciones son el punto único donde ese cambio
 * ocurrirá: hoy computan honestamente 0 completadas (no existe
 * ningún Attempt que contar), nunca un valor inventado u oculto. La
 * whisper bar (Design System §14.2) sigue siendo correcta con estos
 * números — un libro recién publicado, sin sesiones de estudio
 * todavía, se ve exactamente como lo que es: 0 de N.
 *
 * Cuando Sprint 4 introduzca el historial de Attempts real, solo
 * estas dos funciones cambian de implementación — ningún componente
 * de presentación que las consume necesita cambiar (mismo contrato
 * de salida: { completed, total }).
 */

export function computeUnitProgress(unit) {
  const total = unit.lessons.length;
  // Sin Attempts todavía (Sprint 4): ninguna lección puede estar
  // marcada como completada por el motor, sea cual sea su título.
  const completed = 0;
  return Object.freeze({ completed, total });
}

export function computeBookProgress(book) {
  const total = book.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const completed = 0;
  return Object.freeze({ completed, total });
}
