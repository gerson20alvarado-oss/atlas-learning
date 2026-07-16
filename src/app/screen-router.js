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
 * Sprint 3 (Roadmap Phase 3 — Reader) resuelve las posiciones "unit",
 * "lesson" (entry) y "lesson + mode=learn" (Learning Session), además
 * de las de Sprint 2. El Book screen ahora recibe un onSelectUnit
 * real — el punto de extensión que book-screen.js ya dejó listo
 * desde Sprint 2.
 */

import {
  getLibrary,
  getBookById,
  getUnitById,
  getLessonById,
} from '../domain/content/content-repository.js';
import {
  computeBookProgress,
  computeUnitProgress,
  computeLessonMarkers,
} from '../domain/content/progress.js';
import { createLibraryScreen } from '../presentation/screens/library/library-screen.js';
import { createBookScreen } from '../presentation/screens/book/book-screen.js';
import { createUnitScreen } from '../presentation/screens/unit/unit-screen.js';
import { createLessonEntryScreen } from '../presentation/screens/lesson-entry/lesson-entry-screen.js';
import { createLearningSessionScreen } from '../presentation/screens/learning-session/learning-session-screen.js';
import { createStateView } from '../presentation/components/state-views/state-views.js';
import { EVENT_NAMES } from '../core/events/event-names.js';

function notFoundView({ errorBoundary, reason, context, message }) {
  errorBoundary.reportRecoverable({ reason, ...context });
  return createStateView({ kind: 'empty', message });
}

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
    return notFoundView({
      errorBoundary,
      reason: 'book-not-found',
      context: { bookId },
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
    onSelectUnit: (unitId) => router.navigateTo(`/book/${bookId}/unit/${unitId}`),
  });
}

function buildUnitScreen({ router, errorBoundary, bookId, unitId }) {
  const unit = getUnitById(bookId, unitId);

  if (!unit) {
    return notFoundView({
      errorBoundary,
      reason: 'unit-not-found',
      context: { bookId, unitId },
      message: 'Esta unidad no está disponible. Vuelve al libro para elegir otra.',
    });
  }

  const markers = computeLessonMarkers(unit.lessons);
  const unitWithProgress = {
    ...unit,
    progress: computeUnitProgress(unit),
    lessons: unit.lessons.map((lesson, index) => ({
      ...lesson,
      marker: markers[index].marker,
    })),
  };

  return createUnitScreen({
    unit: unitWithProgress,
    onBack: () => router.navigateTo(`/book/${bookId}`),
    onSelectLesson: (lessonId) =>
      router.navigateTo(`/book/${bookId}/unit/${unitId}/lesson/${lessonId}`),
  });
}

function buildLessonEntryScreen({ router, errorBoundary, bookId, unitId, lessonId }) {
  const lesson = getLessonById(bookId, unitId, lessonId);

  if (!lesson) {
    return notFoundView({
      errorBoundary,
      reason: 'lesson-not-found',
      context: { bookId, unitId, lessonId },
      message: 'Esta lección no está disponible. Vuelve a la unidad para elegir otra.',
    });
  }

  return createLessonEntryScreen({
    lesson,
    onBack: () => router.navigateTo(`/book/${bookId}/unit/${unitId}`),
    onBegin: () => router.navigateTo(`/book/${bookId}/unit/${unitId}/lesson/${lessonId}/learn`),
  });
}

function buildLearningSessionScreen({ router, errorBoundary, bookId, unitId, lessonId }) {
  const lesson = getLessonById(bookId, unitId, lessonId);

  if (!lesson) {
    return notFoundView({
      errorBoundary,
      reason: 'lesson-not-found',
      context: { bookId, unitId, lessonId },
      message: 'Esta lección no está disponible. Vuelve a la unidad para elegir otra.',
    });
  }

  return createLearningSessionScreen({
    lesson,
    // Sprint 3: sin Session persistida (Sprint 4) — salir (o
    // terminar la última sección) navega directo a Home, sin
    // "guardar silenciosamente" todavía (Design System §15.3).
    onExit: () => router.navigateTo('/'),
  });
}

function buildHomePlaceholder() {
  return createStateView({
    kind: 'empty',
    message: 'Todavía no hay nada que continuar. Explora la Library para comenzar.',
  });
}

function resolveScreen(navigationState, deps) {
  const { bookPosition, unitPosition, lessonPosition, mode, libraryPosition } = navigationState;

  if (bookPosition && unitPosition && lessonPosition && mode === 'learn') {
    return buildLearningSessionScreen({
      ...deps,
      bookId: bookPosition,
      unitId: unitPosition,
      lessonId: lessonPosition,
    });
  }

  if (bookPosition && unitPosition && lessonPosition) {
    return buildLessonEntryScreen({
      ...deps,
      bookId: bookPosition,
      unitId: unitPosition,
      lessonId: lessonPosition,
    });
  }

  if (bookPosition && unitPosition) {
    return buildUnitScreen({ ...deps, bookId: bookPosition, unitId: unitPosition });
  }

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
