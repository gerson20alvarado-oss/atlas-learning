/**
 * presentation/components/worksheet-exercises/video-panel.js
 *
 * Contenido del recurso de video — exclusivo de American Language
 * Hub, sin ninguna relación con el reproductor de audio de Hi!
 * Korean. Expone su contenido en bruto (`{ element, destroy }`),
 * para que quien lo monte decida el contenedor — hoy, `side-panel.js`
 * reutilizado tal cual, mismo criterio ya aplicado a Transcripción.
 *
 * Controles nativos del `<video>` del navegador (reproducir, barra
 * de progreso, pantalla completa) — sin reconstruir una anatomía
 * propia todavía; esa es una decisión de una etapa posterior, no de
 * esta primera integración.
 *
 * Si `unit.video` no existe o el archivo todavía no se subió a
 * Storage, se muestra el mismo tipo de aviso honesto que ya usa el
 * resto de Atlas — nunca una URL rota silenciosa.
 */

export function createVideoPanel({ video, videoSourceRepository }) {
  const element = document.createElement('div');
  element.setAttribute('data-component', 'video-panel-content');

  const heading = document.createElement('h2');
  heading.setAttribute('data-part', 'title');
  heading.className = 'al-type-ui-label';
  heading.textContent = video?.label ?? 'Video';
  element.appendChild(heading);

  const statusText = document.createElement('p');
  statusText.setAttribute('data-part', 'status');
  statusText.className = 'al-type-ui-caption';

  let videoEl = null;
  let destroyed = false;

  if (!video?.assetPath) {
    statusText.textContent = 'Este recurso no tiene video asociado todavía.';
    element.appendChild(statusText);
  } else {
    statusText.textContent = 'Cargando video…';
    element.appendChild(statusText);

    videoSourceRepository.getVideoUrl(video.assetPath).then((url) => {
      if (destroyed) return;
      statusText.remove();

      if (!url) {
        const unavailable = document.createElement('p');
        unavailable.setAttribute('data-part', 'status');
        unavailable.className = 'al-type-ui-caption';
        unavailable.textContent = 'El video todavía no está disponible.';
        element.appendChild(unavailable);
        return;
      }

      videoEl = document.createElement('video');
      videoEl.setAttribute('data-part', 'video-el');
      videoEl.controls = true;
      videoEl.src = url;
      element.appendChild(videoEl);
    });
  }

  function destroy() {
    destroyed = true;
    element.remove();
  }

  return Object.freeze({ element, destroy });
}
