# Atlas Learning

**Estado actual:** Sprint 5 (Exercise Engine) implementado.

Static SPA, HTML/CSS/JS ES Modules puro — sin framework, sin bundler
(Software Architecture, restricción C1). Diseñada para GitHub Pages
(C2). Ver `docs/` (fuera de este repo de código) para PRD, Product
Design, Software Architecture, Design System, Wireframe Review,
Technical Specification y el Roadmap de implementación.

## Correr en local

```bash
npm start
# o directamente:
node dev-server.mjs 8080
```

Abrir `http://localhost:8080/`. Sin paso de build.

## Qué existe en Sprint 5 — y qué no

Sprint 5 entrega el **Exercise Engine** (Engineering Implementation
Roadmap, Phase 5) — genérico por diseño, nunca acoplado a Hi! Korean:

- **Tres tipos de ejercicio evaluables** (Design System §17.3–17.5):
  `multipleChoice`, `fillBlank`, `typing`. Cada uno autoevalúa
  localmente, sin red (`domain/exercise/exercise-evaluator.js`).
- **Attempt real** (`domain/learning-data/attempt-repository.js`):
  append-only, persistido. **Error Record es una vista derivada** de
  Attempts filtrados por incorrectos — nunca una segunda fuente de
  verdad (Sprint 5 Plan, decisión #4).
- **Progress real**: una Lesson se considera completada **únicamente**
  cuando todos sus ejercicios evaluables tienen al menos un Attempt
  **correcto** (Sprint 5 Plan, decisión #1) — llegar a "Finish" ya no
  basta. `computeUnitProgress`/`computeBookProgress`/
  `computeLessonMarkers` ahora reciben `attemptRepository`.
- **Reintento hasta acertar**: dentro de una misma vista, un ejercicio
  respondido (correcto o no) queda bloqueado (Design System §17.3 —
  "all options then disabled"); el reintento real ocurre al volver a
  entrar a la Lección — una Session nueva solo restaura en estado "ya
  respondido" si el último Attempt fue **correcto** (si fue
  incorrecto, se presenta fresco, dando una oportunidad real de
  lograr la completitud que exige la decisión #1).
- **Botón compartido Check/Continue** (Design System §17.1, §17.3,
  §17.5): el mismo botón de la Session hace de "Check" mientras haya
  ejercicios sin verificar en la sección activa (deshabilitado hasta
  que haya una respuesta pendiente), y de "Continue"/"Finish" una vez
  que todos muestran su Feedback.
- **`currentExercise` eliminado de Session** (Sprint 5 Plan, decisión
  #5): el estado de cada ejercicio se deriva consultando Attempts,
  nunca se persiste un puntero de "ejercicio activo". Una Session real
  de Sprint 4 con ese campo se degrada a `null` automáticamente
  (mismo criterio de degradación honesta que ya regía para contenido
  inválido) — no hace falta migración.
- **20 Exercises reales** para Hi! Korean 3A Lesson 1-1 — cada
  pregunta numerada del libro que antes vivía agrupada en un bloque
  `practice` ahora es un Exercise independiente (Sprint 5 Plan,
  decisión "B1").
- **"Actividades abiertas" documentadas, no implementadas** (Sprint 5
  Plan, decisión explícita): 8 `exerciseId` del contenido real
  deliberadamente NO tienen Exercise — producción libre/opinión
  personal (5), dependientes de audio real que Atlas no tiene (2), y
  un ejercicio de matching término-definición (1, tipo "Should Have
  v1.x" de PRD §24, no implementado en Sprint 5). Ninguno genera
  Attempts ni participa en Progress — ver
  `domain/content/exercise-catalog.js` para el detalle exacto de cada
  caso y por qué.

Deliberadamente fuera de Sprint 5:
- **Review Mode** — depende de Error Records, que ya existen como
  vista derivada, pero la screen queda para un sprint posterior.
- **Favorites** — el modelo está listo, sin implementar todavía.
- **Matching/ordering/listening** — tipos de ejercicio futuros (PRD
  §24 Should Have v1.x).

## Corrección de dominio en este sprint

Ninguna esta vez — a diferencia de Sprint 4, no se detectó contradicción
alguna entre el Exercise Engine propuesto y los documentos congelados.

## Estructura

```
src/
  domain/
    contracts/
      exercise-shape.js  NUEVO — forma de Exercise, genérica por tipo
      attempt-shape.js   NUEVO — forma de Attempt
      session-shape.js   currentExercise eliminado (decisión #5)
    exercise/
      exercise-evaluator.js   NUEVO — el Exercise Engine puro: Exercise
                              + Response → juicio. Nunca conoce Session,
                              Router, Persistence ni Presentation.
      exercise-repository.js  NUEVO — lectura de Exercise por id
    learning-data/
      attempt-repository.js   NUEVO — Attempt (Persistence-backed,
                              append-only) + Error Record derivado
    content/
      exercise-catalog.js  NUEVO — claves de corrección reales de
                            Hi! Korean 3A Lesson 1-1
      library-catalog.js   practice reestructurado (B1): cada pregunta
                            numerada es su propio exerciseId
      progress.js           Progress real derivado de Attempts
  presentation/
    components/content-blocks/
      typing-block.js            NUEVO
      fill-blank-block.js        NUEVO
      multiple-choice-block.js   NUEVO
      practice-block.js          NUEVO — dispatcher + anatomía compartida
    screens/learning-session/
      learning-session-screen.js  Botón compartido Check/Continue
  app/
    screen-router.js   resolveLessonExercises (Exercise+Attempt+onCheck
                        compuestos aquí, nunca en el motor ni en la UI)
    bootstrap.js        Crea e inyecta attemptRepository
```

## Regla de vecinos — Exercise Engine

`domain/exercise/exercise-evaluator.js` es deliberadamente la pieza
más aislada del sprint: recibe `(exercise, response)`, devuelve
`{isCorrect, correctAnswerDisplay}` — nunca importa Session, Router,
Persistence ni nada de `presentation/`. `practice-block.js` (Presentation)
nunca llama al evaluador ni al repositorio de Attempts directamente —
solo invoca `block.onCheck(response)`, un callback ya compuesto por
`app/screen-router.js`. Verificado explícitamente durante la
implementación (Sprint 5 Plan, "observación arquitectónica
adicional") — en ningún momento fue necesario que el motor conociera
navegación.

## Validaciones realizadas

Sin navegador real disponible en este entorno (igual que Sprint 4):
- Sintaxis válida en todos los `.js` (`node --check`) y balance de
  llaves en el `.css` nuevo/tocado.
- `isValidBookShape`/`isValidUnitShape`/`isValidLessonShape`/
  `isValidPedagogicalSequence` en verde para ambos libros tras la
  reestructuración de contenido.
- Ciclo completo Attempt → Progress probado de forma aislada: 0
  Attempts → Lesson incompleta; todos correctos menos uno → sigue
  incompleta; ese uno incorrecto → sigue incompleta; reintento
  correcto → **completa**; Error Record conserva el intento
  incorrecto en el historial aunque ya se haya corregido (§15.3 "no
  borra historial").
- `resolveLessonExercises` probado de forma aislada: resuelve
  Exercise/priorAttempt/onCheck correctamente; un `exerciseId` sin
  Exercise (actividad abierta) resuelve a `null` sin romper nada.
- **Shim mínimo de DOM construido para este sprint** (no reemplaza un
  navegador real, pero permite instanciar y ejercitar componentes):
  los tres tipos de ejercicio probados end-to-end (selección/tecleo →
  `checkNow()` → Feedback pintado → bloqueo de inputs); el dispatcher
  `practice-block.js` probado con Exercise resuelto y con actividad
  abierta; el flujo completo del botón compartido Check/Continue
  probado en una Lección simulada de 3 secciones (0, 2 y 0 ejercicios
  respectivamente) — incluye verificación de que el botón permanece
  deshabilitado sin respuesta, cambia a "Check" habilitado al escribir,
  no avanza de sección al verificar, y solo pasa a "Continue"/"Finish"
  cuando todos los ejercicios de la sección activa muestran su
  Feedback.
- **Regresión Sprint 1–4**: servidor local levantado y verificado por
  HTTP (200) para `index.html`, todos los módulos nuevos, el asset de
  imagen de Sprint 4, y el CSS principal; el libro de muestra
  "Español Esencial" (sin ningún `practice`) sigue computando
  Progress 0/N honesto en todos sus niveles, sin romperse con el
  nuevo `attemptRepository` requerido.

**Pendiente de tu verificación manual real en navegador** (`npm
start`): flujo completo con los tres tipos de ejercicio visualmente,
Feedback en pantalla, reintento real al reabrir una Lección tras una
respuesta incorrecta, y confirmación de que Home/Library reflejan
Progress real tras completar Lesson 1-1 por completo.
