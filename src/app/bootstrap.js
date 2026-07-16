/**
 * app/bootstrap.js
 *
 * Secuencia de arranque de Atlas Learning (Sprint 1 Plan §7). Es el
 * único módulo del proyecto que importa de todas las capas a la vez
 * — ningún otro módulo debería necesitar hacerlo (regla de vecinos,
 * Software Architecture §9.3).
 *
 * Pasos (Sprint 1 Plan §7, extendido en Sprint 2):
 *   a. Config pública
 *   b. Event bus
 *   c. Router (inicializado, sin resolver ruta todavía)
 *   d. Monta el app shell
 *   e. Monta screen-router (Sprint 2) — resuelve qué screen renderiza
 *      cada route:changed; ambas suscripciones (shell y screen
 *      router) deben existir antes del paso (f)
 *   f. El router resuelve la ruta inicial → publica route:changed
 *   g. Aplicación arrancada e interactiva → Exit Criteria cumplida
 */

import { createRuntimeConfig } from '../config/runtime-config.js';
import { createEventBus } from '../core/events/event-bus.js';
import { EVENT_NAMES } from '../core/events/event-names.js';
import { createErrorBoundary } from '../core/errors/error-boundary.js';
import { createRouter } from '../core/router/router.js';
import { createStorageContract } from '../persistence/storage-contract.js';
import { createLocalStorageAdapter } from '../persistence/adapters/local-storage-adapter.js';
import { createSessionRepository } from '../domain/session/session-repository.js';
import { mountAppShell } from './app-shell.js';
import { mountScreenRouter } from './screen-router.js';

function bootstrap() {
  // a. Config pública — resuelve base path para GitHub Pages.
  const runtimeConfig = createRuntimeConfig();

  // b. Event bus — todo lo demás lo consume por inyección, nunca
  //    como singleton global importado directamente.
  const eventBus = createEventBus();
  const errorBoundary = createErrorBoundary(eventBus);

  // Persistence: el contrato queda listo y consumible desde Sprint 1
  // (Sprint 1 Plan §12). Sprint 4 (Progress, Roadmap Phase 4) es el
  // primer sprint que persiste un dato de dominio real a través de
  // él: la Session (ver domain/session/session-repository.js).
  const storageAdapter = createLocalStorageAdapter();
  const storage = createStorageContract(storageAdapter, errorBoundary);
  const sessionRepository = createSessionRepository(storage);

  // c. Router — inicializado pero sin resolver ninguna ruta todavía;
  //    eso ocurre explícitamente en el paso (f).
  const router = createRouter(eventBus, errorBoundary);

  // d. Monta el app shell en el punto de montaje del DOM.
  const mountElement = document.getElementById('app-root');
  if (!mountElement) {
    // No hay dónde montar nada: esto sí engañaría al estudiante si
    // se ignorara (Software Architecture §18.2, caso "must-surface
    // inmediato"), aunque en Sprint 1 solo llegue a la consola.
    errorBoundary.reportMustSurface({ reason: 'missing-mount-point' });
    return;
  }

  const { contentRegion } = mountAppShell({ eventBus, mountElement, router });

  // Sprint 2: resuelve qué screen se monta en contentRegion según
  // route:changed (Library, Book, o el placeholder de Home). Se
  // suscribe antes de router.start() para no perderse la resolución
  // de la ruta inicial (mismo orden que la suscripción de
  // mountAppShell arriba). Sprint 4 añade sessionRepository (Restore
  // Session, Home real) y runtimeConfig (resolución de assets de
  // Media, §21.2) a sus dependencias.
  mountScreenRouter({
    eventBus,
    contentRegion,
    router,
    errorBoundary,
    sessionRepository,
    runtimeConfig,
  });

  // f. El router resuelve la ruta inicial y publica route:changed.
  router.start();

  // g. Aplicación arrancada e interactiva.
  eventBus.publish(EVENT_NAMES.APP_READY, { basePath: runtimeConfig.basePath });

  // Expuesto solo para verificación manual en Sprint 1 (§7 del plan:
  // "validación manual del flujo de arranque"), nunca para que otro
  // módulo del proyecto dependa de un global.
  window.__atlasLearning = Object.freeze({ router, eventBus, storage, sessionRepository });
}

bootstrap();
