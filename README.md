# Atlas Learning

**Estado actual:** Sprint 2 (Library) implementado.

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

## Qué existe en Sprint 2 — y qué no

Sprint 2 entrega **Library** (Engineering Implementation Roadmap,
Phase 2): la screen de Library (portadas + ghost slots), la screen de
Book (título, progreso acumulado, lista de unidades) y la carga de un
Book publicado. Exit Criteria del Roadmap: "un libro puede abrirse" —
cumplido: Library → tap en una portada → Book screen con su
estructura real.

Deliberadamente fuera de Sprint 2 (llegan en sprints posteriores según
la Dependency Matrix del Roadmap):
- Navegación a la screen de Unit y más abajo (Lesson, Learning
  Session) — Reader, Sprint 3. Las filas de Unit dentro de Book se
  muestran (con su whisper bar) pero no navegan todavía; ver el
  comentario en `presentation/screens/book/book-screen.js`.
- Progreso real derivado de Attempts — Progress, Sprint 4. La whisper
  bar de Sprint 2 muestra honestamente 0 completadas de N (no existe
  ningún Attempt que contar todavía); ver
  `domain/content/progress.js`.
- Home ("Continue Learning"), Review y Settings no tienen screen
  propia — dependen de Session/Progress (Sprint 4) y del Exercise
  Engine (Sprint 5) respectivamente. El nav-secondary solo expone
  "Library" por ahora.

## Estructura

```
src/
  app/            Composición raíz — el único lugar que conoce todas las capas
                  (bootstrap.js, app-shell.js, screen-router.js — Sprint 2)
  config/         Configuración pública y resolución de base path (GH Pages)
  core/
    events/       Bus pub/sub no bloqueante + vocabulario de eventos
    router/       Router hash-based + forma de la Navigation State
                  (route-table.js: "library" y "book/:id" desde Sprint 2)
    errors/       Clasificación de errores (recoverable vs. must-surface)
  persistence/    Contrato de storage + envelope versionado (sin dominio real aún)
  domain/
    contracts/    Forma de Library/Book/Unit/Lesson
    content/      Sprint 2 — Book publicado (library-catalog.js),
                  lectura de contenido (content-repository.js) y
                  progreso derivado, honestamente 0/N (progress.js)
  presentation/
    components/   Componentes de UI puros — sin conocer router/persistence
                  (book-card, ghost-slot, progress-bar, list-row,
                  back-nav — Sprint 2)
    screens/      library/ y book/ — Sprint 2. Punto de extensión
                  para Sprint 3+ (Unit, Lesson, Learning Session)
  styles/         Sprint 2 — tokens.css (Design System §24) + base.css;
                  cada componente/screen trae su propio .css junto al
                  .js, importado desde styles/main.css
```

Cada carpeta de primer nivel bajo `src/` corresponde a una capa de
Software Architecture §9.2, con una excepción documentada: `content/`
dentro de `domain/` no es uno de los seis nombres de la tabla de
§9.2 — es la extensión de Sprint 2 para el Content Import Pipeline
(§7), publicado como módulo ES estático en vez de vía fetch(), para
no darle a Domain una responsabilidad de red que la regla de vecinos
le prohíbe (ver el comentario en `content-repository.js`). `sync/` y
`auth/` siguen sin existir — llegan en Sprint 6, no se crean vacías de
antemano.

## Regla de vecinos

Cada capa solo llama a la que tiene inmediatamente debajo
(Software Architecture §9.3): Presentation → Router (Session &
Navigation) → Domain → Persistence. `presentation/components/` y
`presentation/screens/` no importan nada fuera de sí mismas — reciben
todo por props/callbacks inyectados desde `app/` (`screen-router.js`
es quien conecta Domain & Content con Presentation en Sprint 2).

## Verificación manual de Sprint 2

Probado con un navegador real (Chromium headless) contra
`dev-server.mjs`, confirmando sin errores de consola ni excepciones:
Home → tap "Library" → shelf con 1 book card + N ghost slots
(2/3/4 columnas según viewport compact/medium/expanded) → tap en la
portada → Book screen con título, progreso acumulado y 3 filas de
Unit con su propia whisper bar → back-nav "‹ library" → de regreso al
shelf. También: navegación directa a un id de Book inexistente
(estado vacío, sin excepción), y el botón atrás/adelante del
navegador vía hashchange nativo.
