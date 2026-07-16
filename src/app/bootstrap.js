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
 *
 * Sprint 6 (Authentication) añade Auth y la vinculación de cuenta
 * ANTES del paso (c) — no porque bloqueen el arranque técnico, sino
 * porque screen-router.js (paso e) los necesita para decidir, en su
 * primer render, si el estudiante ve Entry/Login o el resto de la
 * app. Ninguna otra capa (Domain, Presentation) importa nada de
 * `auth/` ni de `remote-account-snapshot/` — solo bootstrap.js y
 * screen-router.js los conocen, igual que ya ocurre con Persistence.
 */

import { createRuntimeConfig } from '../config/runtime-config.js';
import { createEventBus } from '../core/events/event-bus.js';
import { EVENT_NAMES } from '../core/events/event-names.js';
import { createErrorBoundary } from '../core/errors/error-boundary.js';
import { createRouter } from '../core/router/router.js';
import { createStorageContract } from '../persistence/storage-contract.js';
import { createLocalStorageAdapter } from '../persistence/adapters/local-storage-adapter.js';
import { createSessionRepository } from '../domain/session/session-repository.js';
import { createAttemptRepository } from '../domain/learning-data/attempt-repository.js';
import { createAuthContract } from '../auth/auth-contract.js';
import { createSupabaseAuthAdapter } from '../auth/adapters/supabase-auth-adapter.js';
import { createAccountSnapshotService } from '../remote-account-snapshot/account-snapshot-contract.js';
import { createSupabaseAccountSnapshotAdapter } from '../remote-account-snapshot/adapters/supabase-account-snapshot-adapter.js';
import { createAccountLinkingFlow } from './account-linking/account-linking-flow.js';
import { mountAppShell } from './app-shell.js';
import { mountScreenRouter } from './screen-router.js';

function bootstrap() {
  // a. Config pública — resuelve base path para GitHub Pages.
  const runtimeConfig = createRuntimeConfig();

  // b. Event bus — todo lo demás lo consume por inyección, nunca
  //    como singleton global importado directamente.
  const eventBus = createEventBus();
  const errorBoundary = createErrorBoundary(eventBus);

  // Persistence: el contrato queda listo desde Sprint 1. Sprint 4
  // añadió la Session; Sprint 5 (Exercise Engine) añade Attempts —
  // el historial append-only del que Progress (real, por fin) y
  // Error Record (vista derivada, nunca almacenada aparte) dependen.
  const storageAdapter = createLocalStorageAdapter();
  const storage = createStorageContract(storageAdapter, errorBoundary);
  const sessionRepository = createSessionRepository(storage);
  const attemptRepository = createAttemptRepository(storage);

  // Sprint 6 (Authentication): capa desacoplada del proveedor —
  // Supabase es la primera (y hoy única) implementación real del
  // contrato de auth. Sustituir el proveedor en el futuro se limita
  // a construir un adapter distinto aquí; auth-contract.js, el resto
  // de app/ y toda otra capa permanecen sin cambios.
  const supabaseAuthAdapter = createSupabaseAuthAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
    supabaseAnonKey: runtimeConfig.env.supabaseAnonKey,
  });
  const authContract = createAuthContract({ adapter: supabaseAuthAdapter, storage, errorBoundary });

  // Capacidad remota MÍNIMA (Sprint 6 Plan, Opción A) — solo lo que
  // el flujo de vinculación de cuenta necesita para leer/escribir el
  // snapshot de una cuenta una sola vez. Deliberadamente no es la
  // capa de Sync (todavía sin diseñar); vive fuera de app/ porque es
  // infraestructura, no un flujo de aplicación.
  const supabaseSnapshotAdapter = createSupabaseAccountSnapshotAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
    supabaseAnonKey: runtimeConfig.env.supabaseAnonKey,
  });
  const accountSnapshotService = createAccountSnapshotService(supabaseSnapshotAdapter, errorBoundary);

  const accountLinkingFlow = createAccountLinkingFlow({
    sessionRepository,
    attemptRepository,
    accountSnapshotService,
  });

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
    attemptRepository,
    runtimeConfig,
    authContract,
    accountLinkingFlow,
  });

  // f. El router resuelve la ruta inicial y publica route:changed.
  router.start();

  // g. Aplicación arrancada e interactiva.
  eventBus.publish(EVENT_NAMES.APP_READY, { basePath: runtimeConfig.basePath });

  // Expuesto solo para verificación manual en Sprint 1 (§7 del plan:
  // "validación manual del flujo de arranque"), nunca para que otro
  // módulo del proyecto dependa de un global.
  window.__atlasLearning = Object.freeze({
    router,
    eventBus,
    storage,
    sessionRepository,
    attemptRepository,
    authContract,
  });
}

bootstrap();
