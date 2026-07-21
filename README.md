# Atlas Learning

**Estado actual:** Arquitectura de Evaluaciones Independientes,
seguida de una evolución visual y pedagógica del Progress Test (ver
sección siguiente).

## Progress Test — evolución visual y pedagógica (esta sesión)

Objetivo: que el Progress Test se sienta como una evaluación
profesional (Cambridge/Oxford/Pearson), no como un formulario HTML.
Sin cambiar arquitectura ni motor de intentos.

**Hallazgo de partida**: 3 de los 4 tipos de ejercicio que usa el
Progress Test (`matching`, `choice`, `shortAnswer`) nunca tuvieron
CSS — se construyeron con lógica pero sin estilos en la sesión donde
se transcribió el contenido. No era un problema de "pulir", era
ausencia total de diseño. `choice-exercise.css`,
`matching-exercise.css`, `short-answer-exercise.css` se crearon desde
cero.

**Tipografía**: se activó la "voz de lectura" del Design System
(`--al-font-reading`, Source Serif 4) — existía documentada desde
antes ("reservada para contenido declarado por el libro... nunca
usada por copy de UI") pero nunca se había aplicado a un ejercicio.
Ahora el contenido evaluable (enunciados, opciones, prompts) usa esa
voz; instrucciones y chrome de UI se quedan en Inter.

**Composición**: opciones como chips independientes con espacio
real y estado seleccionado inequívoco (relleno + texto invertido) —
nunca palabras pegadas. Cada ejercicio es una tarjeta independiente
(`--al-surface-recessed`, padding generoso, `gap: --al-space-6`
entre ejercicios).

**Botones**: los 5 tipos de ejercicio (`ordering`, `trueFalse`,
`matching`, `choice`, `shortAnswer`) usan ahora `createPrimaryButton`
real en vez de un `<button>` crudo con CSS duplicado por componente.

**Política de revisión — `reviewPolicy: 'practice' | 'exam'`**
(campo de contenido nuevo, junto a `maxAttempts`/`title` de cada
evaluación): Worksheet queda `'practice'` (Check Answers por
ejercicio, feedback inmediato, sin cambios de comportamiento).
Progress Test pasa a `'exam'` — sin Check Answers por ejercicio, un
único "Submit Progress Test", resultado agregado únicamente (Score /
Correct Answers / Percentage / Attempts Remaining), nunca marca qué
ítem falló, ni al enviar ni al revisar después. Un segundo intento
responde la evaluación completa de nuevo. La función `validate()` de
cada ejercicio no cambió una sola línea — solo cambió cuándo y si se
revela visualmente.

**Verificado** (sin navegador, mismo límite de siempre): sintaxis de
los 147 `.js` y balance de llaves de los 4 CSS tocados/nuevos; DOM
mínimo hecho a mano (sin `jsdom`, sin red disponible) para probar
`choice-exercise.js`/`matching-exercise.js` en ambos modos —
confirmado que en `'exam'` nunca aparece Check Answers propio ni se
pinta `data-result` (ni al elegir, ni llamando `validate()`
directamente), y que en `'practice'` el comportamiento es idéntico
al de antes de este cambio. Smoke test de servidor confirma que los
3 CSS nuevos están registrados en `main.css` y sirven 200.

**Pendiente de verificación manual real en navegador**: cómo se ve
de verdad — tipografía, espaciado, chips de selección, y el flujo
completo de Submit → Summary en modo examen.

## Corrección de regresiones (sesión anterior)

Tres regresiones reales, introducidas por la evolución a
Evaluaciones Independientes, detectadas en pruebas manuales del
usuario y corregidas antes de seguir agregando funcionalidad:

**1. Video Panel dejó de abrirse en lateral.** Causa raíz: al
renombrar `worksheet-screen.js` → `assessment-screen.js`, el
`data-component` del elemento cambió de `"worksheet-screen"` a
`"assessment-screen"`, pero el CSS (`worksheet-screen.css`, 205
líneas, incluida la regla que arma el layout de dos columnas para el
panel lateral) nunca se actualizó ni se movió — quedó apuntando a un
selector que ya no existía en el DOM, así que dejó de aplicarse por
completo. Corrección: CSS movido a
`presentation/screens/assessment/assessment-screen.css`, todos los
selectores actualizados, `main.css` apunta a la ruta nueva, el
archivo/carpeta viejos eliminados. La lógica JS del Video Panel
nunca cambió — el problema era 100% de estilos.

**2. "Continue to Progress Test" desaparecía después de la primera
vista.** Causa raíz: el botón vivía únicamente dentro de
`showCompletionSummary()`, que solo se renderiza una vez, justo
después de presionar Submit. Cualquier visita posterior (recarga,
volver más tarde) salta directo a la vista de solo lectura vía
`renderExercises()`, donde el botón nunca existió. Corrección: el
botón se extrajo a un helper (`appendNextAssessmentButton`) que
ahora se llama tanto desde el Summary transitorio como desde
`renderExercises()` cuando la evaluación está completada — visible
siempre que haya una siguiente evaluación, no solo la primera vez.

**3. Progress Test invisible en el Admin Console mientras nadie lo
tocara.** Causa raíz: `unit_attempt_limits` solo tiene fila una vez
que se registra al menos un intento (`increment_unit_attempt` hace
el primer INSERT) — sin intentos, sin fila, sin nada que mostrar.
Corrección, solo en la ficha por estudiante
(`admin-user-detail-screen.js`, que es donde tiene sentido — ver su
docstring para el porqué no se replicó en la vista global): para
cada unidad donde el estudiante ya tiene algún intento real,
`listAssessmentIds`/`getAssessment` (el mismo contenido que resuelve
la app real) completan las evaluaciones declaradas que todavía no
tienen fila, mostrando `0 / maxAttempts`, informativo y no editable
(un PATCH no crea filas). Formato `X / Y` aplicado también en la
vista global de Worksheet Attempts, con el título real de la
evaluación en vez del `assessmentId` crudo.

**Verificado**: los 147 `.js` pasan `node --check`; smoke test de
servidor confirma que la ruta CSS vieja cae al fallback (ya no
existe) y la nueva sirve con el selector correcto; simulación de la
lógica de síntesis del Admin confirma `Worksheet: 1/2 (editable)` +
`Progress Test: 0/2 (not started)` con datos reales de prueba.

**Pendiente de verificación manual real en navegador** (esto sí
requiere ojos humanos, no puedo confirmarlo desde este entorno): que
el panel del video efectivamente se vea lateral de nuevo, que el
botón "Continue to Progress Test" persista tras recargar, y que el
Admin Console muestre ambas evaluaciones en pantalla real.

## Arquitectura de Evaluaciones Independientes (esta sesión)

El Progress Test dejó de ser una sección dentro de la Worksheet.
Ahora es una evaluación independiente de la misma unidad, con sus
propios 2 intentos, que nunca afecta ni es afectada por los intentos
de la Worksheet:

```
Unit
├── Lesson
├── Worksheet       (assessmentId: 'worksheet',      2 intentos)
└── Progress Test   (assessmentId: 'progress-test',  2 intentos)
```

**Motor único, reutilizado, no duplicado.** `assessment_id` se
convirtió en una dimensión más de la clave de
`unit_attempt_limits`/`worksheet_exercise_attempts` (ver
`docs/assessment-id-migration.sql`, default `'worksheet'` — cero
migración de datos, cero intento perdido de lo ya registrado en Unit
1). El mismo componente de pantalla, ahora `assessment-screen.js`
(antes `worksheet-screen.js` — renombrado porque ya no es específico
de una worksheet), renderiza cualquier evaluación de cualquier
unidad, con el mismo ciclo completo (Submit, Summary, Start New
Attempt, bloqueo al agotar intentos). Agregar un Quiz, Speaking
Assessment o Final Assessment a futuro es: una entrada más en
`assessments{}` del contenido de la unidad, una ruta más — cero
tablas nuevas, cero componentes nuevos, cero lógica de intentos
nueva.

**Contenido**: `alh-level-1-unit-1.js` pasó de `unit.sections`/
`unit.maxAttempts` (una sola evaluación implícita) a
`unit.assessments.worksheet`/`unit.assessments['progress-test']`,
cada una con su propio `title`/`maxAttempts`/`sections`.
`getAssessment(bookId, unitNumber, assessmentId)` (nuevo, en
`worksheet-content-repository.js`) resuelve una evaluación concreta,
aplanada, para la pantalla.

**Routing**: `/book/:id/read/:unitNumber` (sin cambios, sigue
significando "Worksheet" — ningún enlace existente se rompe) y
`/book/:id/read/:unitNumber/progress-test` (nueva). `screen-router.js`
arma el botón "Continue to {siguiente evaluación}" por **orden de
declaración** en el contenido, nunca hardcodeado a
"worksheet→progress-test" — así una evaluación agregada después del
Progress Test se encadena sola, sin tocar este archivo.

**Transición (decisión de producto cerrada)**: nunca automática.
Terminar la Worksheet muestra el Summary de siempre (puntaje,
intentos restantes, Start New Attempt) — el botón "Continue to
Progress Test" aparece ahí, y el estudiante decide cuándo tocarlo.

**Verificado**: además de `node --check` en los 147 `.js` y el smoke
test de servidor de siempre, se simuló el flujo completo (intentos +
respuestas) con adapters falsos en memoria, usando el código real de
contratos/repositorios — confirmado que 2 intentos consumidos en la
Worksheet dejan al Progress Test en 0, y que "Start New Attempt" en
la Worksheet borra únicamente sus propias respuestas, nunca las del
Progress Test.

**Pendiente de tu verificación manual real en navegador**: correr
`docs/assessment-id-migration.sql` contra un proyecto Supabase real
(requiere que `docs/atlas-admin-overview.sql` y
`docs/unit-attempts-with-owner-view.sql` ya se hayan corrido antes),
y probar de extremo a extremo en pantalla el flujo Lesson → Worksheet
→ (Continue to Progress Test) → Progress Test → intentos agotados en
ambas.

Después de Sprint 14 también se añadió **Progress Test Unit 1**
(American Language Hub Level 1), con tres tipos de ejercicio nuevos en el Worksheet Engine — `matching`,
`choice`, `shortAnswer` (ver
`src/presentation/components/worksheet-exercises/` y
`domain/contracts/worksheet-exercise-lifecycle.js`). Contenido y
respuestas oficiales transcritos de `Progress_Test_Unit_1.pdf`
(Macmillan Education, 2020), confirmadas por el usuario, no
inferidas. 50 ítems calificables en total, coincide con el "Total: /
50" impreso en el propio test.

También se añadió **ImageSource** — capacidad nueva (mismo patrón
contrato + adapter que VideoSource/AudioSource), bucket público
`book-image`, para las fotos fijas que el Video Hub imprime junto a
ciertos ejercicios de Comprehension (ej. Unit 1, Exercise A: "Look at
the picture from the video"). `discussion-prompt.js` ahora muestra la
imagen directamente en el ejercicio (no escondida detrás del botón
"Watch the video"), con el mismo aviso honesto de siempre si el
archivo todavía no se subió a Storage.

**Para que la imagen de Unit 1 aparezca**: sube el archivo a Supabase
Storage, bucket `book-image`, con esta ruta exacta:
`book-american-language-hub-1/ALH_Level1_VideoHub_U1_comprehension.jpg`
(o cambia la extensión/ruta en `alh-level-1-unit-1.js` si prefieres
otro nombre). Mismo bucket y convención para las imágenes de las
demás unidades cuando su contenido se transcriba.

## Sprint 14 — Admin Console

Primera versión de la consola de administración — reemplaza el uso
diario de Supabase Studio para tareas de soporte a estudiantes. Vive
dentro de la misma SPA, no es una aplicación aparte: mismo bootstrap,
mismo router (rutas `#/admin`, `#/admin/users`, `#/admin/users/:id`,
`#/admin/licenses`, `#/admin/worksheet-attempts`,
`#/admin/reader-progress`, `#/admin/bookmarks`), mismo ciclo de vida.

**Cero tablas nuevas.** Reutiliza `profiles`, `license_keys`,
`unit_attempt_limits`, `worksheet_exercise_attempts`,
`reader_positions` y `bookmarks` tal cual — la única adición de
esquema es `profiles.role` (`docs/admin-console-schema.sql`), más
políticas RLS aditivas para admins y `security_invoker` en las dos
vistas ya existentes (`atlas_admin_overview`,
`unit_attempts_with_owner`) para poder consultarlas de forma segura
vía REST. Ejecutar ese archivo completo en Supabase antes de dar de
alta el primer admin (`update profiles set role = 'admin' where
user_id = '<uuid>'`).

**Acceso**: gateado por `profileRepository.isAdmin()` en
`screen-router.js` — una cuenta no-admin que llega a cualquier ruta
`/admin/*` ve el mismo estado "no disponible" que un libro no
autorizado, nunca una confirmación de que Admin existe. El ítem
"Admin" en el nav-secondary (`app-shell.js`) sigue el mismo criterio,
así que un estudiante normal no ve ningún rastro nuevo en la UI.

**MVP entregado**: Dashboard (conteos), Users (buscar + ver perfil,
con ficha completa en Users → estudiante), Licenses (ver, activar,
revocar), Worksheet Attempts (edita únicamente
`unit_attempt_limits.attempts_used` — `worksheet_exercise_attempts`
sigue sin controlar intentos, decisión de producto ya cerrada, no
reintroducida), Reader Progress (ver + reiniciar) y Bookmarks (ver +
eliminar).

Todos los repositorios de dominio ya existentes
(`profileRepository`, `licenseRepository`, `unitAttemptRepository`,
`readerPositionRepository`, `bookmarkRepository`) se extendieron con
métodos admin aditivos (`searchProfiles`, `isAdmin`, `countStudents`,
`listAllLicenses`/`setLicenseStatus`,
`listAllWithOwner`/`setAttemptsUsed`, `listForUser`/`resetPosition`,
`listAllForUser`) — ninguno se reemplazó ni se duplicó; el flujo del
propio estudiante no cambió una sola línea.

### Validaciones realizadas (Sprint 14)

Sin navegador real ni `jsdom` disponibles en este entorno: sintaxis
válida (`node --check`) en los 141 archivos `.js` del proyecto,
incluidos los ~20 nuevos/tocados de este sprint. Servidor HTTP
levantado, todos los archivos nuevos responden 200. `route-table.js`
probado por import directo (no solo por HTTP): las siete rutas
nuevas de `/admin/*` resuelven a una Navigation State válida, y las
rutas existentes del estudiante (`/library`, `/book/:id/unit/:id`,
etc.) siguen resolviendo exactamente igual que antes.

**Pendiente de tu verificación manual real en navegador**: correr
`docs/admin-console-schema.sql` contra un proyecto Supabase real,
dar de alta un primer admin, y probar de extremo a extremo las siete
pantallas — nada de esto se ejecutó contra una base de datos real
todavía.

---

Static SPA, HTML/CSS/JS ES Modules puro — sin framework, sin bundler
(Software Architecture, restricción C1). Diseñada para GitHub Pages
(C2).

## Correr en local

```bash
npm start
# o directamente:
node dev-server.mjs 8080
```

Sin proyecto Supabase real configurado (`src/config/env.public.js`
sigue en `null`), cualquier intento de login fallará explícitamente
con un mensaje calmado — esto es esperado hasta que se complete
`supabaseUrl`/`supabaseAnonKey` con un proyecto real (decisión
operativa, no de código).

## Qué existe en Sprint 6 — y qué no

Sprint 6 entrega **Authentication** — capa desacoplada del
proveedor, Supabase como primera implementación — más el flujo de
vinculación de cuenta que la propia arquitectura hizo necesario al
elegir construir Auth al final del Roadmap.

- **`src/auth/`** — patrón contrato + adapter, igual que
  `persistence/`. `auth-contract.js` no sabe que el proveedor es
  Supabase; `adapters/supabase-auth-adapter.js` es la única pieza que
  sí lo sabe, implementada con `fetch` plano contra la API REST
  pública de Supabase Auth — sin SDK, sin dependencias nuevas.
- **`src/remote-account-snapshot/`** — capacidad de infraestructura
  MÍNIMA (leer una vez / escribir una vez el snapshot remoto de una
  cuenta). Vive fuera de `app/` a propósito (es infraestructura, no
  un flujo de aplicación) y deliberadamente **no es la capa de
  Sync** — sin suscripción a cambios, sin reintentos, sin política de
  conflictos. Sync se diseñará por separado.
- **`src/app/account-linking/account-linking-flow.js`** — flujo de
  una sola ejecución, disparado por login exitoso, que reconcilia
  datos locales huérfanos (creados en Sprints 1-5, antes de que
  existiera Authentication) con la cuenta autenticada. Máquina de
  estados determinista e idempotente con cinco escenarios cubiertos:
  cuenta remota vacía, dispositivo nuevo, ambos con datos (pregunta
  explícita al estudiante, nunca decide en silencio), y dispositivo
  compartido (datos de otra cuenta se descartan sin fusionar nunca).
- **Gating de Authentication** en `screen-router.js`: sin sesión
  válida, cualquier URL renderiza Entry/Login en su lugar — nunca
  rutas de hash nuevas, es un estado transitorio de UI.
- **`userId` y `syncedAt`** añadidos a `Session`/`Attempt` (aditivo,
  no destructivo) — "pendiente de sincronizar" es
  `attempts.filter(a => a.syncedAt === null)`, nunca una cola aparte.

Deliberadamente fuera de Sprint 6:
- **Sincronización continua, resolución de conflictos multi-
  dispositivo** — capacidad "Sync" independiente, diseño posterior.
- **Favorites** — el modelo sigue listo, sin implementar.
- **Review Mode**.

## Corrección de dominio en este sprint

Ninguna. Sí se documentó una premisa inválida en Software
Architecture §13.5 (asumía que no podían existir datos huérfanos
pre-login — invalidada por la propia secuencia de sprints que el
Roadmap aprobado eligió) — ver "Cambios recomendados en
documentación" del resumen técnico.

## Estructura nueva

```
src/
  auth/
    auth-contract.js              Único punto de entrada de Auth
    auth-session-shape.js         Forma de AuthSession (vive aquí,
                                   nunca en domain/contracts)
    adapters/
      supabase-auth-adapter.js    Única pieza que conoce a Supabase
  remote-account-snapshot/
    account-snapshot-contract.js  Leer/escribir UNA VEZ — no es Sync
    adapters/
      supabase-account-snapshot-adapter.js
  app/
    account-linking/
      account-linking-flow.js     Máquina de estados de vinculación
  presentation/screens/
    entry/       Entry — wordmark a tamaño natural
    login/       Login — dos campos, una acción
    account-linking/
      linking-decision-screen.js  Única decisión nunca silenciosa
```

## Validaciones realizadas

Sin navegador real disponible: sintaxis válida en todo `.js`/`.css`
nuevo y tocado. Servidor HTTP levantado, todos los archivos nuevos
responden 200.

**Con el shim de DOM ya usado en Sprint 5**, se probó de extremo a
extremo, a través del `screen-router.js` real (no solo unidades
aisladas):
- Flujo completo sin auth → Entry → Login → password incorrecta
  (permanece en Login, con mensaje de error) → password correcta →
  Home.
- **Los cinco escenarios de vinculación de cuenta**, probados de
  forma aislada y end-to-end a través del router real: cuenta remota
  vacía con datos locales (Caso 1), dispositivo nuevo con datos
  remotos (Caso 2), ambos con datos → pantalla de decisión →
  "Conservar y combinar" fusiona ambos historiales sin pérdida (Caso
  3), "Descartar progreso de este dispositivo" (Caso 4), y
  dispositivo compartido con datos de otra cuenta (descartados en
  silencio, nunca fusionados, Caso 5).
- **Idempotencia**: ejecutar el flujo de vinculación dos veces para
  la misma cuenta no duplica ningún Attempt.
- **Fallo de red durante `CHECK_REMOTE`**: no bloquea al estudiante,
  los datos locales quedan intactos para reintentar en un login
  posterior.
- **Regresión Sprint 2-5 tras autenticarse**: Library → Book → Unit →
  Lesson entry → Learning Session, todas renderizan correctamente;
  Session y Attempts nuevos quedan taggeados con el `userId` real de
  la cuenta activa (verificado explícitamente), nunca huérfanos.
- `signOut()` devuelve correctamente a Entry.

**Pendiente de tu verificación manual real en navegador** (`npm
start`, con un proyecto Supabase real configurado en
`env.public.js`): flujo de login real contra Supabase, verificación
visual de las tres pantallas nuevas, y confirmación de que el
snapshot remoto se escribe/lee correctamente contra una base de datos
real.
