/**
 * app/screen-router.js
 *
 * Resuelve qué screen se monta en el content-region según la
 * Navigation State publicada por el router (route:changed). Junto a
 * app-shell.js y bootstrap.js, es de los pocos módulos que conocen
 * varias capas a la vez (Sprint 1 Plan §6) — content-repository
 * (Domain), session-repository (Domain), las screens (Presentation),
 * runtimeConfig (Core/Config) y el router/event bus (Core) —
 * precisamente para que ninguna de esas capas tenga que conocerse
 * entre sí directamente (regla de vecinos, Software Architecture
 * §9.3).
 *
 * Sprint 4 (Progress, Roadmap Phase 4) añade:
 *   - Home real ("Continue Learning", Wireframe Review §2.1),
 *     construida sobre la Session persistida — reemplaza el
 *     placeholder que Sprint 2/3 usaban por no existir todavía
 *     ninguna Session que restaurar.
 *   - Restore Session en Learning Session: sectionIndex/scrollPosition
 *     persistidos vía session-repository, granular (Software
 *     Architecture §10.4) — no solo al salir.
 *   - Resolución de assets de Media contra el base path real
 *     (Software Architecture §21.2) — el único lugar que lo hace,
 *     para que presentation/components/content-blocks/media-block.js
 *     permanezca puro (no conoce runtimeConfig).
 *
 * Sin cambios de alcance en Sprint 4 para Progress numérico real: no
 * hay Attempts (Exercise Engine, Sprint 5), así que computeUnitProgress
 * / computeBookProgress / computeLessonMarkers no se tocan.
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
import { createHomeScreen } from '../presentation/screens/home/home-screen.js';
import { createStateView } from '../presentation/components/state-views/state-views.js';
import { EVENT_NAMES } from '../core/events/event-names.js';

function notFoundView({ errorBoundary, reason, context, message }) {
  errorBoundary.reportRecoverable({ reason, ...context });
  return createStateView({ kind: 'empty', message });
}

/**
 * Resuelve el src final de cada Content Block `media` contra el base
 * path real (Software Architecture §21.2), y deja todo lo demás sin
 * tocar. Es el único lugar del proyecto que conoce a la vez el
 * contenido (Domain) y runtimeConfig (Core/Config) — media-block.js
 * (Presentation) recibe siempre un `src` ya resuelto, nunca calcula
 * rutas por su cuenta (regla de vecinos, §9.3; Presentation puro).
 *
 * No muta `lesson` — devuelve una copia superficial con las
 * Sections/Content Blocks necesarias reconstruidas, consistente con
 * cómo screen-router.js ya compone `bookWithProgress` /
 * `unitWithProgress` en las funciones de arriba.
 */
function resolveLessonMediaAssets(lesson, runtimeConfig) {
  return {
    ...lesson,
    sections: lesson.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) => {
        if (block.type !== 'media' || !block.assetPath) return block;
        return { ...block, src: runtimeConfig.resolveAssetPath(block.assetPath) };
      }),
    })),
  };
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

function buildLearningSessionScreen({
  router,
  errorBoundary,
  sessionRepository,
  runtimeConfig,
  bookId,
  unitId,
  lessonId,
}) {
  const lesson = getLessonById(bookId, unitId, lessonId);

  if (!lesson) {
    return notFoundView({
      errorBoundary,
      reason: 'lesson-not-found',
      context: { bookId, unitId, lessonId },
      message: 'Esta lección no está disponible. Vuelve a la unidad para elegir otra.',
    });
  }

  const resolvedLesson = resolveLessonMediaAssets(lesson, runtimeConfig);

  // Restaura solo si la Session persistida apunta EXACTAMENTE a esta
  // Lesson — si el estudiante navegó aquí por Library/Unit hacia una
  // lección distinta a la que tenía en curso, empezar en la sección 0
  // es lo honesto (no hay nada que restaurar para ESTA lección
  // todavía); la Session se sobrescribirá con esta posición en cuanto
  // el componente monte (ver learning-session-screen.js).
  const persisted = sessionRepository.getSession();
  const matchesThisLesson =
    persisted?.bookId === bookId && persisted?.unitId === unitId && persisted?.lessonId === lessonId;

  return createLearningSessionScreen({
    lesson: resolvedLesson,
    restoreSectionIndex: matchesThisLesson ? persisted.sectionIndex ?? 0 : 0,
    restoreScrollPosition: matchesThisLesson ? persisted.scrollPosition ?? 0 : 0,
    onSectionChange: (sectionIndex) =>
      sessionRepository.saveSession({ bookId, unitId, lessonId, mode: 'learn', sectionIndex, scrollPosition: 0 }),
    onScrollChange: (scrollPosition) => sessionRepository.saveSession({ scrollPosition }),
    onExit: ({ reason }) => {
      if (reason === 'finished') {
        // Sin Attempts/Progress real todavía (Sprint 5): terminar de
        // leer una Lesson no es "completarla" en el sentido de
        // Progress (Software Architecture §15.2). Pero, desde la
        // óptica de Restore Session, no queda un punto intermedio
        // honesto al que volver — se limpia la Session para que Home
        // vuelva a su estado vacío en vez de apuntar a una lección ya
        // leída por completo (Sprint 4 Plan, decisión de diseño
        // documentada en el resumen técnico del sprint).
        sessionRepository.clearSession();
      }
      router.navigateTo('/');
    },
  });
}

function buildHomeScreen({ router, sessionRepository }) {
  const session = sessionRepository.getSession();

  if (session?.bookId && session.unitId && session.lessonId) {
    const book = getBookById(session.bookId);
    const lesson = getLessonById(session.bookId, session.unitId, session.lessonId);

    if (book && lesson) {
      return createHomeScreen({
        bookTitle: book.title,
        lessonTitle: lesson.title,
        onContinue: () =>
          router.navigateTo(
            `/book/${session.bookId}/unit/${session.unitId}/lesson/${session.lessonId}/learn`,
          ),
      });
    }
    // La Session apunta a contenido que ya no existe o no es válido
    // (p. ej. el Content Import Pipeline republicó el libro sin esa
    // Lesson). Degradar al estado vacío, igual que content-repository
    // degrada un Book inválido a null — nunca fingir un "Continue"
    // hacia algo que ya no está.
  }

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

  return buildHomeScreen(deps);
}

export function mountScreenRouter({
  eventBus,
  contentRegion,
  router,
  errorBoundary,
  sessionRepository,
  runtimeConfig,
}) {
  function handleRouteChanged(navigationState) {
    const screen = resolveScreen(navigationState, {
      router,
      errorBoundary,
      sessionRepository,
      runtimeConfig,
    });
    contentRegion.render(screen);
  }

  const unsubscribe = eventBus.subscribe(EVENT_NAMES.ROUTE_CHANGED, handleRouteChanged);

  return Object.freeze({ unsubscribe });
}
