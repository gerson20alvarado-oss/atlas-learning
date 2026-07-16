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
 * `audio` y `video` siguen sin asset real (decisión explícita: "no
 * fabriques audio, no inventes assets" — Sprint 4 Plan) y por lo tanto
 * siguen mostrando el mismo aviso neutral que ya existía para todo
 * "media" en Sprint 3 — ningún comportamiento nuevo se inventa para
 * ellos todavía. Este componente es completamente puro: recibe
 * `block.src` ya resuelto contra el base path real (Software
 * Architecture §21.2) — no calcula rutas ni conoce runtimeConfig; esa
 * resolución ocurre en app/screen-router.js, el único lugar que ya
 * conoce varias capas a la vez (regla de vecinos, §9.3).
 */

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

export function createMediaBlock(block) {
  if (block.mediaType === 'image' && block.src) {
    return createImageMedia(block);
  }
  // audio/video, o image sin src resuelto (defensivo): mismo aviso
  // neutral que Sprint 3 ya definió para todo "media" sin asset real.
  return createUnsupportedMediaNotice();
}
