# Atlas Learning

**Estado actual:** Sprint 6 (Authentication) implementado.

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
