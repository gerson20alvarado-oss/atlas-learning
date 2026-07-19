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
import { createPageReaderScreen } from '../presentation/screens/page-reader/page-reader-screen.js';
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

// Nuevo Reader (Sprint Proposal — Nuevo Reader, §2 + Page Navigator,
// esta sesión): rango navegable ampliado al libro completo — el
// propio PageReaderScreen nunca impuso el límite (Technical
// Specification v2.1, §7.2, "el visor no impone el límite, los
// PageResource sí"); antes se acotaba aquí a 16-25 porque el Page
// Navigator todavía no existía y no había forma práctica de navegar
// lejos. Con el Page Navigator, tiene sentido exponer el rango real.
// Solo 16-25 tienen imagen real en Storage hoy — el resto cae al
// aviso honesto de "página todavía no disponible" ya implementado en
// page-reader-screen.js, nunca un ícono de imagen rota.
const READER_FIRST_PAGE = 1;
const READER_LAST_PAGE = 273;

function buildLibraryScreen({
  router,
  attemptRepository,
  runtimeConfig,
  libraryAccessRepository,
  authorizedBookIds,
  readerPositionRepository,
  userId,
  authContract,
}) {
  const library = getLibrary();
  // Control de Acceso por Libro (Caso 5, biblioteca vacía incluido):
  // Library nunca pregunta "¿qué libros existen?" — recibe ya
  // resuelto "¿qué libros puede ver esta cuenta?". Si no hay ninguno
  // autorizado, `books` queda en un arreglo vacío y library-screen.js
  // renderiza exactamente el mismo estado vacío que ya usa para
  // cualquier colección sin elementos (createEmptyLibrary(), Content
  // Model C8) — sin ningún cambio en ese archivo.
  const authorizedBooks = library.books.filter((book) =>
    libraryAccessRepository.isBookAuthorized(authorizedBookIds, book.id),
  );
  const books = authorizedBooks.map((book) => ({
    id: book.id,
    title: book.title,
    progress: computeBookProgress(book, attemptRepository),
    // R1 (Sprint 7): portada real cuando el libro la declara (ver
    // domain/content/library-catalog.js); si no existe todavía para
    // un libro dado, book-card conserva su estado neutro sin cambios.
    coverUrl: book.coverAssetPath ? runtimeConfig.resolveAssetPath(book.coverAssetPath) : null,
  }));

  return createLibraryScreen({
    books,
    onBack: () => router.navigateTo('/'),
    onSelectBook: async (bookId) => {
      // ReaderPosition, Supabase puro (esta sesión): se resuelve
      // directo contra Supabase antes de navegar — sin ninguna
      // capa local, sin comparación manual de bookId (getPosition ya
      // está acotado a este libro).
      const accessToken = authContract.getSession()?.accessToken ?? null;
      const position = await readerPositionRepository.getPosition({ userId, bookId, accessToken });
      const rawTargetPage = position?.pageNumber ?? READER_FIRST_PAGE;
      const targetPage = Math.min(Math.max(rawTargetPage, READER_FIRST_PAGE), READER_LAST_PAGE);
      router.navigateTo(`/book/${bookId}/read/${targetPage}`);
    },
  });
}

/**
 * Nuevo Reader (Sprint Proposal — Nuevo Reader, Etapas 7-9). Resuelve
 * todas las dependencias reales (PageSource, ReaderPosition,
 * Bookmark, StudyWorkspace, Attempts, credenciales de la sesión de
 * Auth activa) antes de montar la pantalla — PageReaderScreen en sí
 * es completamente puro, no conoce Supabase, Auth ni Router.
 */
function buildPageReaderScreen({
  router,
  bookId,
  pageNumber,
  userId,
  authContract,
  pageSourceRepository,
  audioSourceRepository,
  readerPositionRepository,
  bookmarkRepository,
  studyWorkspaceRepository,
}) {
  const accessToken = authContract.getSession()?.accessToken ?? null;

  return createPageReaderScreen({
    bookId,
    initialPageNumber: pageNumber,
    firstPage: READER_FIRST_PAGE,
    lastPage: READER_LAST_PAGE,
    userId,
    accessToken,
    pageSourceRepository,
    audioSourceRepository,
    readerPositionRepository,
    bookmarkRepository,
    studyWorkspaceRepository,
    onBack: () => router.navigateTo('/library'),
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
    restoreAudioPosition: matchesThisLesson ? persisted.currentAudio ?? null : null,
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
    onAudioPositionChange: (currentAudio) => sessionRepository.saveSession({ currentAudio }),
    onBack: () => router.navigateTo(`/book/${bookId}/unit/${unitId}/lesson/${lessonId}`),
    onExit: ({ reason }) => {
      if (reason === 'finished') {
        sessionRepository.clearSession();
      }
      router.navigateTo('/');
    },
  });
}

function buildHomeScreen({ router, readerPositionRepository, libraryAccessRepository, userId, authContract }) {
  // ReaderPosition, Supabase puro (esta sesión): Home ya no necesita
  // conocer la posición de antemano — ni estado de carga, ni
  // distinción visual entre "hay algo" y "no hay nada". El botón
  // resuelve todo al tocarlo, exactamente igual que Library ya
  // resuelve la página al elegir un libro. Si no hay ninguna
  // posición real (o el libro ya no está autorizado — Caso 4, mismo
  // criterio silencioso de siempre), cae a la Library sin ningún
  // aviso — un destino igual de válido, nunca un error.
  return createHomeScreen({
    onContinue: async () => {
      const accessToken = authContract.getSession()?.accessToken ?? null;
      const position = await readerPositionRepository.getMostRecentPosition({ userId, accessToken });
      const authorizedBookIds = await libraryAccessRepository.getAuthorizedBookIds({ userId, accessToken });
      const bookIsAuthorized =
        position?.bookId && libraryAccessRepository.isBookAuthorized(authorizedBookIds, position.bookId);

      if (bookIsAuthorized) {
        router.navigateTo(`/book/${position.bookId}/read/${position.pageNumber}`);
      } else {
        router.navigateTo('/library');
      }
    },
  });
}

function resolveScreen(navigationState, deps) {
  const { bookPosition, unitPosition, lessonPosition, mode, libraryPosition, pagePosition } = navigationState;
  const userId = deps.authContract.getSession()?.userId ?? null;
  const fullDeps = { ...deps, userId };

  // Control de Acceso por Libro (Caso 4, diseño cerrado antes de este
  // sprint): un bookId no autorizado para esta cuenta se resuelve
  // exactamente igual que un bookId inexistente — mismo notFoundView,
  // mismo mensaje, para que ambos sean indistinguibles para el
  // estudiante. Un único punto de control aquí, antes de dispatchar a
  // cualquiera de las screens que dependen de un libro, en vez de
  // repetir la misma verificación en cada una.
  if (bookPosition && !deps.libraryAccessRepository.isBookAuthorized(deps.authorizedBookIds, bookPosition)) {
    return notFoundView({
      errorBoundary: deps.errorBoundary,
      reason: 'book-not-authorized',
      context: { bookId: bookPosition },
      message: 'Este libro no está disponible. Vuelve a la Library para elegir otro.',
    });
  }

  // Nuevo Reader (Sprint Proposal — Nuevo Reader, Etapa 7): antes de
  // los cuatro ramales heredados (Book/Unit/Lesson entry/Learning
  // Session), que siguen intactos y desacoplados, no eliminados
  // (Sprint Proposal §5.1, ya aprobado).
  if (bookPosition && pagePosition) {
    return buildPageReaderScreen({ ...fullDeps, bookId: bookPosition, pageNumber: pagePosition });
  }

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
  libraryAccessRepository,
  pageSourceRepository,
  audioSourceRepository,
  readerPositionRepository,
  bookmarkRepository,
  studyWorkspaceRepository,
}) {
  let lastNavigationState = null;
  let authUiStage = 'entry'; // 'entry' | 'login' — solo relevante antes de autenticarse
  // Control de Acceso por Libro: en memoria únicamente, nunca
  // persistida (riesgo aceptado en el plan de este sprint: sin caché
  // local en esta primera versión) — se resuelve fresca contra la
  // fuente configurada en cada transición real de sesión de
  // autenticación, mismo punto exacto donde ya se resuelve
  // accountLinkingFlow.run(). Vacía por defecto: el mismo resultado
  // seguro que un fallo de verificación (Caso 5).
  let authorizedBookIds = [];

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
    const navigationState = lastNavigationState ?? {
      libraryPosition: null,
      bookPosition: null,
      unitPosition: null,
      lessonPosition: null,
      mode: null,
      pagePosition: null,
    };
    const screen = resolveScreen(navigationState, {
      router,
      errorBoundary,
      sessionRepository,
      attemptRepository,
      runtimeConfig,
      authContract,
      libraryAccessRepository,
      authorizedBookIds,
      pageSourceRepository,
      audioSourceRepository,
      readerPositionRepository,
      bookmarkRepository,
      studyWorkspaceRepository,
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
      authorizedBookIds = await libraryAccessRepository.getAuthorizedBookIds({
        userId: authSession.userId,
        accessToken: authSession.accessToken,
      });
    } else {
      // Logout, o cambio a una cuenta distinta en el mismo
      // dispositivo: nunca debe sobrevivir la lista de libros
      // autorizados de la sesión anterior.
      authorizedBookIds = [];
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
  // Mismo criterio para authorizedBookIds: se resuelve aquí también,
  // fresca, nunca asumida de una ejecución anterior.
  const cachedSession = authContract.getSession();
  if (cachedSession) {
    Promise.all([
      accountLinkingFlow.run(cachedSession),
      libraryAccessRepository
        .getAuthorizedBookIds({ userId: cachedSession.userId, accessToken: cachedSession.accessToken })
        .then((ids) => {
          authorizedBookIds = ids;
        }),
    ]).then(render);
  }

  return Object.freeze({
    unsubscribe: () => {
      unsubscribeRoute();
      unsubscribeAuth();
    },
  });
}
