/**
 * app/mount-quick-activity-nav.js
 *
 * Composición de la navegación rápida entre actividades (esta
 * sesión) — mismo rol que mountAppShell/mountScreenRouter: el único
 * lugar que conoce tanto el router/eventBus como el contenido de las
 * unidades. `quick-activity-nav.js` (presentación) nunca importa
 * nada de esto ni sabe que "Writing"/"Worksheet"/"Progress Test"
 * existen — solo recibe `{ unitNumber, unitTitle, activities:
 * [{id, label, url, isActive}] }` ya resuelto.
 *
 * Deliberadamente fuera de screen-router.js: no participa de la
 * resolución de qué screen se monta en content-region, se limita a
 * observar `ROUTE_CHANGED` (evento de solo lectura, el mismo que ya
 * consume app-shell.js) y a decidir si el widget flotante debe
 * mostrarse — nunca modifica la pantalla activa ni es modificado por
 * ella.
 */

import { createQuickActivityNav } from '../presentation/components/quick-activity-nav/quick-activity-nav.js';
import { getBookById } from '../domain/content/content-repository.js';
import {
  getWorksheetUnit,
  getWriting,
  listAssessmentIds,
  getAssessment,
} from '../domain/worksheet-content/worksheet-content-repository.js';
import { EVENT_NAMES } from '../core/events/event-names.js';

const NEIGHBOR_RADIUS = 1; // unidad anterior y siguiente, además de la actual

/**
 * Resuelve las actividades reales de una unidad (Writing + cada
 * evaluación declarada, en orden), o `null` si la unidad no existe
 * en el contenido — nunca una unidad "fantasma" en el panel.
 */
function resolveUnitActivities({ bookId, unitNumber, currentActivityId }) {
  const unit = getWorksheetUnit(bookId, unitNumber);
  if (!unit) return null;

  const activities = [];

  const writing = getWriting(bookId, unitNumber);
  if (writing) {
    activities.push({
      id: 'writing',
      label: writing.title,
      url: `/book/${bookId}/writing/${unitNumber}`,
      isActive: currentActivityId === 'writing',
    });
  }

  listAssessmentIds(bookId, unitNumber).forEach((assessmentId) => {
    const assessment = getAssessment(bookId, unitNumber, assessmentId);
    if (!assessment) return;
    const url =
      assessmentId === 'worksheet'
        ? `/book/${bookId}/read/${unitNumber}`
        : `/book/${bookId}/read/${unitNumber}/${assessmentId}`;
    activities.push({
      id: assessmentId,
      label: assessment.assessmentTitle,
      url,
      isActive: currentActivityId === assessmentId,
    });
  });

  if (activities.length === 0) return null;

  return {
    unitNumber: unit.unitNumber,
    unitTitle: unit.unitTitle,
    isCurrent: false, // se marca por quien llama, ver buildUnitsProp()
    activities,
  };
}

function buildUnitsProp({ bookId, currentUnitNumber, currentActivityId }) {
  const units = [];
  for (let n = currentUnitNumber - NEIGHBOR_RADIUS; n <= currentUnitNumber + NEIGHBOR_RADIUS; n++) {
    if (n < 1) continue;
    const resolved = resolveUnitActivities({
      bookId,
      unitNumber: n,
      currentActivityId: n === currentUnitNumber ? currentActivityId : null,
    });
    if (resolved) units.push({ ...resolved, isCurrent: n === currentUnitNumber });
  }
  return units;
}

/**
 * Deriva `{ bookId, currentUnitNumber, currentActivityId }` desde la
 * Navigation State — o `null` si la ruta actual no es una actividad
 * de una unidad con `contentMode: 'worksheet'` (el widget nunca
 * aparece en Hi! Korean, Library, Admin, etc.).
 */
function resolveCurrentActivity(navigationState) {
  const { bookPosition, pagePosition, assessmentPosition, writingUnitPosition } = navigationState;
  if (!bookPosition) return null;

  const book = getBookById(bookPosition);
  if (book?.contentMode !== 'worksheet') return null;

  if (writingUnitPosition != null) {
    return { bookId: bookPosition, currentUnitNumber: writingUnitPosition, currentActivityId: 'writing' };
  }

  if (pagePosition != null) {
    return {
      bookId: bookPosition,
      currentUnitNumber: pagePosition,
      currentActivityId: assessmentPosition ?? 'worksheet',
    };
  }

  return null;
}

export function mountQuickActivityNav({ eventBus, mountElement, router }) {
  const nav = createQuickActivityNav({
    units: [],
    onSelect: (url) => router.navigateTo(url),
  });
  mountElement.appendChild(nav.element);

  function refresh(navigationState) {
    const current = resolveCurrentActivity(navigationState);
    if (!current) {
      nav.update({ units: [], currentUnitNumber: null });
      return;
    }
    const units = buildUnitsProp(current);
    nav.update({ units, currentUnitNumber: current.currentUnitNumber });
  }

  const unsubscribe = eventBus.subscribe(EVENT_NAMES.ROUTE_CHANGED, refresh);

  return Object.freeze({
    unsubscribe: () => {
      unsubscribe();
      nav.destroy();
    },
  });
}
