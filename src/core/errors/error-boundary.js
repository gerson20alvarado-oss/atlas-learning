/**
 * core/errors/error-boundary.js
 *
 * Implementa el mecanismo de clasificación de errores de Software
 * Architecture §18.2 — CUÁNDO se comunica un error, no CON QUÉ texto
 * (el copy es Design System / voz de producto, fuera de alcance de
 * Sprint 1 — ver Sprint 1 Plan §6).
 *
 * No decide UX; solo clasifica y publica en el event bus para que
 * Presentation reaccione. Recibe el event bus por inyección — nunca
 * importa un singleton global (regla de vecinos, composición real
 * solo en app/bootstrap.js).
 */

import { EVENT_NAMES } from '../events/event-names.js';

export function createErrorBoundary(eventBus) {
  function reportRecoverable(context) {
    // Silencioso/recuperable (§18.2): se registra y nunca interrumpe
    // una sesión activa. En Sprint 1 no hay sesión activa todavía —
    // el evento existe para que Sync/Auth (sprints futuros) lo usen.
    console.warn('[error-boundary] recoverable', context);
    eventBus.publish(EVENT_NAMES.ERROR_RECOVERABLE, context);
  }

  function reportMustSurface(context) {
    // Debe comunicarse, pero solo en el próximo límite natural de
    // sesión/pantalla (§18.2) — este módulo solo clasifica; quien
    // consuma el evento decide cuándo y cómo se muestra.
    console.error('[error-boundary] must-surface', context);
    eventBus.publish(EVENT_NAMES.ERROR_MUST_SURFACE, context);
  }

  return Object.freeze({ reportRecoverable, reportMustSurface });
}
