/**
 * presentation/screens/page-reader/page-reader-screen.js
 *
 * Pantalla principal del nuevo Reader (Sprint Proposal — Nuevo
 * Reader, Etapas 7–9 combinadas). Muestra la página real vía
 * `PageSource`, dibuja los marcadores resueltos de `PageResource`, y
 * despacha al panel correspondiente al tocar uno — sin conocer
 * Exercise Engine, Storage, ni Supabase directamente: cada panel
 * resuelve lo suyo, esta pantalla solo los monta.
 *
 * Navegación de página como estado interno (mismo patrón ya usado en
 * la Learning Session heredada para `currentIndex`) — el número de
 * página inicial llega ya resuelto desde app/screen-router.js
 * (última página visitada, o `firstPage` si no hay ninguna); cambiar
 * de página no cambia de ruta, solo actualiza `ReaderPosition`.
 *
 * ReaderPosition, Supabase puro (esta sesión): cada cambio de página
 * escribe directo a Supabase, sin ninguna capa local — `readerPositionRepository`
 * es el único lugar de donde viene y a donde va esa posición.
 */

import { createBackNav } from '../../components/back-nav/back-nav.js';
import { createPageMarkerLayer } from '../../components/page-marker-layer/page-marker-layer.js';
import { createAudioPanel } from '../../components/resource-panels/audio-panel.js';
import { createTranscriptPanel } from '../../components/resource-panels/transcript-panel.js';
import { createStudyWorkspaceSheet } from '../../components/resource-panels/study-workspace-sheet.js';
import { createSidePanel } from '../../components/side-panel/side-panel.js';
import { createAudioDrawer } from '../../components/audio-drawer/audio-drawer.js';
import { createStudyNoteIcon } from '../../components/icons/study-note-icon.js';
import { createPageNavigator } from '../../components/page-navigator/page-navigator.js';
import { resolvePageMarkers } from '../../../domain/page-layout/page-marker-resolver.js';
import { createAnchorPlacementStrategy } from '../../../domain/page-layout/anchor-placement-strategy.js';
import { getPageResources } from '../../../domain/content/page-resource-catalog.js';
import { getBookById } from '../../../domain/content/content-repository.js';

export function createPageReaderScreen({
  bookId,
  initialPageNumber,
  firstPage,
  lastPage,
  userId,
  accessToken,
  pageSourceRepository,
  audioSourceRepository,
  readerPositionRepository,
  bookmarkRepository,
  studyWorkspaceRepository,
  onBack,
}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'page-reader-screen');

  // Reader Visual Polish (esta sesión): tinte atmosférico por libro —
  // lectura de contenido pura (mismo tipo de llamada que ya usan
  // otras screens para coverAssetPath), nunca un sistema de temas.
  // Sin el campo, el CSS ya trae su propio valor por defecto
  // (tokens.css, --al-reader-bg-tint-default) — esta línea nunca
  // rompe nada si el libro no lo declara.
  const book = getBookById(bookId);
  if (book?.themeAccent) {
    element.style.setProperty('--al-reader-bg-tint', book.themeAccent);
  }

  const chrome = document.createElement('div');
  chrome.setAttribute('data-part', 'chrome');

  const backNav = createBackNav({ parentLabel: 'library', onSelect: onBack });

  const bookmarkButton = document.createElement('button');
  bookmarkButton.type = 'button';
  bookmarkButton.setAttribute('data-part', 'bookmark-toggle');

  const pageIndicatorContainer = document.createElement('div');
  pageIndicatorContainer.setAttribute('data-part', 'page-indicator-container');

  const pageIndicator = document.createElement('button');
  pageIndicator.type = 'button';
  pageIndicator.setAttribute('data-part', 'page-indicator');
  pageIndicator.className = 'al-type-ui-caption';
  pageIndicator.setAttribute('aria-label', 'Ir a una página específica');
  pageIndicator.addEventListener('click', togglePageNavigator);

  pageIndicatorContainer.appendChild(pageIndicator);

  chrome.appendChild(backNav.element);
  chrome.appendChild(pageIndicatorContainer);
  chrome.appendChild(bookmarkButton);

  const canvasContainer = document.createElement('div');
  canvasContainer.setAttribute('data-part', 'canvas-container');

  const img = document.createElement('img');
  img.setAttribute('data-part', 'canvas');

  // Rango navegable ampliado a todo el libro (esta sesión, Page
  // Navigator): solo las páginas 16-25 tienen imagen real subida a
  // Storage hoy. Un fallo de carga aquí no es un error de la
  // aplicación — es exactamente lo que el Sprint Proposal ya
  // anticipó ("el visor podrá recorrer cualquier página... solo las
  // páginas ya mapeadas mostrarán recursos"). Mismo aviso neutral que
  // ya usa el resto de Atlas, nunca un ícono de imagen rota.
  const pageUnavailableNotice = document.createElement('p');
  pageUnavailableNotice.setAttribute('data-part', 'page-unavailable');
  pageUnavailableNotice.className = 'al-type-ui-caption';
  pageUnavailableNotice.textContent = 'Esta página todavía no está disponible.';
  pageUnavailableNotice.hidden = true;
  img.addEventListener('error', () => {
    img.hidden = true;
    pageUnavailableNotice.hidden = false;
  });

  const markerStrategy = createAnchorPlacementStrategy();
  const markerLayer = createPageMarkerLayer({ markers: [], onSelect: handleResourceSelect });

  canvasContainer.appendChild(img);
  canvasContainer.appendChild(pageUnavailableNotice);
  canvasContainer.appendChild(markerLayer.element);

  // Espacio de Estudio (corrección de UX de esta sesión): panel
  // lateral acoplado, no un modal — readerBody es la fila flex que
  // hace posible que el Reader se encoja en vez de quedar cubierto
  // (page-reader-screen.css define el ancho exacto del panel).
  const readerBody = document.createElement('div');
  readerBody.setAttribute('data-part', 'reader-body');

  const sidePanelSlot = document.createElement('div');
  sidePanelSlot.setAttribute('data-part', 'side-panel-slot');
  sidePanelSlot.hidden = true;

  // Pestaña del Espacio de Estudio (corrección de UX de esta sesión):
  // asociada al Reader, no a la interfaz global — vive dentro de
  // readerBody, se destruye con la pantalla. Siempre visible mientras
  // se ve una página, en cualquier página (el Espacio de Estudio es
  // un cuaderno personal, ya no depende de qué recursos tenga esa
  // página en particular). Se oculta solo mientras el panel ya está
  // abierto, para no competir con su propio botón de cerrar.
  const studyWorkspaceTab = document.createElement('button');
  studyWorkspaceTab.type = 'button';
  studyWorkspaceTab.setAttribute('data-part', 'study-workspace-tab');
  studyWorkspaceTab.setAttribute('aria-label', 'Abrir Espacio de Estudio');
  studyWorkspaceTab.appendChild(createStudyNoteIcon());
  studyWorkspaceTab.addEventListener('click', openStudyWorkspace);

  readerBody.appendChild(canvasContainer);
  readerBody.appendChild(studyWorkspaceTab);
  readerBody.appendChild(sidePanelSlot);

  const navControls = document.createElement('div');
  navControls.setAttribute('data-part', 'nav-controls');

  const prevButton = document.createElement('button');
  prevButton.type = 'button';
  prevButton.setAttribute('data-part', 'prev');
  prevButton.textContent = '‹ Anterior';
  prevButton.addEventListener('click', () => goToPage(currentPage - 1));

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.setAttribute('data-part', 'next');
  nextButton.textContent = 'Siguiente ›';
  nextButton.addEventListener('click', () => goToPage(currentPage + 1));

  navControls.appendChild(prevButton);
  navControls.appendChild(nextButton);

  element.appendChild(chrome);
  element.appendChild(readerBody);
  element.appendChild(navControls);

  let currentPage = Math.min(Math.max(initialPageNumber, firstPage), lastPage);
  let bookmarkedPages = [];
  let activeAudioDrawer = null; // drawer inferior: exclusivo del audio
  let activeSidePanel = null; // panel lateral: Espacio de Estudio o Transcripción — mutuamente excluyentes, nunca dos sistemas de panel distintos
  let activePageNavigator = null; // popover: saltar a una página específica

  function closeAudioDrawer() {
    activeAudioDrawer?.destroy();
    activeAudioDrawer = null;
  }

  function closePageNavigator() {
    activePageNavigator?.destroy();
    activePageNavigator = null;
  }

  function togglePageNavigator() {
    if (activePageNavigator) {
      closePageNavigator();
      return;
    }
    activePageNavigator = createPageNavigator({
      currentPage,
      firstPage,
      lastPage,
      onNavigate: (pageNumber) => {
        closePageNavigator();
        goToPage(pageNumber);
      },
      onClose: closePageNavigator,
    });
    pageIndicatorContainer.appendChild(activePageNavigator.element);
  }

  function closeSidePanel() {
    activeSidePanel?.destroy();
    activeSidePanel = null;
    sidePanelSlot.replaceChildren();
    sidePanelSlot.hidden = true;
    readerBody.removeAttribute('data-side-panel-open');
    studyWorkspaceTab.hidden = false;
  }

  // Único mecanismo de panel lateral, reutilizado por Espacio de
  // Estudio y por Transcripción (corrección de UX de esta sesión) —
  // "no crear un segundo sistema de paneles" significa, en código,
  // que ambos pasan por esta misma función, nunca por una copia.
  function openSidePanel({ title, contentElement, onDestroyContent }) {
    closeSidePanel();
    const panel = createSidePanel({ title, onClose: closeSidePanel });
    panel.setContent(contentElement);
    activeSidePanel = { destroy: () => { onDestroyContent?.(); panel.destroy(); } };
    sidePanelSlot.hidden = false;
    sidePanelSlot.replaceChildren(panel.element);
    readerBody.setAttribute('data-side-panel-open', 'true');
    studyWorkspaceTab.hidden = true;
  }

  function openStudyWorkspace() {
    const answerKeyResource = getPageResources(bookId, currentPage).find((r) => r.type === 'answerKey');
    const sheet = createStudyWorkspaceSheet({
      answerKeyResource,
      bookId,
      pageNumber: currentPage,
      userId,
      accessToken,
      studyWorkspaceRepository,
    });
    openSidePanel({ title: 'Espacio de Estudio', contentElement: sheet.element, onDestroyContent: sheet.destroy });
  }

  function openTranscript(resource) {
    const panelContent = createTranscriptPanel({ resource });
    openSidePanel({
      title: `Transcripción — ${resource.pageTemplate}`,
      contentElement: panelContent.element,
      onDestroyContent: panelContent.destroy,
    });
  }

  function handleResourceSelect(resource) {
    if (resource.type === 'audio') {
      // Reabrir sobre la misma página no debe apilar drawers.
      closeAudioDrawer();
      const panelContent = createAudioPanel({ resource, audioSourceRepository });
      const drawer = createAudioDrawer({
        title: resource.pageTemplate,
        subtitle: resource.trackLabel,
        onClose: closeAudioDrawer,
      });
      drawer.setContent(panelContent.element);
      activeAudioDrawer = { destroy: () => { panelContent.destroy(); drawer.destroy(); } };
      element.appendChild(drawer.element);
    } else if (resource.type === 'transcript') {
      openTranscript(resource);
    }
    // studyWorkspace ya no se abre desde un marcador de página — ver
    // la pestaña fija del Reader (studyWorkspaceTab, corrección de UX
    // de esta sesión). answerKey (u otro tipo sin marcador propio):
    // nunca debería llegar aquí.
  }

  async function renderCurrentPage() {
    closeAudioDrawer();
    closeSidePanel();
    closePageNavigator();
    prevButton.disabled = currentPage <= firstPage;
    nextButton.disabled = currentPage >= lastPage;
    pageIndicator.textContent = `Página ${currentPage} de ${lastPage} ▾`;
    img.alt = `Página ${currentPage} del libro`;
    pageUnavailableNotice.hidden = true;
    img.hidden = false;

    const url = await pageSourceRepository.getPageImageUrl(bookId, currentPage);
    img.src = url ?? '';

    const markers = resolvePageMarkers(bookId, currentPage, markerStrategy);
    markerLayer.update({ markers });

    updateBookmarkButton();

    readerPositionRepository.savePosition({ userId, bookId, pageNumber: currentPage, accessToken });
  }

  function updateBookmarkButton() {
    const marked = bookmarkedPages.includes(currentPage);
    bookmarkButton.textContent = marked ? '★ Marcada' : '☆ Marcar página';
    bookmarkButton.setAttribute('aria-pressed', String(marked));
  }

  bookmarkButton.addEventListener('click', async () => {
    const marked = bookmarkedPages.includes(currentPage);
    if (marked) {
      await bookmarkRepository.removeBookmark({ userId, bookId, pageNumber: currentPage, accessToken });
      bookmarkedPages = bookmarkedPages.filter((p) => p !== currentPage);
    } else {
      await bookmarkRepository.addBookmark({ userId, bookId, pageNumber: currentPage, accessToken });
      bookmarkedPages = [...bookmarkedPages, currentPage];
    }
    updateBookmarkButton();
  });

  function goToPage(pageNumber) {
    if (pageNumber < firstPage || pageNumber > lastPage) return;
    currentPage = pageNumber;
    // Bug fix (esta sesión): mantiene la URL sincronizada con la
    // página real, para que un refresh restaure la posición correcta
    // en vez de la última página en la que el hash cambió de verdad
    // (savePosition() ya guardaba bien en Supabase — el problema era
    // que la URL nunca avanzaba). `history.replaceState` actualiza la
    // barra de direcciones sin disparar "hashchange" — a diferencia
    // de `router.navigateTo()`, no reconstruye la pantalla en cada
    // página; ningún otro archivo necesita tocarse para esto.
    window.history.replaceState(null, '', `#/book/${bookId}/read/${currentPage}`);
    renderCurrentPage();
  }

  // Carga inicial: Marcadores reales de la cuenta, luego la página.
  bookmarkRepository.getBookmarkedPages({ userId, bookId, accessToken }).then((pages) => {
    bookmarkedPages = pages;
    updateBookmarkButton();
  });
  renderCurrentPage();

  function update() {}

  function destroy() {
    closeAudioDrawer();
    closeSidePanel();
    closePageNavigator();
    backNav.destroy();
    markerLayer.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
