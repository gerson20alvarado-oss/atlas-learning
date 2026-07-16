/**
 * app/app-shell.js
 *
 * Composición del App Shell real: conecta el componente puro de
 * presentation/components/app-shell con el router y el event bus.
 * Junto a bootstrap.js y screen-router.js, es de los pocos módulos
 * que conocen varias capas a la vez (Sprint 1 Plan §6) —
 * presentation/components/ permanece agnóstico de router y event
 * bus.
 *
 * Sprint 2: la Library ya existe, así que el nav-secondary
 * (Wireframe Review §2.1 — "Library / Review / Settings as
 * equal-weight plain-text secondary row") deja de instanciarse
 * vacío. Solo se añade "Library" — Review y Settings todavía no
 * tienen screen propia (llegan en Sprints 5 y 6), y un ítem de
 * navegación sin destino real sería peor que no tenerlo (mismo
 * criterio aplicado a la fila de Unit en book-screen.js).
 */

import { createAppShell as createAppShellComponent } from '../presentation/components/app-shell/app-shell.js';
import { createContentRegion } from '../presentation/components/content-region/content-region.js';
import { createSecondaryNav } from '../presentation/components/nav-secondary/nav-secondary.js';
import { EVENT_NAMES } from '../core/events/event-names.js';

export function mountAppShell({ eventBus, mountElement, router }) {
  const secondaryNav = createSecondaryNav([
    { label: 'Library', onSelect: () => router.navigateTo('/library') },
  ]);
  const contentRegion = createContentRegion();

  const shell = createAppShellComponent({
    secondaryNavElement: secondaryNav.element,
    contentRegionElement: contentRegion.element,
  });

  mountElement.appendChild(shell.element);

  // El contenido real de content-region lo decide screen-router.js a
  // partir de route:changed — este módulo ya no renderiza un
  // placeholder propio (Sprint 1 lo hacía porque no existía ninguna
  // screen; Sprint 2 resuelve una screen real, incluida la de Home,
  // para toda Navigation State posible — ver screen-router.js).

  // Reacciona a cambios de navegación exclusivamente vía el event
  // bus — nunca llamando al router directamente desde Presentation
  // (regla de vecinos, Software Architecture §9.3).
  eventBus.subscribe(EVENT_NAMES.ROUTE_CHANGED, (navigationState) => {
    shell.update(navigationState);
  });

  return Object.freeze({ shell, secondaryNav, contentRegion });
}
