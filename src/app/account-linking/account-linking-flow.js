/**
 * app/account-linking/account-linking-flow.js
 *
 * Flujo de aplicación (Sprint 6 Plan) que reconcilia los datos
 * locales huérfanos con la cuenta que acaba de iniciar sesión. Se
 * ejecuta UNA sola vez por evento de login exitoso.
 *
 * Alcance reducido (esta sesión — ReaderPosition migra a Supabase
 * puro, sin localStorage): la reconciliación de `Session` se retiró
 * por completo. `ReaderPosition` ya no puede generar un huérfano
 * local (no vive en local en absoluto), así que no tiene nada que
 * este flujo deba fusionar, restaurar ni preguntar. Lo único que
 * este flujo sigue reconciliando es `Attempts` — el resto del
 * progreso del estudiante, deliberadamente sin tocar en esta sesión
 * (decisión explícita: "no modifiques todavía la estrategia de
 * persistencia del resto").
 *
 * Máquina de estados (determinista, idempotente, segura ante
 * interrupciones):
 *
 *   AUTH_SUCCESS → INSPECT_LOCAL (solo Attempts)
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

export function createAccountLinkingFlow({ attemptRepository, accountSnapshotService }) {
  let pendingDecision = null; // null | { userId, accessToken, remoteSnapshot }

  function buildLocalSnapshotPayload(userId) {
    const attempts = attemptRepository.getOwnAttempts(userId);
    return { attempts };
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
    return attemptRepository.getOrphanAttempts().length > 0;
  }

  function hasRemoteData(remoteSnapshot) {
    return Boolean(remoteSnapshot) && (remoteSnapshot.attempts?.length ?? 0) > 0;
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
      await uploadSnapshot(userId, accessToken);
      return;
    }

    if (!localHasOrphan && remoteHasData) {
      // Caso 2
      attemptRepository.mergeRemoteAttempts(userId, remoteSnapshot.attempts ?? []);
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
      await uploadSnapshot(userId, accessToken);
    } else if (choice === 'discard') {
      attemptRepository.discardOrphanAttempts();
      attemptRepository.mergeRemoteAttempts(userId, remoteSnapshot.attempts ?? []);
    }

    pendingDecision = null;
  }

  return Object.freeze({ run, hasPendingDecision, resolvePendingDecision });
}
