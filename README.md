# Atlas Learning

**Estado actual:** Sprint 3 (Reader) implementado.

Static SPA, HTML/CSS/JS ES Modules puro — sin framework, sin bundler
(Software Architecture, restricción C1). Diseñada para GitHub Pages
(C2). Ver `docs/` (fuera de este repo de código) para PRD, Product
Design, Software Architecture, Design System, Wireframe Review,
Technical Specification y el Roadmap de implementación — este README
no reemplaza ninguno de esos documentos, solo orienta el código.

## Correr en local

```bash
npm start
# o directamente:
node dev-server.mjs 8080
```

Abrir `http://localhost:8080/`. No hay paso de build: los archivos se
sirven tal cual.

## Qué existe en Sprint 3 — y qué no

Sprint 3 entrega **Reader** (Engineering Implementation Roadmap,
Phase 3): la "Navigation" que Sprint 2 dejó pendiente (Unit screen,
Lesson entry screen) más el Learning Session container con
renderizado real de contenido. Exit Criteria del Roadmap: "entire
lessons are readable" — cumplido: Library → Book → Unit → Lesson →
Learning Session, avanzando linealmente por las Dynamic Learning
Sections de una lección hasta terminarla.

Deliberadamente fuera de Sprint 3 (llegan en sprints posteriores según
la Dependency Matrix del Roadmap):
- **Practice / Exercise Engine** (Sprint 5). El primitivo "practice"
  existe en el contrato de datos (entity-shapes.js) pero no tiene
  renderer — content-block-renderer.js muestra un aviso neutral si
  algún día aparece, en vez de fallar.
- **Media** (audio/video/imagen) — sin assets reales todavía (el
  Content Import Pipeline no corre en este runtime). Mismo fallback
  neutral que "practice".
- **Session Summary con resultados** (aciertos/total) — depende de
  Attempts, que no existen hasta el Exercise Engine. Al terminar la
  última sección, "Continue" se convierte en "Finish" y sale
  directamente, sin pantalla de resultados todavía.
- **Persistencia y resume de Session** (Progress, Sprint 4). La
  sección activa vive solo en memoria del componente de Learning
  Session — recargar la página o salir la pierde. "Exit" navega a
  Home sin guardar nada todavía.
- **Review Mode** — depende de Error Records (Exercise Engine).
  learning-session-screen.js está diseñado como "un componente, dos
  consumidores" (Design System §18) pero Sprint 3 solo construye el
  consumidor Learn Mode.

## Estructura

```
src/
  app/            screen-router.js resuelve ahora Unit, Lesson entry
                  y Learning Session, además de Library/Book (Sprint 2)
  domain/
    contracts/    entity-shapes.js — Sprint 3 añade Section y Content
                  Block (los 8 primitivos, C5), y el validador de la
                  secuencia pedagógica (contenido antes que práctica)
    content/      library-catalog.js — Lessons con secciones y
                  content blocks reales; content-repository.js añade
                  getUnitById/getLessonById; progress.js añade
                  marcadores binarios de Lesson y progreso de sesión
  presentation/
    components/
      content-blocks/   Sprint 3 — un renderer por primitivo
                  (prose, term, dialogue, aside, example, table) +
                  content-block-renderer.js (dispatcher con fallback
                  neutral para media/practice, todavía no implementados)
      primary-button/   Button/primary (Design System §11.1)
      session-exit/     "exit" del Session Container (§15.3)
    screens/
      unit/             Sprint 3 — lista de lecciones, marcador binario
      lesson-entry/      Sprint 3 — puerta de compromiso
      learning-session/  Sprint 3 — el Session Container (§18):
                  navegación lineal por secciones, whisper bar de
                  sesión, transición page-turn (§21.3)
  styles/         base.css añade las clases de voz de lectura
                  (type-reading-*) — usadas por primera vez en Sprint 3
```

## Regla de vecinos

Sin cambios respecto a Sprint 2. `presentation/components/` y
`presentation/screens/` siguen sin importar nada fuera de sí mismas
— reciben todo por props/callbacks inyectados desde `app/`. Los
renderers de content-blocks son intencionalmente puros: no reportan al
error boundary ni al event bus (eso es responsabilidad de `app/`).

## Verificación manual de Sprint 3

Probado con un navegador real (Chromium headless) contra
`dev-server.mjs`:
- Flujo completo Library → Book → Unit → Lesson entry → Learning
  Session → avance por todas las secciones → Finish → Home, para las
  5 lecciones del libro de muestra, sin errores de consola ni
  excepciones.
- Los seis primitivos de contenido (prose, term, dialogue, aside,
  example, table) renderizan correctamente con contenido real.
- El fallback neutral para "media"/"practice" no lanza excepciones.
- Marcador binario de Lesson ("next" en la primera lección de cada
  unidad, sin marcador en el resto — honesto dado que no hay Attempts
  todavía).
- Validadores de dominio probados de forma aislada: un Content Block
  con un noveno tipo inventado se rechaza (C5); una secuencia
  práctica-antes-que-contenido se rechaza (invariante pedagógica,
  Software Architecture §5.4); el caso real de Sprint 3 (sin ningún
  bloque "practice") se acepta correctamente.
- "exit" y "Finish" navegan a Home; un id de Unit o Lesson inexistente
  degrada a un estado vacío en calma, reportado como recuperable.
- Transición page-turn entre secciones probada con y sin
  `prefers-reduced-motion`, sin excepciones en ningún caso.
- Recorrido completo de las 5 lecciones del libro sin cuelgues ni
  errores acumulados.
