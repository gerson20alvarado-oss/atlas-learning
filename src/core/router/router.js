/**
 * core/router/router.js
 *
 * Traduce hash ↔ Navigation State, expone la ruta resuelta y permite
 * navegación programática. No conoce contenido de libros — solo la
 * forma de la jerarquía (regla de vecinos, Software Architecture
 * §9.3).
 *
 * Decisión de implementación (Sprint 1 Plan §8.2, ya aprobada):
 * routing basado en hash. GitHub Pages no resuelve paths arbitrarios
 * del lado servidor (Software Architecture C1/C2/§21.2), y un
 * refresh a un path "limpio" devolvería 404 real; el hash siempre
 * resuelve contra index.html.
 *
 * Contrato (Sprint 1 Plan §8.4): expone la Navigation State actual y
 * un método de navegación programática. Los cambios se comunican
 * exclusivamente por el event bus (ROUTE_CHANGED) — nunca por
 * callbacks directos cross-capa.
 */

import { matchRoute } from './route-table.js';
import { createEmptyNavigationState, isValidNavigationState } from './navigation-state.js';
import { EVENT_NAMES } from '../events/event-names.js';

function readCurrentHashPath() {
  // location.hash incluye el "#" inicial; se normaliza a un path
  // que siempre empieza con "/".
  const raw = window.location.hash.replace(/^#/, '');
  return raw === '' ? '/' : raw;
}

export function createRouter(eventBus, errorBoundary) {
  let currentState = createEmptyNavigationState();

  function resolve(path) {
    const matched = matchRoute(path);

    if (matched === null || !isValidNavigationState(matched)) {
      // Ninguna ruta conocida matcheó, o la tabla produjo una forma
      // inválida. En Sprint 1 no hay sesión activa que interrumpir,
      // así que se degrada al estado vacío y se registra como
      // recuperable (Software Architecture §18.2) en vez de romper
      // la navegación.
      errorBoundary.reportRecoverable({ reason: 'unmatched-route', path });
      currentState = createEmptyNavigationState();
    } else {
      currentState = Object.freeze({ ...matched });
    }

    eventBus.publish(EVENT_NAMES.ROUTE_CHANGED, currentState);
    return currentState;
  }

  function start() {
    resolve(readCurrentHashPath());
    window.addEventListener('hashchange', () => {
      resolve(readCurrentHashPath());
    });
  }

  function getNavigationState() {
    return currentState;
  }

  function navigateTo(path) {
    // Escribir el hash dispara "hashchange", que llama a resolve():
    // un único camino de resolución, nunca dos rutas de código
    // distintas para "navegación inicial" vs. "navegación programática".
    window.location.hash = path.startsWith('/') ? path : `/${path}`;
  }

  return Object.freeze({ start, getNavigationState, navigateTo });
}
