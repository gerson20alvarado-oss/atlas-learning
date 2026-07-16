/**
 * core/events/event-names.js
 *
 * Vocabulario de eventos "core" de Sprint 1 (Sprint 1 Plan §11.2).
 * Son deliberadamente solo estos cuatro. Eventos de dominio
 * (session:*, sync:*, auth:*) se añaden en los sprints que
 * introducen esas capas — no se pre-declaran vacíos aquí.
 */

export const EVENT_NAMES = Object.freeze({
  ROUTE_CHANGED: 'route:changed',
  APP_READY: 'app:ready',
  ERROR_RECOVERABLE: 'error:recoverable',
  ERROR_MUST_SURFACE: 'error:must-surface',
});
