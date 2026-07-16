/**
 * app/screen-router.js
 *
 * Resuelve qué screen se monta en el content-region según la
 * Navigation State publicada por el router. Junto a app-shell.js y
 * bootstrap.js, es de los pocos módulos que conocen varias capas a
 * la vez (Sprint 1 Plan §6) — precisamente para que ninguna de esas
 * capas tenga que conocerse entre sí (regla de vecinos, Software
 * Architecture §9.3).
 *
 * Sprint 5 (Exercise Engine) añade:
 *   - Resolución de Exercise/Attempt para cada bloque `practice`
 *     (análoga a la resolución de assets de Media de Sprint 4): el
 *     Exercise Engine (domain/exercise/exercise-evaluator.js) nunca
 *     conoce Session ni Router (Sprint 5 Plan, regla explícita) — es
 *     este módulo el que compone evaluación + registro de Attempt en
 *     un único callback `onCheck` inyectado en cada bloque, antes de
 *     que la Session container exista siquiera.
 *   - Progress real: computeBookProgress/computeUnitProgress/
 *     computeLessonMarkers ahora reciben attemptRepository.
 *
 * Sin cambios en la resolución de Media (Sprint 4) ni en Restore
 * Session de sección/scroll — Sprint 5 no toca esa parte.
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
import { getExerciseById } from '../domain/exercise/exercise-repository.js';
import { evaluateExercise } from '../domain/exercise/exercise-evaluator.js';
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
 * path real (Software Architecture §21.2) — sin cambios desde
 * Sprint 4.
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

/**
 * Resuelve, para cada Content Block `practice`, su Exercise (o `null`
 * si es una actividad abierta, dependiente de audio real, o un tipo
 * aún no soportado — domain/content/exercise-catalog.js), su
 * `priorAttempt` (Sprint 5 Plan, decisión #5: solo se restaura en
 * estado "ya respondido" cuando el último Attempt fue CORRECTO —
 * uno incorrecto no bloquea un reintento genuino al reabrir la
 * Lesson; Design System §17.3 ya exige que, DENTRO de una misma
 * instancia, todas las opciones queden deshabilitadas tras responder,
 * sea cual sea el resultado, así que el reintento real ocurre al
 * volver a entrar, nunca dentro de la misma sesión de pantalla), y
 * `onCheck` — el único puente entre Presentation y el evaluador puro
 * del Exercise Engine + el registro de Attempt.
 *
 * El evaluador (domain/exercise/exercise-evaluator.js) y el registro
 * de Attempt (domain/learning-data/attempt-repository.js) se
 * componen AQUÍ, nunca dentro de practice-block.js ni de
 * learning-session-screen.js — ninguno de los dos conoce Session,
 * Router ni Persistence (Sprint 5 Plan, regla explícita).
 */
function resolveLessonExercises(lesson, attemptRepository) {
  return {
    ...lesson,
    sections: lesson.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) => {
        if (block.type !== 'practice') return block;

        const exercise = getExerciseById(block.exerciseId);
        if (!exercise) return { ...block, exercise: null, priorAttempt: null, onCheck: null };

        const latestAttempt = attemptRepository.getLatestAttempt(lesson.id, block.exerciseId);
        const priorAttempt = latestAttempt?.isCorrect ? latestAttempt : null;

        const onCheck = (response) => {
          const result = evaluateExercise(exercise, response);
          attemptRepository.recordAttempt({
            exerciseId: block.exerciseId,
            lessonId: lesson.id,
            response,
            isCorrect: result.isCorrect,
          });
          return result;
        };

        return { ...block, exercise, priorAttempt, onCheck };
      }),
    })),
  };
}

function buildLibraryScreen({ router, attemptRepository }) {
  const library = getLibrary();
  const books = library.books.map((book) => ({
    id: book.id,
    title: book.title,
    progress: computeBookProgress(book, attemptRepository),
  }));

  return createLibraryScreen({
    books,
    onSelectBook: (bookId) => router.navigateTo(`/book/${bookId}`),
  });
}

function buildBookScreen({ router, errorBoundary, attemptRepository, bookId }) {
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
    progress: computeBookProgress(book, attemptRepository),
    units: book.units.map((unit) => ({
      ...unit,
      progress: computeUnitProgress(unit, attemptRepository),
    })),
  };

  return createBookScreen({
    book: bookWithProgress,
    onBack: () => router.navigateTo('/library'),
    onSelectUnit: (unitId) => router.navigateTo(`/book/${bookId}/unit/${unitId}`),
  });
}

function buildUnitScreen({ router, errorBoundary, attemptRepository, bookId, unitId }) {
  const unit = getUnitById(bookId, unitId);

  if (!unit) {
    return notFoundView({
      errorBoundary,
      reason: 'unit-not-found',
      context: { bookId, unitId },
      message: 'Esta unidad no está disponible. Vuelve al libro para elegir otra.',
    });
  }

  const markers = computeLessonMarkers(unit.lessons, attemptRepository);
  const unitWithProgress = {
    ...unit,
    progress: computeUnitProgress(unit, attemptRepository),
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
  attemptRepository,
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

  const withMedia = resolveLessonMediaAssets(lesson, runtimeConfig);
  const resolvedLesson = resolveLessonExercises(withMedia, attemptRepository);

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
  attemptRepository,
  runtimeConfig,
}) {
  function handleRouteChanged(navigationState) {
    const screen = resolveScreen(navigationState, {
      router,
      errorBoundary,
      sessionRepository,
      attemptRepository,
      runtimeConfig,
    });
    contentRegion.render(screen);
  }

  const unsubscribe = eventBus.subscribe(EVENT_NAMES.ROUTE_CHANGED, handleRouteChanged);

  return Object.freeze({ unsubscribe });
}
