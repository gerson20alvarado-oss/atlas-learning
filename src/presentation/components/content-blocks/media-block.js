/**
 * presentation/components/content-blocks/media-block.js
 *
 * Media (Design System §19.5). Sprint 3 dejó "media" completamente
 * sin renderer porque no existía ningún asset real ("no hay assets
 * reales todavía... mismo fallback neutral", README de Sprint 3).
 * Sprint 4 introduce el primer asset real del Content Import Pipeline
 * (un mapa de Seúl extraído directamente del libro, p.22) — por eso
 * este componente implementa la variante `mediaType: 'image'` con la
 * especificación exacta del Design System (ancho completo de la
 * columna, radius-lg, borde solo si el propio borde de la imagen es
 * ambiguo, caption opcional en voz de lectura).
 *
 * Sprint 8 (Objetivo A) añade la variante `mediaType: 'audio'`,
 * implementando Design System §16 al detalle — como una rama más de
 * este mismo componente, nunca como un `audio-block.js` paralelo
 * (decisión de Producto explícita: media-block sigue siendo el único
 * responsable de todo contenido multimedia). `video` sigue sin asset
 * real y sigue mostrando el mismo aviso neutral — la Lección 1-1 no
 * tiene ningún bloque de video (Sprint 8 Implementation Plan §10.3).
 *
 * Este componente es completamente puro: recibe `block.src` ya
 * resuelto contra el base path real (Software Architecture §21.2) —
 * no calcula rutas ni conoce runtimeConfig; esa resolución ocurre en
 * app/screen-router.js. Para audio, además recibe `block.restorePosition`
 * (segundos, ya resuelto desde Session) y `block.onPositionChange`
 * (callback), exactamente el mismo patrón ya usado para
 * `exercise`/`priorAttempt`/`onCheck` en bloques `practice` — ningún
 * cambio al contrato de despacho de content-block-renderer.js.
 */

import { createPlayIcon, createPauseIcon, createReplay10Icon } from '../icons/media-icons.js';

const POSITION_SAVE_DEBOUNCE_MS = 1000;

function createUnsupportedMediaNotice() {
  const element = document.createElement('p');
  element.setAttribute('data-component', 'media-block');
  element.setAttribute('data-part', 'unsupported');
  element.className = 'al-type-ui-caption';
  element.textContent = 'Este tipo de contenido todavía no está disponible.';

  return Object.freeze({
    element,
    update: () => {},
    destroy: () => element.remove(),
  });
}

function createImageMedia(block) {
  const element = document.createElement('figure');
  element.setAttribute('data-component', 'media-block');
  element.setAttribute('data-part', 'image');

  const img = document.createElement('img');
  img.src = block.src;
  img.alt = block.alt || '';
  img.setAttribute('data-part', 'image-el');
  element.appendChild(img);

  if (block.caption) {
    const caption = document.createElement('figcaption');
    caption.className = 'al-type-reading-caption';
    caption.setAttribute('data-part', 'caption');
    caption.textContent = block.caption;
    element.appendChild(caption);
  }

  function update() {}

  function destroy() {
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}

function formatTime(totalSeconds) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function createAudioMedia(block) {
  const element = document.createElement('figure');
  element.setAttribute('data-component', 'media-block');
  element.setAttribute('data-part', 'audio');

  const audio = document.createElement('audio');
  audio.setAttribute('data-part', 'audio-el');
  audio.src = block.src;
  audio.preload = 'metadata';
  // §16: "nunca autoplay" — sin autoplay, sin loop, sin controles
  // nativos del navegador (los controles son los de esta anatomía).

  const controls = document.createElement('div');
  controls.setAttribute('data-part', 'controls');

  const playPauseButton = document.createElement('button');
  playPauseButton.type = 'button';
  playPauseButton.setAttribute('data-part', 'play-pause');
  playPauseButton.setAttribute('aria-label', 'Reproducir');
  playPauseButton.appendChild(createPlayIcon());

  const elapsed = document.createElement('span');
  elapsed.setAttribute('data-part', 'elapsed');
  elapsed.className = 'al-type-ui-caption';
  elapsed.textContent = formatTime(block.restorePosition || 0);

  const scrub = document.createElement('input');
  scrub.type = 'range';
  scrub.setAttribute('data-part', 'scrub');
  scrub.min = '0';
  scrub.max = '0';
  scrub.step = '0.1';
  scrub.value = String(block.restorePosition || 0);
  scrub.setAttribute('aria-label', 'Posición de reproducción');

  const total = document.createElement('span');
  total.setAttribute('data-part', 'total');
  total.className = 'al-type-ui-caption';
  total.textContent = '0:00';

  const replay10Button = document.createElement('button');
  replay10Button.type = 'button';
  replay10Button.setAttribute('data-part', 'replay-10');
  replay10Button.setAttribute('aria-label', 'Retroceder 10 segundos');
  replay10Button.appendChild(createReplay10Icon());

  controls.appendChild(playPauseButton);
  controls.appendChild(elapsed);
  controls.appendChild(scrub);
  controls.appendChild(total);
  controls.appendChild(replay10Button);

  element.appendChild(controls);
  element.appendChild(audio);

  if (block.caption) {
    const caption = document.createElement('figcaption');
    caption.className = 'al-type-reading-caption';
    caption.setAttribute('data-part', 'caption');
    caption.textContent = block.caption;
    element.appendChild(caption);
  }

  let savePositionTimer = null;
  let restoredOnce = false;

  function schedulePositionSave() {
    window.clearTimeout(savePositionTimer);
    savePositionTimer = window.setTimeout(() => {
      block.onPositionChange?.(audio.currentTime);
    }, POSITION_SAVE_DEBOUNCE_MS);
  }

  function flushPositionSave() {
    window.clearTimeout(savePositionTimer);
    block.onPositionChange?.(audio.currentTime);
  }

  function setPlayingState(isPlaying) {
    playPauseButton.replaceChildren(isPlaying ? createPauseIcon() : createPlayIcon());
    playPauseButton.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');
  }

  audio.addEventListener('loadedmetadata', () => {
    scrub.max = String(audio.duration || 0);
    total.textContent = formatTime(audio.duration);
    // §16: "resumes at the exact saved position... elapsed time shows
    // the saved value on mount" — se aplica una sola vez, aquí, en
    // cuanto el navegador conoce la duración real (fijar currentTime
    // antes de esto no es fiable en todos los navegadores).
    if (!restoredOnce && block.restorePosition) {
      audio.currentTime = block.restorePosition;
      scrub.value = String(block.restorePosition);
      elapsed.textContent = formatTime(block.restorePosition);
    }
    restoredOnce = true;
  });

  audio.addEventListener('timeupdate', () => {
    elapsed.textContent = formatTime(audio.currentTime);
    scrub.value = String(audio.currentTime);
    schedulePositionSave();
  });

  audio.addEventListener('play', () => setPlayingState(true));

  // "Pausar es instantáneo y sin pérdida" (§16) — se guarda la
  // posición de inmediato, no se espera el debounce.
  audio.addEventListener('pause', () => {
    setPlayingState(false);
    flushPositionSave();
  });

  audio.addEventListener('ended', () => {
    setPlayingState(false);
    flushPositionSave();
  });

  playPauseButton.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  // El scrubbing nunca "salta" por su cuenta (§16) — el propio input
  // nativo ya da control continuo; solo se sincroniza currentTime.
  scrub.addEventListener('input', () => {
    audio.currentTime = Number(scrub.value);
    elapsed.textContent = formatTime(audio.currentTime);
  });

  replay10Button.addEventListener('click', () => {
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  });

  function update() {}

  function destroy() {
    flushPositionSave();
    audio.pause();
    element.remove();
  }

  return Object.freeze({ element, update, destroy });
}

export function createMediaBlock(block) {
  if (block.mediaType === 'image' && block.src) {
    return createImageMedia(block);
  }
  if (block.mediaType === 'audio' && block.src) {
    return createAudioMedia(block);
  }
  // video, o image/audio sin src resuelto (defensivo): mismo aviso
  // neutral que Sprint 3 ya definió para todo "media" sin asset real.
  return createUnsupportedMediaNotice();
}
