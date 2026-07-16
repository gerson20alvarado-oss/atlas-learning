/**
 * app/app-shell.js
 *
 * Composición del App Shell real: conecta el componente puro de
 * presentation/components/app-shell con el router y el event bus.
 * Junto a bootstrap.js, es de los pocos módulos que conocen varias
 * capas a la vez (Sprint 1 Plan §6) — presentation/components/
 * permanece agnóstico de router y event bus.
 */

import { createAppShell as createAppShellComponent } from '../presentation/components/app-shell/app-shell.js';
import { createContentRegion } from '../presentation/components/content-region/content-region.js';
import { createSecondaryNav } from '../presentation/components/nav-secondary/nav-secondary.js';
import { createStateView } from '../presentation/components/state-views/state-views.js';
import { EVENT_NAMES } from '../core/events/event-names.js';

export function mountAppShell({ eventBus, mountElement }) {
  // Sprint 1 no tiene screens de destino todavía (Library llega en
  // Sprint 2) — se instancia sin items, no con items "falsos".
  const secondaryNav = createSecondaryNav([]);
  const contentRegion = createContentRegion();

  const shell = createAppShellComponent({
    secondaryNavElement: secondaryNav.element,
    contentRegionElement: contentRegion.element,
  });

  mountElement.appendChild(shell.element);

  // Sin screens de dominio reales, el content region muestra un
  // estado "empty" neutral — la Exit Criteria del Roadmap es "la app
  // arranca", no "hay contenido de negocio" (Roadmap, Phase 1).
  const placeholder = createStateView({
    kind: 'empty',
    message: 'Atlas Learning — Foundation lista. Sprint 2 añade la Library.',
  });
  contentRegion.render(placeholder);

  // Reacciona a cambios de navegación exclusivamente vía el event
  // bus — nunca llamando al router directamente desde Presentation
  // (regla de vecinos, Software Architecture §9.3).
  eventBus.subscribe(EVENT_NAMES.ROUTE_CHANGED, (navigationState) => {
    shell.update(navigationState);
  });

  return Object.freeze({ shell, secondaryNav, contentRegion });
}
