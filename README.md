# Atlas Learning

**Estado actual:** Sprint 14 (Admin Console) implementado. Después de
Sprint 14: se añadió **Progress Test Unit 1** (American Language Hub
Level 1) como sección final de la worksheet de la Unidad 1, con tres
tipos de ejercicio nuevos en el Worksheet Engine — `matching`,
`choice`, `shortAnswer` (ver
`src/presentation/components/worksheet-exercises/` y
`domain/contracts/worksheet-exercise-lifecycle.js`). Contenido y
respuestas oficiales transcritos de `Progress_Test_Unit_1.pdf`
(Macmillan Education, 2020), confirmadas por el usuario, no
inferidas. 50 ítems calificables en total, coincide con el "Total: /
50" impreso en el propio test.

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
