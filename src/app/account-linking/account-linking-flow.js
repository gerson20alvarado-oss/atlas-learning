/**
 * app/account-linking/account-linking-flow.js
 *
 * Flujo de aplicación (Sprint 6 Plan) que reconcilia los datos
 * locales huérfanos (creados durante los Sprints 1-5, antes de que
 * existiera Authentication) con la cuenta que acaba de iniciar
 * sesión. Se ejecuta UNA sola vez por evento de login exitoso, antes
 * de que Session hidrate o cualquier screen renderice (mismo punto
 * de inserción que Software Architecture §13.4 ya describe para la
 * restauración de Session).
 *
 * No pertenece a Auth (que solo posee identidad/token) ni a Sync
 * (que reconcilia de forma continua y en segundo plano — todavía no
 * diseñada). Es su propio flujo, de una sola ejecución, orquestado
 * aquí porque `app/` es el único lugar que ya conoce Persistence
 * (session-repository, attempt-repository) y el servicio de snapshot
 * remoto a la vez, sin que ninguna de esas capas tenga que conocerse
 * entre sí.
 *
 * Máquina de estados (determinista, idempotente, segura ante
 * interrupciones — ninguna escritura destructiva ocurre hasta el
 * último paso de cada rama; interrumpir el proceso antes de
 * completarlo simplemente repite el mismo análisis en el
 * siguiente login, nunca deja un estado intermedio corrupto):
 *
 *   AUTH_SUCCESS → INSPECT_LOCAL
 *     → ¿datos ajenos (de otra cuenta)? → sí → descartados en silencio
 *     → CHECK_REMOTE
 *         local:no  remoto:no  → nada que hacer
 *         local:sí  remoto:no  → TAG_LOCAL           (Caso 1)
 *         local:no  remoto:sí  → HYDRATE_FROM_REMOTE (Caso 2)
 *         local:sí  remoto:sí  → espera decisión del estudiante (Caso 3)
 *     → LINKING_COMPLETE
 *
 * Si CHECK_REMOTE no puede verificarse (fallo de red), no se
 * bloquea al estudiante: se procede con los datos locales tal cual
 * están y se reintenta en un login posterior (C6).
 */

export function createAccountLinkingFlow({ sessionRepository, attemptRepository, accountSnapshotService }) {
  let pendingDecision = null; // null | { userId, accessToken, remoteSnapshot }

  function buildLocalSnapshotPayload(userId) {
    const attempts = attemptRepository.getOwnAttempts(userId);
    const session = sessionRepository.getSession();
    return {
      attempts,
      session: session?.userId === userId ? session : null,
    };
  }

  async function uploadSnapshot(userId, accessToken) {
    const payload = buildLocalSnapshotPayload(userId);
    const wrote = await accountSnapshotService.writeSnapshot({ userId, accessToken, payload });
    if (wrote) {
      attemptRepository.markAttemptsSynced(payload.attempts.map((a) => a.id));
    }
    return wrote;
  }

  function hasLocalOrphanData() {
    if (attemptRepository.getOrphanAttempts().length > 0) return true;
    const localSession = sessionRepository.getSession();
    return Boolean(localSession && localSession.userId === null);
  }

  function hasRemoteData(remoteSnapshot) {
    return Boolean(remoteSnapshot) && ((remoteSnapshot.attempts?.length ?? 0) > 0 || Boolean(remoteSnapshot.session));
  }

  /**
   * Punto de entrada — se llama una vez por cada transición de Auth
   * hacia una sesión válida (ver app/screen-router.js, suscrito a
   * `onAuthStateChange`). Es seguro llamarlo más de una vez para la
   * misma cuenta: tras la primera vinculación exitosa no quedan datos
   * huérfanos ni ajenos, así que las siguientes ejecuciones no
   * encuentran nada que reconciliar (idempotencia por construcción,
   * no por un mecanismo de "ya se ejecutó" separado).
   */
  async function run(authSession) {
    const { userId, accessToken } = authSession;

    // Dispositivo compartido: los datos de otra cuenta nunca se
    // fusionan ni se muestran — se descartan en silencio antes de
    // continuar, como si el dispositivo estuviera vacío para esta
    // cuenta (Sprint 6 Plan, quinto escenario aprobado).
    attemptRepository.discardForeignAttempts(userId);
    const currentSession = sessionRepository.getSession();
    if (currentSession?.userId && currentSession.userId !== userId) {
      sessionRepository.clearSession();
    }

    const localHasOrphan = hasLocalOrphanData();
    const remoteSnapshot = await accountSnapshotService.readSnapshot({ userId, accessToken });

    if (remoteSnapshot === undefined) {
      // Fallo de red: no se bloquea al estudiante ni se asume nada.
      // Se reintenta en un login posterior.
      return;
    }

    const remoteHasData = hasRemoteData(remoteSnapshot);

    if (!localHasOrphan && !remoteHasData) {
      return;
    }

    if (localHasOrphan && !remoteHasData) {
      // Caso 1
      attemptRepository.claimOrphanAttempts(userId);
      const session = sessionRepository.getSession();
      if (session?.userId === null) sessionRepository.saveSession({ userId });
      await uploadSnapshot(userId, accessToken);
      return;
    }

    if (!localHasOrphan && remoteHasData) {
      // Caso 2
      attemptRepository.mergeRemoteAttempts(userId, remoteSnapshot.attempts ?? []);
      if (remoteSnapshot.session) {
        sessionRepository.saveSession({ ...remoteSnapshot.session, userId });
      }
      return;
    }

    // Caso 3 — ambos tienen datos: nunca se decide en silencio.
    pendingDecision = { userId, accessToken, remoteSnapshot };
  }

  function hasPendingDecision() {
    return pendingDecision !== null;
  }

  /**
   * `choice`: 'merge' | 'discard' — invocado únicamente desde la
   * pantalla de confirmación (Presentation), nunca elegido
   * automáticamente.
   */
  async function resolvePendingDecision(choice) {
    if (!pendingDecision) return;
    const { userId, accessToken, remoteSnapshot } = pendingDecision;

    if (choice === 'merge') {
      // Cada Attempt es un hecho histórico aditivo — la unión de
      // ambos historiales nunca pierde información y nunca puede
      // empeorar el Progress ya alcanzado en ninguno de los dos
      // orígenes.
      attemptRepository.claimOrphanAttempts(userId);
      attemptRepository.mergeRemoteAttempts(userId, remoteSnapshot.attempts ?? []);

      const localSession = sessionRepository.getSession();
      const remoteSession = remoteSnapshot.session;
      if (remoteSession && (!localSession?.updatedAt || remoteSession.updatedAt > localSession.updatedAt)) {
        sessionRepository.saveSession({ ...remoteSession, userId });
      } else if (localSession) {
        sessionRepository.saveSession({ userId });
      }

      await uploadSnapshot(userId, accessToken);
    } else if (choice === 'discard') {
      attemptRepository.discardOrphanAttempts();
      sessionRepository.clearSession();
      attemptRepository.mergeRemoteAttempts(userId, remoteSnapshot.attempts ?? []);
      if (remoteSnapshot.session) {
        sessionRepository.saveSession({ ...remoteSnapshot.session, userId });
      }
    }

    pendingDecision = null;
  }

  return Object.freeze({ run, hasPendingDecision, resolvePendingDecision });
}
