/**
 * app/screen-router.js
 *
 * Resuelve qué screen se monta en el content-region. Junto a
 * app-shell.js y bootstrap.js, es de los pocos módulos que conocen
 * varias capas a la vez (Sprint 1 Plan §6) — precisamente para que
 * ninguna de esas capas tenga que conocerse entre sí (regla de
 * vecinos, Software Architecture §9.3).
 *
 * Sprint 6 (Authentication) añade el primer chequeo de la función de
 * resolución: si no hay una AuthSession válida, se ignora por
 * completo la Navigation State derivada de la URL y se muestra
 * Entry/Login (Wireframe Review §2.11–2.12) — el modelo de cuentas
 * provisionadas (Decision Log Entry 001) no tiene registro, así que
 * solo existen estas dos pantallas antes de autenticarse. Entry/
 * Login NO son rutas de hash — son un estado transitorio de UI
 * (`authUiStage`), porque no forman parte de la jerarquía de
 * contenido que Navigation State modela (Software Architecture
 * §16.2) y no hay necesidad real de deep-linking a ellas en un
 * modelo sin registro.
 *
 * Justo después de un login exitoso, si el flujo de vinculación de
 * cuenta (app/account-linking/) encuentra el Caso 3 (datos locales Y
 * remotos), se muestra su pantalla de confirmación ANTES que
 * cualquier otra cosa — ninguna Section, ninguna Session, ningún
 * Home se renderiza hasta que esa decisión se resuelva.
 *
 * Todo Attempt y Session que se crea desde este módulo en adelante
 * lleva el `userId` de la sesión de Auth activa (o `null` si por
 * algún motivo no hay ninguna, defensivo) — así ningún dato nuevo
 * nace huérfano una vez que Authentication existe.
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
import { createEntryScreen } from '../presentation/screens/entry/entry-screen.js';
import { createLoginScreen } from '../presentation/screens/login/login-screen.js';
import { createLinkingDecisionScreen } from '../presentation/screens/account-linking/linking-decision-screen.js';
import { createStateView } from '../presentation/components/state-views/state-views.js';
import { EVENT_NAMES } from '../core/events/event-names.js';

function notFoundView({ errorBoundary, reason, context, message }) {
  errorBoundary.reportRecoverable({ reason, ...context });
  return createStateView({ kind: 'empty', message });
}

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

function resolveLessonExercises(lesson, attemptRepository, userId) {
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
            userId,
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
  userId,
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
  const resolvedLesson = resolveLessonExercises(withMedia, attemptRepository, userId);

  const persisted = sessionRepository.getSession();
  const matchesThisLesson =
    persisted?.bookId === bookId && persisted?.unitId === unitId && persisted?.lessonId === lessonId;

  return createLearningSessionScreen({
    lesson: resolvedLesson,
    restoreSectionIndex: matchesThisLesson ? persisted.sectionIndex ?? 0 : 0,
    restoreScrollPosition: matchesThisLesson ? persisted.scrollPosition ?? 0 : 0,
    onSectionChange: (sectionIndex) =>
      sessionRepository.saveSession({
        bookId,
        unitId,
        lessonId,
        mode: 'learn',
        sectionIndex,
        scrollPosition: 0,
        userId,
      }),
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
  const userId = deps.authContract.getSession()?.userId ?? null;
  const fullDeps = { ...deps, userId };

  if (bookPosition && unitPosition && lessonPosition && mode === 'learn') {
    return buildLearningSessionScreen({
      ...fullDeps,
      bookId: bookPosition,
      unitId: unitPosition,
      lessonId: lessonPosition,
    });
  }

  if (bookPosition && unitPosition && lessonPosition) {
    return buildLessonEntryScreen({
      ...fullDeps,
      bookId: bookPosition,
      unitId: unitPosition,
      lessonId: lessonPosition,
    });
  }

  if (bookPosition && unitPosition) {
    return buildUnitScreen({ ...fullDeps, bookId: bookPosition, unitId: unitPosition });
  }

  if (bookPosition) {
    return buildBookScreen({ ...fullDeps, bookId: bookPosition });
  }

  if (libraryPosition === 'library') {
    return buildLibraryScreen(fullDeps);
  }

  return buildHomeScreen(fullDeps);
}

export function mountScreenRouter({
  eventBus,
  contentRegion,
  router,
  errorBoundary,
  sessionRepository,
  attemptRepository,
  runtimeConfig,
  authContract,
  accountLinkingFlow,
}) {
  let lastNavigationState = null;
  let authUiStage = 'entry'; // 'entry' | 'login' — solo relevante antes de autenticarse

  function render() {
    const authSession = authContract.getSession();

    if (!authSession) {
      const screen =
        authUiStage === 'login'
          ? createLoginScreen({
              onBack: () => {
                authUiStage = 'entry';
                render();
              },
              onSubmit: async (email, password) => {
                const { error } = await authContract.signIn(email, password);
                return { error };
              },
            })
          : createEntryScreen({
              onSignIn: () => {
                authUiStage = 'login';
                render();
              },
            });
      contentRegion.render(screen);
      return;
    }

    if (accountLinkingFlow.hasPendingDecision()) {
      const screen = createLinkingDecisionScreen({
        onMerge: async () => {
          await accountLinkingFlow.resolvePendingDecision('merge');
          render();
        },
        onDiscard: async () => {
          await accountLinkingFlow.resolvePendingDecision('discard');
          render();
        },
      });
      contentRegion.render(screen);
      return;
    }

    authUiStage = 'entry'; // reset para un futuro logout
    const navigationState = lastNavigationState ?? { libraryPosition: null, bookPosition: null, unitPosition: null, lessonPosition: null, mode: null };
    const screen = resolveScreen(navigationState, {
      router,
      errorBoundary,
      sessionRepository,
      attemptRepository,
      runtimeConfig,
      authContract,
    });
    contentRegion.render(screen);
  }

  function handleRouteChanged(navigationState) {
    lastNavigationState = navigationState;
    render();
  }

  const unsubscribeRoute = eventBus.subscribe(EVENT_NAMES.ROUTE_CHANGED, handleRouteChanged);
  const unsubscribeAuth = authContract.onAuthStateChange(async (authSession) => {
    if (authSession) {
      await accountLinkingFlow.run(authSession);
    }
    render();
  });

  // Un token ya cacheado en el arranque (estudiante que vuelve, no un
  // login fresco) nunca dispara `onAuthStateChange` — pero si una
  // vinculación anterior se interrumpió antes de completarse (cierre
  // de la app a mitad de camino), sigue habiendo datos huérfanos por
  // reconciliar. `run()` es idempotente (no-op si no hay nada que
  // hacer), así que es seguro invocarlo aquí también, en cada
  // arranque con sesión ya cacheada — es lo que garantiza que una
  // interrupción eventualmente se resuelva, sin exigir un nuevo login.
  const cachedSession = authContract.getSession();
  if (cachedSession) {
    accountLinkingFlow.run(cachedSession).then(render);
  }

  return Object.freeze({
    unsubscribe: () => {
      unsubscribeRoute();
      unsubscribeAuth();
    },
  });
}
