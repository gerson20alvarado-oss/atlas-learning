# Atlas Learning

**Estado actual:** Sprint 1 (Foundation) implementado.

Static SPA, HTML/CSS/JS ES Modules puro — sin framework, sin bundler
(Software Architecture, restricción C1). Diseñada para GitHub Pages
(C2). Ver `docs/` (fuera de este repo de código) para PRD, Product
Design, Software Architecture, Wireframe Review, Technical
Specification y el Roadmap de implementación — este README no
reemplaza ninguno de esos documentos, solo orienta el código.

## Correr en local

```bash
npm start
# o directamente:
node dev-server.mjs 8080
```

Abrir `http://localhost:8080/`. No hay paso de build: los archivos se
sirven tal cual.

## Qué existe en Sprint 1 — y qué no

Sprint 1 entrega **Foundation** (Engineering Implementation Roadmap,
Phase 1): estructura de proyecto, routing, layout compartido, UI
compartida y el sistema de eventos base. Su Exit Criteria es
"la aplicación arranca correctamente" — no incluye ninguna pantalla
de producto real (Library, Book, Lesson, etc.), que llegan en los
sprints siguientes según la Dependency Matrix del Roadmap.

## Estructura

```
src/
  app/            Composición raíz — el único lugar que conoce todas las capas
  config/         Configuración pública y resolución de base path (GH Pages)
  core/
    events/       Bus pub/sub no bloqueante + vocabulario de eventos
    router/       Router hash-based + forma de la Navigation State
    errors/       Clasificación de errores (recoverable vs. must-surface)
  persistence/    Contrato de storage + envelope versionado (sin dominio real aún)
  domain/
    contracts/    Forma de Library/Book/Unit/Lesson (sin datos aún)
  presentation/
    components/   Componentes de UI puros — sin conocer router/persistence
    screens/      Vacía — punto de extensión para Sprint 2+
```

Cada carpeta de primer nivel bajo `src/` corresponde 1:1 a una capa de
Software Architecture §9.2. `sync/` y `auth/` no existen todavía —
llegan en Sprint 6, no se crean vacías de antemano.

## Regla de vecinos

Cada capa solo llama a la que tiene inmediatamente debajo
(Software Architecture §9.3): Presentation → Router (Session &
Navigation) → Domain → Persistence. `presentation/components/` no
importa nada fuera de sí misma — recibe todo por props/callbacks
inyectados desde `app/`.

## Verificación manual de Sprint 1

`bootstrap()` se ejecutó contra un DOM simulado (sin dependencias
externas) confirmando que: monta el App Shell, el router resuelve la
ruta inicial y publica `route:changed`, y el contrato de persistencia
hace round-trip completo (write → envelope versionado → read →
payload desenvuelto) sin lanzar excepciones ante JSON corrupto o
claves inexistentes.
