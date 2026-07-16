# Atlas Learning

**Estado actual:** Sprint 4 (Progress) implementado.

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

## Qué existe en Sprint 4 — y qué no

Sprint 4 entrega **Progress** (Engineering Implementation Roadmap,
Phase 4) tal como fue acordado explícitamente antes de implementar:
**infraestructura de persistencia y restauración de Session, nunca
progreso académico artificial**. Sin Exercise Engine (Sprint 5) no
existen Attempts reales, y sin Attempts, Progress permanece
honestamente en 0/N — exactamente como en Sprint 3.

Lo que Sprint 4 sí entrega:
- **Persistencia de Session** (`domain/session/`): posición
  Book/Unit/Lesson/Section, scroll, y los campos reservados
  `currentExercise`/`currentAudio` (en `null` hasta que existan datos
  reales que registrar — Sprint 5 y una futura Media de audio real).
- **Restore Session real** dentro de Learning Session: sección y
  scroll se restauran exactamente al reabrir una lección en curso
  (Software Architecture §10.4, §14.3).
- **Home ("Continue Learning") real** — Wireframe Review §2.1 —
  reemplaza el placeholder de Sprint 2/3. Si no hay Session persistida
  (estudiante nuevo, o acaba de terminar su única lección), se sigue
  mostrando el mismo estado vacío de siempre.
- **Primer libro real: Hi! Korean 3A** — Chapter 01 (서울), Lesson 1-1
  completa (páginas 16–25 del libro impreso). Alcance explícitamente
  acordado; el resto del libro no se adapta todavía. El libro de
  muestra "Español Esencial" (Sprint 3) se conserva sin cambios — la
  Library ahora tiene 2 libros, reforzando el comportamiento "N
  libros" (PRD §13, C8) con datos reales.
- **Primer asset real de Media**: un mapa de distritos de Seúl
  (`assets/images/content/hi-korean-3a/`), extraído directamente del
  PDF del libro — no fabricado. Por eso `media-block.js` implementa la
  variante `image` del primitivo Media (Design System §19.5).

Deliberadamente fuera de Sprint 4 (llegan en sprints posteriores):
- **Progress numérico real / marcar lecciones como completadas** —
  depende de Attempts (Exercise Engine, Sprint 5). Ningún contador
  artificial se introdujo para simularlo.
- **Practice / Exercise Engine** — los bloques `practice` del
  contenido real de Hi! Korean ya existen (con `exerciseId` estable),
  pero siguen mostrando el mismo aviso neutral que Sprint 3 definió;
  el motor que les da vida es Sprint 5.
- **Audio real** — el libro referencia pistas de audio (Track
  01/02/03) pero Atlas no tiene esos archivos. Se documentan como
  bloques `aside`, nunca como un reproductor sin contenido real.
- **Review Mode** — sigue dependiendo de Error Records (Exercise
  Engine).

## Corrección de dominio en este sprint

`domain/contracts/entity-shapes.js` — `isValidPedagogicalSequence` se
corrigió para validar "contenido antes que práctica" **por Dynamic
Learning Section**, no como una única secuencia aplanada de toda la
Lesson. La implementación de Sprint 3 era más estricta de lo que
Design System §19.9 realmente especifica ("Practice is always the
last content primitive before **a section's** feedback/continue") y
no permitía representar libros reales que intercalan explicación y
práctica en cada punto gramatical — el patrón más común en libros de
idiomas. Decisión aprobada explícitamente antes de implementar; ver
"Cambios recomendados en documentación" del resumen técnico de Sprint
4 para la aclaración pendiente en el documento congelado.

## Estructura

```
src/
  domain/
    session/         NUEVO — session-repository.js: único punto de
                      entrada del dominio hacia Persistence para la
                      Session activa (Software Architecture §10, §14)
    contracts/
      session-shape.js  NUEVO — forma de la entidad Session (§4.2)
      entity-shapes.js  isValidPedagogicalSequence corregida (ver arriba)
    content/
      library-catalog.js  Sprint 4 añade Hi! Korean 3A (Ch1, Lesson 1-1)
  presentation/
    screens/
      home/           NUEVO — Home real ("Continue Learning")
      learning-session/  Restore Session (sección + scroll granular,
                      onSectionChange/onScrollChange), onExit con
                      { reason: 'finished' | 'exited' }
    components/
      content-blocks/
        media-block.js   NUEVO — primitivo Media, variante `image`
  app/
    bootstrap.js      Crea sessionRepository, lo inyecta junto con
                      runtimeConfig en mountScreenRouter
    screen-router.js  Home real vía Session; Restore Session en
                      Learning Session; resuelve assets de Media
                      contra el base path real (única capa que conoce
                      runtimeConfig y contenido a la vez)
assets/
  images/content/hi-korean-3a/  NUEVO — asset real extraído del PDF
```

## Regla de vecinos

Sin cambios respecto a Sprint 3. `presentation/components/` y
`presentation/screens/` siguen sin importar nada fuera de sí mismas —
reciben todo por props/callbacks inyectados desde `app/`.
`media-block.js` recibe siempre un `src` ya resuelto — no conoce
runtimeConfig ni calcula rutas (esa resolución vive en
`screen-router.js`, que ya conoce varias capas por diseño).
`session-repository.js` conoce el storage contract inyectado, nunca el
mecanismo real detrás de él.

## Verificación realizada en este sprint

Sin acceso a un navegador real en este entorno de trabajo (a
diferencia de Sprint 3), la verificación de este sprint fue:
- Sintaxis válida de todos los archivos `.js` (`node --check`) y
  balance de llaves en los `.css` tocados/nuevos.
- Validación de dominio real contra `entity-shapes.js`: el Book, la
  Unit y la Lesson de Hi! Korean 3A pasan `isValidBookShape` /
  `isValidUnitShape` / `isValidLessonShape` / `isValidPedagogicalSequence`
  (por Section, tras la corrección). El libro de muestra de Sprint 3
  se re-validó sin cambios.
- `session-repository.js` probado de forma aislada (storage en
  memoria simulando el contrato real): guardado inicial, patch
  parcial que conserva campos no tocados, `clearSession`, y rechazo
  honesto de un `partialUpdate` con una clave ajena al contrato.
- Resolución de assets de Media probada de forma aislada: un
  `runtimeConfig` simulado produce el `src` final esperado a partir de
  `assetPath` para el único bloque `media` real del contenido.
- `content-repository.js` probado contra el nuevo libro: búsquedas
  válidas, degradación honesta a `null` para ids inexistentes,
  `computeBookProgress`/`computeUnitProgress`/`computeLessonMarkers`
  siguen devolviendo 0/N y el marcador "next" único, tal como exige la
  decisión de este sprint.

**Pendiente de tu verificación manual real en navegador** (`npm
start`): flujo completo Library → Book (Hi! Korean 3A) → Unit → Lesson
entry → Learning Session → avance por las 12 secciones → Finish → Home
(vacío) → reingreso a mitad de lección → exit → Home ("Continue
Learning") → click → restauración exacta de sección y scroll; y
verificación visual del mapa de Seúl extraído.
