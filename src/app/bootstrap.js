/**
 * app/bootstrap.js
 *
 * Secuencia de arranque de Atlas Learning (Sprint 1 Plan §7). Es el
 * único módulo del proyecto que importa de todas las capas a la vez
 * — ningún otro módulo debería necesitar hacerlo (regla de vecinos,
 * Software Architecture §9.3).
 *
 * Pasos (Sprint 1 Plan §7, extendido en Sprint 2):
 *   a. Config pública
 *   b. Event bus
 *   c. Router (inicializado, sin resolver ruta todavía)
 *   d. Monta el app shell
 *   e. Monta screen-router (Sprint 2) — resuelve qué screen renderiza
 *      cada route:changed; ambas suscripciones (shell y screen
 *      router) deben existir antes del paso (f)
 *   f. El router resuelve la ruta inicial → publica route:changed
 *   g. Aplicación arrancada e interactiva → Exit Criteria cumplida
 *
 * Sprint 6 (Authentication) añade Auth y la vinculación de cuenta
 * ANTES del paso (c) — no porque bloqueen el arranque técnico, sino
 * porque screen-router.js (paso e) los necesita para decidir, en su
 * primer render, si el estudiante ve Entry/Login o el resto de la
 * app. Ninguna otra capa (Domain, Presentation) importa nada de
 * `auth/` ni de `remote-account-snapshot/` — solo bootstrap.js y
 * screen-router.js los conocen, igual que ya ocurre con Persistence.
 */

import { createRuntimeConfig } from '../config/runtime-config.js';
import { createEventBus } from '../core/events/event-bus.js';
import { EVENT_NAMES } from '../core/events/event-names.js';
import { createErrorBoundary } from '../core/errors/error-boundary.js';
import { createRouter } from '../core/router/router.js';
import { createStorageContract } from '../persistence/storage-contract.js';
import { createLocalStorageAdapter } from '../persistence/adapters/local-storage-adapter.js';
import { createSessionRepository } from '../domain/session/session-repository.js';
import { createAttemptRepository } from '../domain/learning-data/attempt-repository.js';
import { createAuthContract } from '../auth/auth-contract.js';
import { createSupabaseAuthAdapter } from '../auth/adapters/supabase-auth-adapter.js';
import { createAccountSnapshotService } from '../remote-account-snapshot/account-snapshot-contract.js';
import { createSupabaseAccountSnapshotAdapter } from '../remote-account-snapshot/adapters/supabase-account-snapshot-adapter.js';
import { createLicenseService } from '../license/license-contract.js';
import { createSupabaseLicenseAdapter } from '../license/adapters/supabase-license-adapter.js';
import { createLicenseRepository } from '../domain/license/license-repository.js';
import { createProfileService } from '../profile/profile-contract.js';
import { createSupabaseProfileAdapter } from '../profile/adapters/supabase-profile-adapter.js';
import { createProfileRepository } from '../domain/profile/profile-repository.js';
import { createPageSourceService } from '../page-source/page-source-contract.js';
import { createSupabasePageSourceAdapter } from '../page-source/adapters/supabase-page-source-adapter.js';
import { createPageSourceRepository } from '../domain/page-source/page-source-repository.js';
import { createAudioSourceService } from '../audio-source/audio-source-contract.js';
import { createSupabaseAudioSourceAdapter } from '../audio-source/adapters/supabase-audio-source-adapter.js';
import { createAudioSourceRepository } from '../domain/audio-source/audio-source-repository.js';
import { createVideoSourceService } from '../video-source/video-source-contract.js';
import { createSupabaseVideoSourceAdapter } from '../video-source/adapters/supabase-video-source-adapter.js';
import { createVideoSourceRepository } from '../domain/video-source/video-source-repository.js';
import { createWorksheetAttemptService } from '../worksheet-attempt/worksheet-attempt-contract.js';
import { createSupabaseWorksheetAttemptAdapter } from '../worksheet-attempt/adapters/supabase-worksheet-attempt-adapter.js';
import { createWorksheetAttemptRepository } from '../domain/worksheet-attempt/worksheet-attempt-repository.js';
import { createUnitAttemptService } from '../unit-attempt/unit-attempt-contract.js';
import { createSupabaseUnitAttemptAdapter } from '../unit-attempt/adapters/supabase-unit-attempt-adapter.js';
import { createUnitAttemptRepository } from '../domain/unit-attempt/unit-attempt-repository.js';
import { createReaderPositionService } from '../reader-position/reader-position-contract.js';
import { createSupabaseReaderPositionAdapter } from '../reader-position/adapters/supabase-reader-position-adapter.js';
import { createReaderPositionRepository } from '../domain/reader-position/reader-position-repository.js';
import { createBookmarkService } from '../bookmark/bookmark-contract.js';
import { createSupabaseBookmarkAdapter } from '../bookmark/adapters/supabase-bookmark-adapter.js';
import { createBookmarkRepository } from '../domain/bookmark/bookmark-repository.js';
import { createStudyWorkspaceService } from '../study-workspace/study-workspace-contract.js';
import { createSupabaseStudyWorkspaceAdapter } from '../study-workspace/adapters/supabase-study-workspace-adapter.js';
import { createStudyWorkspaceRepository } from '../domain/study-workspace/study-workspace-repository.js';
import { createAccountLinkingFlow } from './account-linking/account-linking-flow.js';
import { mountAppShell } from './app-shell.js';
import { mountScreenRouter } from './screen-router.js';
// American Language Hub — solo para el hook de verificación manual
// (§ más abajo). Sin ninguna otra conexión con el resto del arranque
// todavía — la worksheet no participa en ningún flujo real de
// navegación hasta que se resuelva su integración con el Reader.
import { createWorksheetScreen } from '../presentation/screens/worksheet/worksheet-screen.js';
import { ALH_LEVEL_1_UNIT_1 } from '../domain/worksheet-content/alh-level-1-unit-1.js';

function bootstrap() {
  // a. Config pública — resuelve base path para GitHub Pages.
  const runtimeConfig = createRuntimeConfig();

  // b. Event bus — todo lo demás lo consume por inyección, nunca
  //    como singleton global importado directamente.
  const eventBus = createEventBus();
  const errorBoundary = createErrorBoundary(eventBus);

  // Persistence: el contrato queda listo desde Sprint 1. Sprint 4
  // añadió la Session; Sprint 5 (Exercise Engine) añade Attempts —
  // el historial append-only del que Progress (real, por fin) y
  // Error Record (vista derivada, nunca almacenada aparte) dependen.
  const storageAdapter = createLocalStorageAdapter();
  const storage = createStorageContract(storageAdapter, errorBoundary);
  const sessionRepository = createSessionRepository(storage);
  const attemptRepository = createAttemptRepository(storage);

  // Sprint 6 (Authentication): capa desacoplada del proveedor —
  // Supabase es la primera (y hoy única) implementación real del
  // contrato de auth. Sustituir el proveedor en el futuro se limita
  // a construir un adapter distinto aquí; auth-contract.js, el resto
  // de app/ y toda otra capa permanecen sin cambios.
  const supabaseAuthAdapter = createSupabaseAuthAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
    supabaseAnonKey: runtimeConfig.env.supabaseAnonKey,
  });
  const authContract = createAuthContract({ adapter: supabaseAuthAdapter, storage, errorBoundary });

  // Capacidad remota MÍNIMA (Sprint 6 Plan, Opción A) — solo lo que
  // el flujo de vinculación de cuenta necesita para leer/escribir el
  // snapshot de una cuenta una sola vez. Deliberadamente no es la
  // capa de Sync (todavía sin diseñar); vive fuera de app/ porque es
  // infraestructura, no un flujo de aplicación.
  const supabaseSnapshotAdapter = createSupabaseAccountSnapshotAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
    supabaseAnonKey: runtimeConfig.env.supabaseAnonKey,
  });
  const accountSnapshotService = createAccountSnapshotService(supabaseSnapshotAdapter, errorBoundary);

  // Sistema de Licencias por Libro (esta sesión) — reemplaza por
  // completo LibraryAccess/authorized_users. Mismo patrón contrato +
  // adapter que el resto de la infraestructura remota de este
  // archivo; la seguridad real de la activación vive en la función
  // de Postgres `activate_license` (SECURITY DEFINER, bloqueo de
  // fila), nunca en este adapter — ver
  // docs/license-keys-schema.sql.
  const supabaseLicenseAdapter = createSupabaseLicenseAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
    supabaseAnonKey: runtimeConfig.env.supabaseAnonKey,
  });
  const licenseService = createLicenseService(supabaseLicenseAdapter, errorBoundary);
  const licenseRepository = createLicenseRepository(licenseService);

  // Perfil de Usuario (esta sesión): mismo patrón contrato + adapter
  // que el resto de la infraestructura remota. A diferencia de
  // License, aquí un INSERT/UPDATE directo del cliente es seguro
  // (RLS ya garantiza que solo se toca la propia fila) — sin
  // necesidad de ninguna función de Postgres.
  const supabaseProfileAdapter = createSupabaseProfileAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
    supabaseAnonKey: runtimeConfig.env.supabaseAnonKey,
  });
  const profileService = createProfileService(supabaseProfileAdapter, errorBoundary);
  const profileRepository = createProfileRepository(profileService);

  // Nuevo Reader (Sprint Proposal aprobado, Etapa 2): PageSource,
  // bucket público — Technical Specification v2.0, "el Reader
  // necesita una fuente capaz de proporcionar la representación
  // visual de una página." Hoy, WEBP en Supabase Storage; el
  // contrato permanece estable si esa implementación cambia en el
  // futuro (§ aclaración de esta sesión).
  const supabasePageSourceAdapter = createSupabasePageSourceAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
  });
  const pageSourceService = createPageSourceService(supabasePageSourceAdapter, errorBoundary);
  const pageSourceRepository = createPageSourceRepository(pageSourceService);

  // AudioSource (corrección de esta sesión): mismo patrón exacto que
  // PageSource — antes, el panel de audio construía la URL de
  // Supabase directamente, una fuga de detalles de infraestructura
  // hacia un componente de presentación. Ahora la resolución queda
  // centralizada aquí, igual que todo lo demás.
  const supabaseAudioSourceAdapter = createSupabaseAudioSourceAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
  });
  const audioSourceService = createAudioSourceService(supabaseAudioSourceAdapter, errorBoundary);
  const audioSourceRepository = createAudioSourceRepository(audioSourceService);

  // VideoSource (American Language Hub, esta sesión): mismo patrón
  // exacto que AudioSource — reutiliza el mismo helper compartido de
  // construcción de URL. Hi! Korean nunca lo importa ni lo necesita.
  const supabaseVideoSourceAdapter = createSupabaseVideoSourceAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
  });
  const videoSourceService = createVideoSourceService(supabaseVideoSourceAdapter, errorBoundary);
  const videoSourceRepository = createVideoSourceRepository(videoSourceService);

  // WorksheetAttempt (esta sesión): persistencia de intentos de
  // ejercicios de worksheet, exclusivo de American Language Hub —
  // tabla propia (worksheet_exercise_attempts), mismo patrón que
  // BookmarkRepository (necesita supabaseAnonKey además de la URL,
  // a diferencia de PageSource/AudioSource/VideoSource, que solo
  // construyen URLs públicas determinísticas).
  const supabaseWorksheetAttemptAdapter = createSupabaseWorksheetAttemptAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
    supabaseAnonKey: runtimeConfig.env.supabaseAnonKey,
  });
  const worksheetAttemptService = createWorksheetAttemptService(supabaseWorksheetAttemptAdapter, errorBoundary);
  const worksheetAttemptRepository = createWorksheetAttemptRepository(worksheetAttemptService);

  // Control de Intentos por Unidad (esta sesión): tabla aislada,
  // responsabilidad separada de worksheetAttemptRepository — cuántas
  // pasadas completas, no qué respondió en cada ejercicio. El único
  // incremento legítimo pasa por increment_unit_attempt()
  // (SECURITY DEFINER), nunca un UPDATE directo del cliente.
  const supabaseUnitAttemptAdapter = createSupabaseUnitAttemptAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
    supabaseAnonKey: runtimeConfig.env.supabaseAnonKey,
  });
  const unitAttemptService = createUnitAttemptService(supabaseUnitAttemptAdapter, errorBoundary);
  const unitAttemptRepository = createUnitAttemptRepository(unitAttemptService);

  // ReaderPosition, Supabase puro (esta sesión): a diferencia de
  // todo lo demás compuesto en este archivo, esta entidad
  // deliberadamente no recibe ninguna capa local — ni storage, ni
  // fallback. Mismo patrón contrato + adapter que el resto, con esa
  // única diferencia intencional.
  const supabaseReaderPositionAdapter = createSupabaseReaderPositionAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
    supabaseAnonKey: runtimeConfig.env.supabaseAnonKey,
  });
  const readerPositionService = createReaderPositionService(supabaseReaderPositionAdapter, errorBoundary);
  const readerPositionRepository = createReaderPositionRepository(readerPositionService);

  // Marcadores (Sprint Proposal — Nuevo Reader, Etapa 5): primera
  // entidad de esta sesión que el propio estudiante escribe en
  // tiempo real, no solo lee — mismo patrón contrato + adapter, tabla
  // granular en vez de blob (ver supabase-bookmark-adapter.js).
  const supabaseBookmarkAdapter = createSupabaseBookmarkAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
    supabaseAnonKey: runtimeConfig.env.supabaseAnonKey,
  });
  const bookmarkService = createBookmarkService(supabaseBookmarkAdapter, errorBoundary);
  const bookmarkRepository = createBookmarkRepository(bookmarkService);

  // Espacio de Estudio (Sprint Proposal — Nuevo Reader, Etapa 6):
  // Database para notas + Storage privado para imágenes, ya resuelto
  // en la Technical Specification v2.1, §5.4/§13.
  const supabaseStudyWorkspaceAdapter = createSupabaseStudyWorkspaceAdapter({
    supabaseUrl: runtimeConfig.env.supabaseUrl,
    supabaseAnonKey: runtimeConfig.env.supabaseAnonKey,
  });
  const studyWorkspaceService = createStudyWorkspaceService(supabaseStudyWorkspaceAdapter, errorBoundary);
  const studyWorkspaceRepository = createStudyWorkspaceRepository(studyWorkspaceService);

  const accountLinkingFlow = createAccountLinkingFlow({
    attemptRepository,
    accountSnapshotService,
  });

  // c. Router — inicializado pero sin resolver ninguna ruta todavía;
  //    eso ocurre explícitamente en el paso (f).
  const router = createRouter(eventBus, errorBoundary);

  // d. Monta el app shell en el punto de montaje del DOM.
  const mountElement = document.getElementById('app-root');
  if (!mountElement) {
    // No hay dónde montar nada: esto sí engañaría al estudiante si
    // se ignorara (Software Architecture §18.2, caso "must-surface
    // inmediato"), aunque en Sprint 1 solo llegue a la consola.
    errorBoundary.reportMustSurface({ reason: 'missing-mount-point' });
    return;
  }

  const { contentRegion } = mountAppShell({ eventBus, mountElement, router, authContract });

  // Sprint 2: resuelve qué screen se monta en contentRegion según
  // route:changed (Library, Book, o el placeholder de Home). Se
  // suscribe antes de router.start() para no perderse la resolución
  // de la ruta inicial (mismo orden que la suscripción de
  // mountAppShell arriba). Sprint 4 añade sessionRepository (Restore
  // Session, Home real) y runtimeConfig (resolución de assets de
  // Media, §21.2) a sus dependencias.
  mountScreenRouter({
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
    worksheetAttemptRepository,
    unitAttemptRepository,
    readerPositionRepository,
    bookmarkRepository,
    studyWorkspaceRepository,
  });

  // f. El router resuelve la ruta inicial y publica route:changed.
  router.start();

  // g. Aplicación arrancada e interactiva.
  eventBus.publish(EVENT_NAMES.APP_READY, { basePath: runtimeConfig.basePath });

  // Expuesto solo para verificación manual (Sprint 1 §7: "validación
  // manual del flujo de arranque"), nunca para que otro módulo del
  // proyecto dependa de un global. pageSourceRepository se añade
  // aquí para la Etapa 2 del Sprint del Nuevo Reader — verificación
  // manual de que resuelve una imagen real desde Supabase Storage,
  // antes de que exista ninguna pantalla que lo consuma (Etapa 7).
  window.__atlasLearning = Object.freeze({
    router,
    eventBus,
    storage,
    sessionRepository,
    attemptRepository,
    authContract,
    pageSourceRepository,
    audioSourceRepository,
    readerPositionRepository,
    bookmarkRepository,
    studyWorkspaceRepository,
    licenseRepository,
    profileRepository,
    // American Language Hub — Unidad 1, sin flujo de navegación real
    // todavía. previewWorksheet() la monta directamente sobre <body>,
    // reemplazando lo que la app esté mostrando, solo para
    // verificación manual — nunca se usa así en producción.
    createWorksheetScreen,
    ALH_LEVEL_1_UNIT_1,
    videoSourceRepository,
    worksheetAttemptRepository,
    unitAttemptRepository,
    previewWorksheet: () => {
      const session = authContract.getSession();
      const screen = createWorksheetScreen({
        unit: ALH_LEVEL_1_UNIT_1,
        videoSourceRepository,
        worksheetAttemptRepository,
        unitAttemptRepository,
        userId: session?.userId ?? null,
        accessToken: session?.accessToken ?? null,
      });
      document.body.replaceChildren(screen.element);
      return screen;
    },
  });
}

bootstrap();
