/**
 * app/screen-router.js
 *
 * Resuelve qué screen se monta en el content-region según la
 * Navigation State publicada por el router (route:changed). Junto a
 * app-shell.js y bootstrap.js, es de los pocos módulos que conocen
 * varias capas a la vez (Sprint 1 Plan §6) — content-repository
 * (Domain), las screens (Presentation) y el router/event bus (Core)
 * — precisamente para que ninguna de esas capas tenga que conocerse
 * entre sí directamente (regla de vecinos, Software Architecture
 * §9.3).
 *
 * Alcance de Sprint 2 (Roadmap Phase 2 — Library): resuelve
 * únicamente las posiciones "library" y "book". Ninguna otra
 * posición de la jerarquía tiene screen propia todavía.
 */

import { getLibrary, getBookById } from '../domain/content/content-repository.js';
import { computeBookProgress, computeUnitProgress } from '../domain/content/progress.js';
import { createLibraryScreen } from '../presentation/screens/library/library-screen.js';
import { createBookScreen } from '../presentation/screens/book/book-screen.js';
import { createStateView } from '../presentation/components/state-views/state-views.js';
import { EVENT_NAMES } from '../core/events/event-names.js';

function buildLibraryScreen({ router }) {
  const library = getLibrary();
  const books = library.books.map((book) => ({
    id: book.id,
    title: book.title,
    progress: computeBookProgress(book),
  }));

  return createLibraryScreen({
    books,
    onSelectBook: (bookId) => router.navigateTo(`/book/${bookId}`),
  });
}

function buildBookScreen({ router, errorBoundary, bookId }) {
  const book = getBookById(bookId);

  if (!book) {
    // Un id de Book que no corresponde a ningún Book publicado no es
    // una ruta rota (la forma de la Navigation State es válida) —
    // es contenido no encontrado. Recuperable: la navegación sigue
    // funcionando, solo este contenido no existe (Software
    // Architecture §18.2).
    errorBoundary.reportRecoverable({ reason: 'book-not-found', bookId });
    return createStateView({
      kind: 'empty',
      message: 'Este libro no está disponible. Vuelve a la Library para elegir otro.',
    });
  }

  const bookWithProgress = {
    ...book,
    progress: computeBookProgress(book),
    units: book.units.map((unit) => ({
      ...unit,
      progress: computeUnitProgress(unit),
    })),
  };

  return createBookScreen({
    book: bookWithProgress,
    onBack: () => router.navigateTo('/library'),
    // Sin handler todavía — ver la nota en book-screen.js y en
    // route-table.js: la screen de Unit llega en Sprint 3.
    onSelectUnit: null,
  });
}

function buildHomePlaceholder() {
  return createStateView({
    kind: 'empty',
    message: 'Todavía no hay nada que continuar. Explora la Library para comenzar.',
  });
}

function resolveScreen(navigationState, deps) {
  const { bookPosition, libraryPosition } = navigationState;

  if (bookPosition) {
    return buildBookScreen({ ...deps, bookId: bookPosition });
  }

  if (libraryPosition === 'library') {
    return buildLibraryScreen(deps);
  }

  return buildHomePlaceholder();
}

export function mountScreenRouter({ eventBus, contentRegion, router, errorBoundary }) {
  function handleRouteChanged(navigationState) {
    const screen = resolveScreen(navigationState, { router, errorBoundary });
    contentRegion.render(screen);
  }

  const unsubscribe = eventBus.subscribe(EVENT_NAMES.ROUTE_CHANGED, handleRouteChanged);

  return Object.freeze({ unsubscribe });
}
