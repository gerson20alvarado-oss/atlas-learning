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
import { resolvePageMarkers } from '../../../domain/page-layout/page-marker-resolver.js';
import { createAnchorPlacementStrategy } from '../../../domain/page-layout/anchor-placement-strategy.js';
import { getPageResources } from '../../../domain/content/page-resource-catalog.js';

export function createPageReaderScreen({
  bookId,
  initialPageNumber,
  firstPage,
  lastPage,
  userId,
  accessToken,
  runtimeConfig,
  pageSourceRepository,
  readerPositionRepository,
  bookmarkRepository,
  studyWorkspaceRepository,
  attemptRepository,
  onBack,
}) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'page-reader-screen');

  const chrome = document.createElement('div');
  chrome.setAttribute('data-part', 'chrome');

  const backNav = createBackNav({ parentLabel: 'library', onSelect: onBack });

  const bookmarkButton = document.createElement('button');
  bookmarkButton.type = 'button';
  bookmarkButton.setAttribute('data-part', 'bookmark-toggle');

  const pageIndicator = document.createElement('span');
  pageIndicator.setAttribute('data-part', 'page-indicator');
  pageIndicator.className = 'al-type-ui-caption';

  chrome.appendChild(backNav.element);
  chrome.appendChild(pageIndicator);
  chrome.appendChild(bookmarkButton);

  const canvasContainer = document.createElement('div');
  canvasContainer.setAttribute('data-part', 'canvas-container');

  const img = document.createElement('img');
  img.setAttribute('data-part', 'canvas');

  const markerStrategy = createAnchorPlacementStrategy();
  const markerLayer = createPageMarkerLayer({ markers: [], onSelect: handleResourceSelect });

  canvasContainer.appendChild(img);
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

  readerBody.appendChild(canvasContainer);
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
  let activePanel = null; // modal centrado: audio, transcripción
  let activeSidePanel = null; // panel lateral: Espacio de Estudio, exclusivamente

  function closeActivePanel() {
    activePanel?.destroy();
    activePanel = null;
  }

  function closeSidePanel() {
    activeSidePanel?.destroy();
    activeSidePanel = null;
    sidePanelSlot.replaceChildren();
    sidePanelSlot.hidden = true;
    readerBody.removeAttribute('data-side-panel-open');
  }

  function handleResourceSelect(resource) {
    if (resource.type === 'audio') {
      closeActivePanel();
      activePanel = createAudioPanel({ resource, runtimeConfig, onClose: closeActivePanel });
      element.appendChild(activePanel.element);
    } else if (resource.type === 'transcript') {
      closeActivePanel();
      activePanel = createTranscriptPanel({ resource, onClose: closeActivePanel });
      element.appendChild(activePanel.element);
    } else if (resource.type === 'studyWorkspace') {
      // Reabrir sobre la misma página no debe apilar paneles.
      closeSidePanel();
      const answerKeyResource = getPageResources(bookId, currentPage).find((r) => r.type === 'answerKey');
      const sheet = createStudyWorkspaceSheet({
        resource,
        answerKeyResource,
        bookId,
        pageNumber: currentPage,
        userId,
        accessToken,
        attemptRepository,
        studyWorkspaceRepository,
      });
      const panel = createSidePanel({ title: 'Espacio de Estudio', onClose: closeSidePanel });
      panel.setContent(sheet.element);
      activeSidePanel = { destroy: () => { sheet.destroy(); panel.destroy(); } };
      sidePanelSlot.hidden = false;
      sidePanelSlot.replaceChildren(panel.element);
      readerBody.setAttribute('data-side-panel-open', 'true');
    }
    // answerKey (u otro tipo sin marcador propio): nunca debería llegar aquí.
  }

  async function renderCurrentPage() {
    closeActivePanel();
    closeSidePanel();
    prevButton.disabled = currentPage <= firstPage;
    nextButton.disabled = currentPage >= lastPage;
    pageIndicator.textContent = `Página ${currentPage}`;
    img.alt = `Página ${currentPage} del libro`;

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
    closeActivePanel();
    closeSidePanel();
    backNav.destroy();
    markerLayer.destroy();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}
