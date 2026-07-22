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
import { createAssessmentScreen } from '../presentation/screens/assessment/assessment-screen.js';
import { createWritingScreen } from '../presentation/screens/writing/writing-screen.js';
import { createVocabularyScreen } from '../presentation/screens/vocabulary/vocabulary-screen.js';
import { getAssessment, listAssessmentIds, getWriting, getWorksheetUnit } from '../domain/worksheet-content/worksheet-content-repository.js';
import { createLicenseActivationScreen } from '../presentation/screens/license-activation/license-activation-screen.js';
import { createProfileSetupScreen } from '../presentation/screens/profile-setup/profile-setup-screen.js';
import { createHomeScreen } from '../presentation/screens/home/home-screen.js';
import { createEntryScreen } from '../presentation/screens/entry/entry-screen.js';
import { createLoginScreen } from '../presentation/screens/login/login-screen.js';
import { createLinkingDecisionScreen } from '../presentation/screens/account-linking/linking-decision-screen.js';
import { createStateView } from '../presentation/components/state-views/state-views.js';
import { EVENT_NAMES } from '../core/events/event-names.js';
// Admin Console (Sprint 14): módulo completamente separado de la
// jerarquía de contenido — ninguno de estos imports es necesario
// para renderizar Library/Book/Unit/Lesson/Reader, y viceversa
// (regla de vecinos). El gating real ("¿esta cuenta es admin?") se
// resuelve en mountScreenRouter, igual que ownedBookIds/
// hasProfileCompleted — nunca dentro de las screens mismas.
import { createAdminNav } from '../presentation/components/admin-nav/admin-nav.js';
import { createAdminDashboardScreen } from '../presentation/screens/admin/admin-dashboard-screen.js';
import { createAdminUsersScreen } from '../presentation/screens/admin/admin-users-screen.js';
import { createAdminUserDetailScreen } from '../presentation/screens/admin/admin-user-detail-screen.js';
import { createAdminLicensesScreen } from '../presentation/screens/admin/admin-licenses-screen.js';
import { createAdminWorksheetAttemptsScreen } from '../presentation/screens/admin/admin-worksheet-attempts-screen.js';
import { createAdminReaderProgressScreen } from '../presentation/screens/admin/admin-reader-progress-screen.js';
import { createAdminBookmarksScreen } from '../presentation/screens/admin/admin-bookmarks-screen.js';

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
  licenseRepository,
  ownedBookIds,
  readerPositionRepository,
  userId,
  authContract,
  onShowLicenseActivation,
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
    licenseRepository.isBookOwned(ownedBookIds, book.id),
  );
  const books = authorizedBooks.map((book) => ({
    id: book.id,
    title: book.title,
    progress: computeBookProgress(book, attemptRepository),
    // R1 (Sprint 7): portada real cuando el libro la declara (ver
    // domain/content/library-catalog.js); si no existe todavía para
    // un libro dado, book-card conserva su estado neutro sin cambios.
    coverUrl: book.coverAssetPath ? runtimeConfig.resolveAssetPath(book.coverAssetPath) : null,
    // Última actividad (esta sesión, rediseño de Library): arranca en
    // `null` — se resuelve después, de forma asíncrona (ver más
    // abajo), para no demorar el primer render de la pantalla ni un
    // instante. book-card.js ya sabe ocultar la sección completa
    // cuando llega `null`.
    lastActivity: null,
  }));

  const screen = createLibraryScreen({
    books,
    onBack: () => router.navigateTo('/'),
    onActivateLicense: () => onShowLicenseActivation?.(),
    onSelectBook: async (bookId) => {
      // ReaderPosition, Supabase puro (esta sesión): se resuelve
      // directo contra Supabase antes de navegar — sin ninguna
      // capa local, sin comparación manual de bookId (getPosition ya
      // está acotado a este libro).
      const accessToken = authContract.getSession()?.accessToken ?? null;
      const position = await readerPositionRepository.getPosition({ userId, bookId, accessToken });
      const rawTargetPage = position?.pageNumber ?? READER_FIRST_PAGE;
      const targetPage = Math.min(Math.max(rawTargetPage, READER_FIRST_PAGE), READER_LAST_PAGE);

      // Recordar / restaurar última actividad (esta sesión): si el
      // estudiante ya tenía una actividad guardada para esta unidad
      // (Writing/Worksheet/Progress Test/futuras — ver
      // buildPageReaderScreen/buildWritingScreen, que son quienes la
      // guardan), vuelve exactamente ahí, en vez de reiniciar en
      // Writing cada vez. Alcance estrictamente limitado a libros
      // contentMode 'worksheet' — Hi! Korean nunca entra a este
      // bloque, cae directo a la línea de siempre más abajo, sin
      // ningún cambio de comportamiento.
      const book = getBookById(bookId);
      if (book?.contentMode === 'worksheet') {
        const lastActivity = position?.lastActivity ?? null;

        if (lastActivity === 'writing' && getWriting(bookId, targetPage)) {
          router.navigateTo(`/book/${bookId}/writing/${targetPage}`);
          return;
        }

        // My Vocabulary (esta sesión): mismo criterio exacto que
        // 'writing' — se verifica que el libro tenga la capacidad
        // habilitada y que la unidad exista, antes de restaurar.
        if (lastActivity === 'vocabulary' && book.enabledActivities?.includes('vocabulary') && getWorksheetUnit(bookId, targetPage)) {
          router.navigateTo(`/book/${bookId}/vocabulary/${targetPage}`);
          return;
        }

        if (lastActivity && lastActivity !== 'writing' && getAssessment(bookId, targetPage, lastActivity)) {
          const url =
            lastActivity === 'worksheet'
              ? `/book/${bookId}/read/${targetPage}`
              : `/book/${bookId}/read/${targetPage}/${lastActivity}`;
          router.navigateTo(url);
          return;
        }

        // Sin actividad previa registrada (primera vez que el
        // estudiante abre esta unidad): comportamiento ya aprobado
        // antes — entra por Writing si la unidad la declara.
        if (getWriting(bookId, targetPage)) {
          router.navigateTo(`/book/${bookId}/writing/${targetPage}`);
          return;
        }
      }

      router.navigateTo(`/book/${bookId}/read/${targetPage}`);
    },
  });

  // Última actividad (esta sesión, rediseño de Library): se resuelve
  // después de devolver la pantalla — mismo patrón que
  // assessment-screen.js usa para cargar sus propios datos tras
  // montarse — para no bloquear el primer render de Library.
  // Reutiliza EXCLUSIVAMENTE lo que ya existe:
  // readerPositionRepository.getPosition() (mismo método que ya usa
  // onSelectBook arriba, sin ningún método nuevo) + getWriting()/
  // getAssessment() (ya usados también arriba). Únicamente libros
  // contentMode 'worksheet' disparan la llamada — Hi! Korean nunca
  // la ejecuta, así que no se ve afectado en absoluto.
  (async () => {
    const accessToken = authContract.getSession()?.accessToken ?? null;
    const updatedBooks = await Promise.all(
      authorizedBooks.map(async (book) => {
        const base = books.find((b) => b.id === book.id);
        if (book.contentMode !== 'worksheet') return base;

        const position = await readerPositionRepository.getPosition({ userId, bookId: book.id, accessToken });
        if (!position?.lastActivity) return base;

        const unitNumber = position.pageNumber;
        const activityId = position.lastActivity;
        const activityContent =
          activityId === 'writing'
            ? getWriting(book.id, unitNumber)
            : getAssessment(book.id, unitNumber, activityId);
        const activityTitle = activityId === 'writing' ? activityContent?.title : activityContent?.assessmentTitle;
        if (!activityTitle) return base;

        return { ...base, lastActivity: `${activityTitle} • Unit ${unitNumber}` };
      }),
    );
    screen.update({ books: updatedBooks });
  })();

  return screen;
}

/**
 * Nuevo Reader (Sprint Proposal — Nuevo Reader, Etapas 7-9). Resuelve
 * todas las dependencias reales (PageSource, ReaderPosition,
 * Bookmark, StudyWorkspace, Attempts, credenciales de la sesión de
 * Auth activa) antes de montar la pantalla — PageReaderScreen en sí
 * es completamente puro, no conoce Supabase, Auth ni Router.
 */
/**
 * Writing (esta sesión): composición mínima — resuelve el contenido
 * vía getWriting() y monta writing-screen.js, sin conocer nada de
 * PageSource/VideoSource/Assessment. El botón "Continue to Worksheet"
 * navega a la ruta de Worksheet de siempre (`/read/:n`, sin segmento)
 * — la misma que ya existía, sin ningún cambio.
 */
/**
 * My Vocabulary (esta sesión): mismo molde exacto que
 * buildWritingScreen — resuelve el contenido y monta
 * vocabulary-screen.js, sin conocer nada de Assessment/Writing.
 * Deliberadamente SIN guardar "última actividad" vía
 * readerPositionRepository: esa mecánica está diseñada para la
 * secuencia Writing→Worksheet→Progress Test y su lógica de
 * restauración en `onSelectBook` no conoce la ruta de Vocabulary —
 * ampliarla queda fuera del alcance de esta implementación (no se
 * modifica ningún comportamiento de navegación existente). My
 * Vocabulary se alcanza únicamente vía Quick Activity Nav.
 */
function buildVocabularyScreen({
  router,
  bookId,
  unitNumber,
  vocabularyEntryRepository,
  readerPositionRepository,
  userId,
  authContract,
}) {
  const accessToken = authContract.getSession()?.accessToken ?? null;
  const book = getBookById(bookId);
  const unit = getWorksheetUnit(bookId, unitNumber);

  if (!book?.enabledActivities?.includes('vocabulary') || !unit) {
    // Libro sin la capacidad habilitada, o unidad inexistente —
    // mismo criterio honesto que el resto de Atlas: nunca una
    // pantalla en blanco sin explicación.
    const fallback = document.createElement('div');
    fallback.setAttribute('data-component', 'vocabulary-screen');
    fallback.setAttribute('data-part', 'unit-unavailable');
    const message = document.createElement('p');
    message.className = 'al-type-ui-body';
    message.textContent = `My Vocabulary no está disponible para esta unidad.`;
    fallback.appendChild(message);
    return Object.freeze({ element: fallback, update: () => {}, destroy: () => fallback.remove() });
  }

  // Recordar última actividad (esta sesión, agregado a pedido):
  // mismo criterio exacto que buildWritingScreen/buildPageReaderScreen
  // — efecto secundario del despacho, nunca de vocabulary-screen.js
  // (no se tocó). onSelectBook ya sabe traducir 'vocabulary' de
  // vuelta a esta misma ruta.
  readerPositionRepository?.savePosition({
    userId,
    bookId,
    pageNumber: unitNumber,
    lastActivity: 'vocabulary',
    accessToken,
  });

  return createVocabularyScreen({
    vocabulary: {
      bookId: unit.bookId,
      unitNumber: unit.unitNumber,
      unitTitle: unit.unitTitle,
    },
    vocabularyEntryRepository,
    userId,
    accessToken,
    onBack: () => router.navigateTo('/library'),
  });
}

function buildWritingScreen({
  router,
  bookId,
  unitNumber,
  writingResponseRepository,
  readerPositionRepository,
  userId,
  authContract,
}) {
  const accessToken = authContract.getSession()?.accessToken ?? null;
  const writing = getWriting(bookId, unitNumber);

  if (!writing) {
    // Unidad sin Writing declarado — mismo criterio honesto que el
    // resto de Atlas: nunca una pantalla en blanco sin explicación.
    const fallback = document.createElement('div');
    fallback.setAttribute('data-component', 'writing-screen');
    fallback.setAttribute('data-part', 'unit-unavailable');
    const message = document.createElement('p');
    message.className = 'al-type-ui-body';
    message.textContent = `La actividad de Writing de la Unidad ${unitNumber} todavía no está disponible.`;
    fallback.appendChild(message);
    return Object.freeze({ element: fallback, update: () => {}, destroy: () => fallback.remove() });
  }

  // Recordar última actividad (esta sesión) — mismo criterio que en
  // buildPageReaderScreen: efecto secundario del despacho, nunca de
  // writing-screen.js (no se tocó).
  readerPositionRepository?.savePosition({
    userId,
    bookId,
    pageNumber: unitNumber,
    lastActivity: 'writing',
    accessToken,
  });

  return createWritingScreen({
    writing,
    writingResponseRepository,
    userId,
    accessToken,
    onBack: () => router.navigateTo('/library'),
    onContinue: () => router.navigateTo(`/book/${bookId}/read/${unitNumber}`),
  });
}

function buildPageReaderScreen({
  router,
  bookId,
  pageNumber,
  assessmentId,
  userId,
  authContract,
  pageSourceRepository,
  audioSourceRepository,
  videoSourceRepository,
  imageSourceRepository,
  worksheetAttemptRepository,
  unitAttemptRepository,
  readerPositionRepository,
  bookmarkRepository,
  studyWorkspaceRepository,
}) {
  const accessToken = authContract.getSession()?.accessToken ?? null;
  const book = getBookById(bookId);

  // Bifurcación real de esta sesión: un libro con contentMode
  // 'worksheet' se resuelve como worksheet interactiva nativa, nunca
  // como imagen de PageSource. Hi! Korean nunca declara este campo
  // — su camino de siempre (abajo) queda intacto, sin ningún cambio,
  // ni un solo `if` nuevo en su propia ejecución.
  if (book?.contentMode === 'worksheet') {
    // Evoluciones independientes por unidad (esta sesión): la unidad
    // ya no es "una sola worksheet" — es un conjunto de evaluaciones
    // (Worksheet, Progress Test, futuras), cada una con su propia
    // ruta. Sin segmento de evaluación en la URL, se asume
    // 'worksheet' — así ningún enlace existente (`/book/:id/read/:n`)
    // se rompe con este cambio.
    const resolvedAssessmentId = assessmentId ?? 'worksheet';
    const assessment = getAssessment(bookId, pageNumber, resolvedAssessmentId);
    if (!assessment) {
      // Unidad o evaluación todavía no producida — mismo criterio
      // honesto que ya usa el resto de Atlas: nunca una pantalla en
      // blanco sin explicación.
      const fallback = document.createElement('div');
      fallback.setAttribute('data-component', 'assessment-screen');
      fallback.setAttribute('data-part', 'unit-unavailable');
      const message = document.createElement('p');
      message.className = 'al-type-ui-body';
      message.textContent = `La Unidad ${pageNumber} todavía no está disponible.`;
      fallback.appendChild(message);
      return Object.freeze({ element: fallback, update: () => {}, destroy: () => fallback.remove() });
    }

    // "Continue to X" (decisión de producto cerrada: nunca automático,
    // nunca obligatorio — el botón solo aparece en el Summary, el
    // estudiante decide cuándo tocarlo). Se resuelve por ORDEN de
    // declaración en el contenido (`listAssessmentIds`), no
    // hardcodeado a "worksheet → progress-test": el día que se agregue
    // un Quiz después del Progress Test, este mismo código ofrece
    // "Continue to Quiz" desde el Summary del Progress Test sin
    // ningún cambio aquí.
    const assessmentIds = listAssessmentIds(bookId, pageNumber);
    const currentIndex = assessmentIds.indexOf(resolvedAssessmentId);
    const nextAssessmentId = currentIndex >= 0 ? assessmentIds[currentIndex + 1] : undefined;
    const nextAssessmentContent = nextAssessmentId ? getAssessment(bookId, pageNumber, nextAssessmentId) : null;
    const nextAssessment = nextAssessmentContent
      ? {
          label: `Continue to ${nextAssessmentContent.assessmentTitle}`,
          onSelect: () => router.navigateTo(`/book/${bookId}/read/${pageNumber}/${nextAssessmentId}`),
        }
      : undefined;

    // Recordar última actividad (esta sesión): efecto secundario del
    // despacho, no de la pantalla — assessment-screen.js no se tocó.
    // Reutiliza ReaderPosition (ya existía para Hi! Korean, ver
    // docstring del contrato) con un campo aditivo (`lastActivity`)
    // que ese Reader nunca escribe, así que su comportamiento no
    // cambia en absoluto — la rama de abajo (`createPageReaderScreen`)
    // sigue exactamente igual.
    readerPositionRepository?.savePosition({
      userId,
      bookId,
      pageNumber,
      lastActivity: resolvedAssessmentId,
      accessToken,
    });

    return createAssessmentScreen({
      assessment,
      videoSourceRepository,
      imageSourceRepository,
      worksheetAttemptRepository,
      unitAttemptRepository,
      userId,
      accessToken,
      onBack: () => router.navigateTo('/library'),
      nextAssessment,
    });
  }

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

/**
 * Admin Console (Sprint 14): compone admin-nav + la screen de la
 * sección activa, exactamente como un mini app-shell propio dentro
 * de content-region — nunca reemplaza el app-shell real (header +
 * nav-secondary del estudiante siguen montados alrededor, sin
 * cambios). `router.navigateTo` es la única forma de moverse entre
 * secciones, igual que el resto de Atlas — admin-nav no conoce
 * rutas, solo reporta la sección elegida.
 */
function buildAdminScreen({
  router,
  adminSection,
  adminUserId,
  accessToken,
  profileRepository,
  licenseRepository,
  unitAttemptRepository,
  readerPositionRepository,
  bookmarkRepository,
}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'admin-shell');

  const nav = createAdminNav({
    activeSection: adminSection === 'user-detail' ? 'users' : adminSection,
    onSelect: (section) => router.navigateTo(`/admin/${section === 'dashboard' ? '' : section}`),
  });
  element.appendChild(nav.element);

  const sectionContainer = document.createElement('div');
  sectionContainer.setAttribute('data-part', 'admin-section-container');
  element.appendChild(sectionContainer);

  let screen;
  if (adminSection === 'users') {
    screen = createAdminUsersScreen({
      accessToken,
      profileRepository,
      onSelectStudent: (studentUserId) => router.navigateTo(`/admin/users/${studentUserId}`),
    });
  } else if (adminSection === 'user-detail') {
    screen = createAdminUserDetailScreen({
      userId: adminUserId,
      accessToken,
      profileRepository,
      licenseRepository,
      unitAttemptRepository,
      readerPositionRepository,
      bookmarkRepository,
      onBack: () => router.navigateTo('/admin/users'),
    });
  } else if (adminSection === 'licenses') {
    screen = createAdminLicensesScreen({ accessToken, licenseRepository });
  } else if (adminSection === 'worksheet-attempts') {
    screen = createAdminWorksheetAttemptsScreen({ accessToken, unitAttemptRepository });
  } else if (adminSection === 'reader-progress') {
    screen = createAdminReaderProgressScreen({ accessToken, profileRepository, readerPositionRepository });
  } else if (adminSection === 'bookmarks') {
    screen = createAdminBookmarksScreen({ accessToken, profileRepository, bookmarkRepository });
  } else {
    screen = createAdminDashboardScreen({
      accessToken,
      profileRepository,
      licenseRepository,
      unitAttemptRepository,
    });
  }
  sectionContainer.appendChild(screen.element);

  function destroy() {
    nav.destroy();
    screen.destroy();
    element.remove();
  }

  return Object.freeze({ element, update: () => {}, destroy });
}

function buildHomeScreen({ router, readerPositionRepository, licenseRepository, userId, authContract }) {
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
      const ownedBookIds = await licenseRepository.getOwnedBookIds({ userId, accessToken });
      const bookIsAuthorized =
        position?.bookId && licenseRepository.isBookOwned(ownedBookIds, position.bookId);

      if (bookIsAuthorized) {
        router.navigateTo(`/book/${position.bookId}/read/${position.pageNumber}`);
      } else {
        router.navigateTo('/library');
      }
    },
  });
}

function resolveScreen(navigationState, deps) {
  const {
    bookPosition,
    unitPosition,
    lessonPosition,
    mode,
    libraryPosition,
    pagePosition,
    assessmentPosition,
    writingUnitPosition,
    vocabularyUnitPosition,
    adminSection,
    adminUserId,
  } = navigationState;
  const userId = deps.authContract.getSession()?.userId ?? null;
  const accessToken = deps.authContract.getSession()?.accessToken ?? null;
  const fullDeps = { ...deps, userId };

  // Admin Console (Sprint 14): jerarquía separada, se resuelve antes
  // que cualquier ramal de contenido (nunca tiene bookPosition). Una
  // cuenta no-admin que llega a /admin por cualquier vía (URL
  // escrita a mano, enlace viejo) ve exactamente el mismo
  // notFoundView que "book-not-authorized" — mismo criterio
  // silencioso ya usado en el resto de Atlas: indistinguible de una
  // ruta que nunca existió, nunca un mensaje que confirme que Admin
  // existe.
  if (adminSection) {
    if (!deps.isAdmin) {
      return notFoundView({
        errorBoundary: deps.errorBoundary,
        reason: 'admin-not-authorized',
        context: { userId },
        message: 'This page is not available.',
      });
    }
    return buildAdminScreen({
      router: deps.router,
      adminSection,
      adminUserId,
      accessToken,
      profileRepository: deps.profileRepository,
      licenseRepository: deps.licenseRepository,
      unitAttemptRepository: deps.unitAttemptRepository,
      readerPositionRepository: deps.readerPositionRepository,
      bookmarkRepository: deps.bookmarkRepository,
    });
  }

  // Control de Acceso por Libro (Caso 4, diseño cerrado antes de este
  // sprint): un bookId no autorizado para esta cuenta se resuelve
  // exactamente igual que un bookId inexistente — mismo notFoundView,
  // mismo mensaje, para que ambos sean indistinguibles para el
  // estudiante. Un único punto de control aquí, antes de dispatchar a
  // cualquiera de las screens que dependen de un libro, en vez de
  // repetir la misma verificación en cada una.
  if (bookPosition && !deps.licenseRepository.isBookOwned(deps.ownedBookIds, bookPosition)) {
    return notFoundView({
      errorBoundary: deps.errorBoundary,
      reason: 'book-not-authorized',
      context: { bookId: bookPosition },
      message: 'Este libro no está disponible. Vuelve a la Library para elegir otro.',
    });
  }

  // Writing (esta sesión): jerarquía propia, sin relación con
  // pagePosition/assessmentPosition — se resuelve antes que el Reader
  // por el mismo motivo que Admin se resuelve antes que el contenido:
  // ninguno de los dos comparte campos con las rutas de contenido
  // tradicionales, así que el orden entre ellos es solo una cuestión
  // de claridad, no de que puedan colisionar.
  if (bookPosition && writingUnitPosition) {
    return buildWritingScreen({ ...fullDeps, bookId: bookPosition, unitNumber: writingUnitPosition });
  }

  // My Vocabulary (esta sesión): mismo criterio exacto que Writing —
  // jerarquía propia, se resuelve antes que el Reader.
  if (bookPosition && vocabularyUnitPosition) {
    return buildVocabularyScreen({ ...fullDeps, bookId: bookPosition, unitNumber: vocabularyUnitPosition });
  }

  // Nuevo Reader (Sprint Proposal — Nuevo Reader, Etapa 7): antes de
  // los cuatro ramales heredados (Book/Unit/Lesson entry/Learning
  // Session), que siguen intactos y desacoplados, no eliminados
  // (Sprint Proposal §5.1, ya aprobado).
  if (bookPosition && pagePosition) {
    return buildPageReaderScreen({
      ...fullDeps,
      bookId: bookPosition,
      pageNumber: pagePosition,
      assessmentId: assessmentPosition ?? 'worksheet',
    });
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
  licenseRepository,
  profileRepository,
  pageSourceRepository,
  audioSourceRepository,
  videoSourceRepository,
  imageSourceRepository,
  worksheetAttemptRepository,
  unitAttemptRepository,
  readerPositionRepository,
  bookmarkRepository,
  studyWorkspaceRepository,
  writingResponseRepository,
  vocabularyEntryRepository,
}) {
  let lastNavigationState = null;
  let authUiStage = 'entry'; // 'entry' | 'login' — solo relevante antes de autenticarse
  // Sistema de Licencias por Libro (esta sesión): 'shelf' | 'activate'
  // — mismo criterio que authUiStage, un estado local de UI, no una
  // ruta de hash nueva. Activar una licencia no es "navegar a un
  // libro" (todavía no hay libro), es una interrupción temporal
  // sobre la Library, igual que Login lo es sobre Entry.
  let libraryUiStage = 'shelf';
  // Control de Acceso por Libro: en memoria únicamente, nunca
  // persistida (riesgo aceptado en el plan de este sprint: sin caché
  // local en esta primera versión) — se resuelve fresca contra la
  // fuente configurada en cada transición real de sesión de
  // autenticación, mismo punto exacto donde ya se resuelve
  // accountLinkingFlow.run(). Vacía por defecto: el mismo resultado
  // seguro que un fallo de verificación (Caso 5).
  let ownedBookIds = [];
  // Perfil de Usuario (esta sesión): mismo criterio conservador que
  // ownedBookIds — falso por defecto hasta que la consulta real
  // resuelva, nunca asumido verdadero. Un usuario con perfil real
  // podría ver un parpadeo breve hacia Profile Setup antes de que la
  // consulta confirme lo contrario — mismo tipo de parpadeo ya
  // aceptado para la Library vacía mientras ownedBookIds resuelve.
  let hasProfileCompleted = false;
  // Admin Console (Sprint 14): mismo criterio conservador que
  // hasProfileCompleted — false hasta que la consulta real lo
  // confirme, nunca asumido true. Un falso negativo momentáneo
  // (parpadeo hacia notFoundView antes de que resuelva) es aceptable
  // y ya es el mismo tipo de parpadeo que el resto de Atlas acepta;
  // un falso positivo nunca lo sería.
  let isAdmin = false;

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

    if (!hasProfileCompleted) {
      const screen = createProfileSetupScreen({
        onSubmit: async (firstName, lastName) => {
          const success = await profileRepository.createProfile({
            userId: authSession.userId,
            firstName,
            lastName,
            accessToken: authSession.accessToken,
          });
          if (!success) {
            return { error: 'We could not save your profile. Please try again.' };
          }
          hasProfileCompleted = true;
          render();
          return { error: null };
        },
      });
      contentRegion.render(screen);
      return;
    }

    if (libraryUiStage === 'activate') {
      const accessToken = authSession.accessToken;
      const screen = createLicenseActivationScreen({
        licenseRepository,
        accessToken,
        resolveBookTitle: (bookId) => getBookById(bookId)?.title ?? null,
        onBack: () => {
          libraryUiStage = 'shelf';
          render();
        },
        onActivated: async () => {
          // Refrescar antes de volver — el libro recién activado
          // debe verse en la Library de inmediato, no en el próximo
          // login. Mismo criterio ya usado tras vincular cuentas.
          ownedBookIds = await licenseRepository.getOwnedBookIds({
            userId: authSession.userId,
            accessToken,
          });
          libraryUiStage = 'shelf';
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
      licenseRepository,
      ownedBookIds,
      isAdmin,
      onShowLicenseActivation: () => {
        libraryUiStage = 'activate';
        render();
      },
      pageSourceRepository,
      audioSourceRepository,
      videoSourceRepository,
      imageSourceRepository,
      worksheetAttemptRepository,
      unitAttemptRepository,
      readerPositionRepository,
      bookmarkRepository,
      studyWorkspaceRepository,
      writingResponseRepository,
      vocabularyEntryRepository,
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
      ownedBookIds = await licenseRepository.getOwnedBookIds({
        userId: authSession.userId,
        accessToken: authSession.accessToken,
      });
      hasProfileCompleted = await profileRepository.hasProfile({
        userId: authSession.userId,
        accessToken: authSession.accessToken,
      });
      // Admin Console (Sprint 14): misma verificación fresca que
      // hasProfileCompleted — nunca se conserva de una sesión
      // anterior (ver el bloque `else` de abajo).
      isAdmin = await profileRepository.isAdmin({
        userId: authSession.userId,
        accessToken: authSession.accessToken,
      });
    } else {
      // Logout, o cambio a una cuenta distinta en el mismo
      // dispositivo: nunca debe sobrevivir ni la lista de libros
      // poseídos ni la confirmación de perfil de la sesión anterior.
      ownedBookIds = [];
      hasProfileCompleted = false;
      // Admin Console (Sprint 14): un logout nunca deja `isAdmin`
      // en `true` para la próxima cuenta que inicie sesión en este
      // mismo dispositivo — mismo criterio exacto que las dos
      // líneas de arriba.
      isAdmin = false;
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
  // Mismo criterio para ownedBookIds: se resuelve aquí también,
  // fresca, nunca asumida de una ejecución anterior. Igual para
  // hasProfileCompleted — mismo tipo de verificación fresca en cada
  // arranque, nunca asumida de una sesión anterior. Admin Console
  // (Sprint 14): isAdmin sigue exactamente el mismo criterio — nunca
  // se persiste localmente, se resuelve fresca contra Supabase en
  // cada arranque, igual que las otras dos.
  const cachedSession = authContract.getSession();
  if (cachedSession) {
    Promise.all([
      accountLinkingFlow.run(cachedSession),
      licenseRepository
        .getOwnedBookIds({ userId: cachedSession.userId, accessToken: cachedSession.accessToken })
        .then((ids) => {
          ownedBookIds = ids;
        }),
      profileRepository.hasProfile({ userId: cachedSession.userId, accessToken: cachedSession.accessToken }).then((result) => {
        hasProfileCompleted = result;
      }),
      profileRepository.isAdmin({ userId: cachedSession.userId, accessToken: cachedSession.accessToken }).then((result) => {
        isAdmin = result;
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
