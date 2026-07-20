/**
 * app/app-shell.js
 *
 * Composición del App Shell real: conecta el componente puro de
 * presentation/components/app-shell con el router, el event bus y
 * (desde Objetivo E, Sprint 7) el estado de autenticación. Junto a
 * bootstrap.js y screen-router.js, es de los pocos módulos que
 * conocen varias capas a la vez (Sprint 1 Plan §6) —
 * presentation/components/ permanece agnóstico de router, event bus
 * y auth.
 *
 * Sprint 2: la Library ya existe, así que el nav-secondary
 * (Wireframe Review §2.1 — "Library / Review / Settings as
 * equal-weight plain-text secondary row") deja de instanciarse
 * vacío. Solo se añade "Library" — Review y Settings todavía no
 * tienen screen propia, y un ítem de navegación sin destino real
 * sería peor que no tenerlo (mismo criterio aplicado a la fila de
 * Unit en book-screen.js).
 *
 * Objetivo E (Sprint 7, §3.6, §11.5.7): "Sign out" se añade como
 * segundo ítem de este mismo nav-secondary — no una pantalla de
 * Settings nueva. Es, en la práctica, la única pieza de esa Settings
 * futura que hace falta hoy; cuando Settings exista, este es el
 * lugar natural para migrar la acción, no antes. La confirmación de
 * una sola pregunta (Wireframe Review §5) vive en
 * sign-out-confirm.js — un componente mínimo, acotado a este único
 * propósito, no un sistema de diálogos genérico.
 *
 * Objetivo E (Sprint 7, §11.4.1): el header entero (wordmark-firma +
 * este nav-secondary) solo se muestra con sesión válida — reutiliza
 * exactamente el mismo mecanismo (`authContract.onAuthStateChange`)
 * que screen-router.js ya usa para reaccionar a cambios de sesión,
 * sin introducir ningún contrato nuevo.
 *
 * Admin Console (Sprint 14): mismo mecanismo, un tercer uso —
 * `profileRepository.isAdmin()` decide si el ítem "Admin" aparece en
 * este nav-secondary. `profileRepository` se añade aquí como
 * dependencia nueva (antes este módulo solo conocía `authContract`)
 * exclusivamente para esa pregunta; no para nada más de perfil.
 */

import { createAppShell as createAppShellComponent } from '../presentation/components/app-shell/app-shell.js';
import { createContentRegion } from '../presentation/components/content-region/content-region.js';
import { createSecondaryNav } from '../presentation/components/nav-secondary/nav-secondary.js';
import { createSignOutConfirm } from '../presentation/components/sign-out-confirm/sign-out-confirm.js';
import { EVENT_NAMES } from '../core/events/event-names.js';

export function mountAppShell({ eventBus, mountElement, router, authContract, profileRepository }) {
  let signOutConfirm = null;

  function closeSignOutConfirm() {
    signOutConfirm?.destroy();
    signOutConfirm = null;
  }

  function openSignOutConfirm() {
    if (signOutConfirm) return; // ya abierto — evita duplicar el overlay
    signOutConfirm = createSignOutConfirm({
      onCancel: closeSignOutConfirm,
      onConfirm: async () => {
        closeSignOutConfirm();
        await authContract.signOut();
      },
    });
    mountElement.appendChild(signOutConfirm.element);
  }

  // Admin Console (Sprint 14): los dos ítems de siempre, sin
  // ningún cambio para el estudiante — "Admin" se añade
  // condicionalmente más abajo, nunca reemplazando estos dos.
  const baseNavItems = [
    { label: 'Library', onSelect: () => router.navigateTo('/library') },
    { label: 'Sign out', onSelect: openSignOutConfirm },
  ];

  const secondaryNav = createSecondaryNav(baseNavItems);
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

  // Visibilidad del header (Objetivo E): estado inicial resuelto de
  // inmediato con la sesión ya cacheada (estudiante que vuelve, sin
  // esperar ningún evento), y sincronizado después con cada cambio
  // real de sesión (login, logout, o una sesión que expira).
  shell.update({ authenticated: Boolean(authContract.getSession()) });
  authContract.onAuthStateChange((authSession) => {
    shell.update({ authenticated: Boolean(authSession) });
  });

  // Admin Console (Sprint 14): resolución independiente de
  // isAdmin, deliberadamente separada de la de screen-router.js —
  // mismo criterio ya establecido arriba para `authenticated` (dos
  // suscripciones propias a onAuthStateChange, cada una resolviendo
  // solo lo que su propio componente necesita, en vez de acoplar
  // app-shell a los internos de screen-router). Conservador por
  // defecto: sin sesión, o mientras resuelve, el ítem "Admin" no
  // aparece — nunca un parpadeo hacia "sí aparece y luego se
  // esconde".
  async function refreshAdminNavItem(authSession) {
    if (!authSession) {
      secondaryNav.update(baseNavItems);
      return;
    }
    const isAdmin = await profileRepository.isAdmin({
      userId: authSession.userId,
      accessToken: authSession.accessToken,
    });
    secondaryNav.update(
      isAdmin
        ? [...baseNavItems, { label: 'Admin', onSelect: () => router.navigateTo('/admin') }]
        : baseNavItems,
    );
  }

  refreshAdminNavItem(authContract.getSession());
  authContract.onAuthStateChange(refreshAdminNavItem);

  return Object.freeze({ shell, secondaryNav, contentRegion });
}
