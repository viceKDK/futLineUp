# Arquitectura

## Dirección

`futbolClub` usa organización **feature-first con capas internas**. Una feature contiene solo las capas que realmente necesita:

```text
src/
  app/                           # composition root + bridge temporal
  features/
    league/{domain,presentation}
    lineup/{domain,presentation}
    draw/{domain,presentation}
    coach/{domain,presentation}
    backup/{domain,application,infrastructure}
    auth/{application,infrastructure,presentation}
    sharing/{application,presentation}
    ...
  shared/{domain,application,infrastructure,presentation}
```

Dominio importa dominio. Application coordina casos de uso y contratos. Infrastructure implementa puertos concretos. Presentation renderiza y traduce eventos de UI. `shared` nunca depende de una feature. `app` es el único lugar autorizado a componer implementaciones concretas y a mantener el bridge de compatibilidad.

`tests/architecture` analiza imports reales, módulos inexistentes, ciclos, dependencias externas, browser globals en domain/application, publicación de facades y tamaño del core.

## Núcleo extraído

### Liga

`features/league/domain` contiene clasificación, validación de resultados, round-robin ida/vuelta, normalización de participantes, importación CSV y copa eliminatoria. Desempates y políticas de puntos son sustituibles. `page-league-setup.jsx` ya delega CSV y nombres al dominio; `page-league.jsx` continúa como deuda de presentación grande mientras se mantiene su contrato visual.

### Alineaciones

`features/lineup/domain/lineup-draft.js` contiene asignación, swap, auto-fill con arquero, suplentes/capitán, posiciones libres, selección de modo y snapshot de equipo. Las funciones son inmutables y no conocen React/DOM.

### Sorteo

`features/draw/domain/team-balancer.js` implementa Strategy: balance por cantidad y por rating, conserva locks y permite registrar estrategias adicionales sin modificar el algoritmo coordinador. La pantalla ya consume esta API y no implementa el balance por su cuenta.

### Entrenador

`features/coach/domain/coach.js` concentra asistencia, evaluaciones, tendencia, atributos, objetivos y overview. La pantalla heredada aún contiene parte del wiring y se mantiene bajo techo de migración.

### Backups y nube

`AutomaticBackupService` decide cuándo crear, retener y restaurar. `BackupScheduler` recibe puertos de timer. IndexedDB es un adapter separado. La sincronización cloud recibe un puerto remoto; Supabase implementa ese puerto. Antes de reemplazar estado local por remoto, el caso de uso ofrece `preserveLocal`, que la UI usa para exportar el snapshot de seguridad.

## SOLID

**SRP:** validación, reglas, persistencia, scheduling, remote sync y UI tienen razones de cambio distintas.

**OCP:** campos/estrategias de backup, desempates, políticas de puntos y balanceadores se extienden mediante composición/registros, no agregando `if` al caso de uso estable.

**LSP:** adapters de almacenamiento pasan contratos compartidos; una implementación puede sustituir a otra sin cambiar consumidores.

**ISP:** los casos de uso reciben capacidades mínimas (`reader`, `writer`, repository, remote, timer, codec, clock) en lugar de objetos de plataforma completos.

**DIP:** domain/application no construyen Supabase, IndexedDB, localStorage, timers reales ni React. `app`/infrastructure inyectan esas implementaciones.

Patrones deliberados: Strategy, Adapter, Observer, Composition Root y Facade temporal. No se agrega un patrón si no existe una variación o frontera real.

## Persistencia

La edición normal puede continuar en memoria si `localStorage` falla, notificando el error. Las importaciones destructivas preparan el estado previo, escriben de forma estricta y realizan rollback best-effort. No se promete atomicidad que el navegador no ofrece. Un rollback incompleto se reporta como tal.

Eventos `storage` invalidan snapshots entre pestañas, incluido remove/clear. Playwright tiene una prueba con dos páginas reales del mismo contexto para esta propiedad.

## Fitness functions y métricas

- **ADP:** ciclos prohibidos automáticamente.
- **Ca/Ce/I:** calculados desde el grafo real de imports.
- **A/D:** A usa módulos de contrato explícito como aproximación compatible con JavaScript; D = `|A + I - 1|`.
- **SDP:** reporte de dependencias donde un paquete sustancialmente más estable depende de otro más inestable.
- **SAP:** visible mediante A/I/D.
- **CCP/CRP/REP:** no se falsifican como números instantáneos; se revisan con historial de cambio, reuso y superficie de release.

Ver `npm run metrics:packages` y ADR 0005.

## Tamaño y deuda

Core nuevo (`domain/application/infrastructure`) tiene límite de 300 líneas. Presentación nueva tiene 500. Algunos componentes heredados poseen techos congelados explícitos en `scripts/source-quality.mjs`: no pueden crecer y deben salir de la lista al reducirse. `page-league-setup.jsx` ya salió de esa excepción después de delegar CSV/nombres al dominio.

El objetivo final es eliminar todos los techos legacy y luego `legacy-bridge.js`. Hasta entonces el bridge es compatibilidad, no destino de nueva lógica.
