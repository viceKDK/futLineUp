# Arquitectura

## Dirección

`futbolClub` usa organización **feature-first con capas internas**:

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

Dominio importa dominio. Application coordina casos de uso/puertos. Infrastructure implementa adapters. Presentation renderiza y traduce eventos de UI. `shared` no depende de features. `app` compone implementaciones concretas y mantiene el bridge de compatibilidad mientras las entradas de presentación sigan siendo scripts clásicos.

`tests/architecture` comprueba imports, módulos inexistentes, ciclos, globals prohibidos, publicación de facades, modernización de presentaciones y tamaño del core.

## Features extraídas y conectadas

**Liga:** standings, reglas de puntos/desempate, validación de resultados, round-robin, participantes, CSV y copa viven en `features/league/domain`. Las pantallas consumen estas APIs. Al cambiar un resultado de una ronda temprana de Copa se invalidan resultados posteriores para preservar consistencia del cuadro.

**Alineaciones:** `lineup-draft.js` contiene resize/asignación/swap, auto-fill con arquero, suplentes, posiciones libres, selección de modo y snapshot de equipo. Editor usa esas operaciones y queda enfocado en estado/DOM.

**Sorteo:** `TeamBalancer` usa Strategy `count`/`rating`, conserva locks y acepta estrategias adicionales por composición. La UI ya no contiene el algoritmo.

**Entrenador:** asistencia, evaluaciones, tendencia, atributos, objetivos y overview son dominio puro. Coach consume esas funciones y conserva solo interacción/presentación.

**Backups/nube:** `AutomaticBackupService` coordina política/retención/restauración; `BackupScheduler` recibe timers; IndexedDB es adapter. Cloud sync recibe un puerto remoto; Supabase lo implementa. `preserveLocal` ocurre antes de reemplazar estado local.

## SOLID

- **SRP:** reglas, persistencia, scheduling, remote sync y UI tienen razones de cambio distintas.
- **OCP:** validadores/estrategias de backup, puntos/desempates y balanceadores se extienden por composición/registros.
- **LSP:** adapters sustituibles cumplen contract tests comunes.
- **ISP:** casos de uso reciben capacidades mínimas en vez de plataformas completas.
- **DIP:** domain/application no construyen Supabase, IndexedDB, localStorage, timers reales ni React.

Patrones deliberados: Strategy, Adapter, Observer, Composition Root y Facade temporal. No se agregan patrones sin variación/frontera real.

## Persistencia y concurrencia

Ediciones normales pueden degradar a memoria si storage falla y emiten diagnóstico. Importaciones destructivas preparan estado previo y realizan rollback best-effort, sin prometer atomicidad inexistente. Eventos `storage` invalidan snapshots entre pestañas y Playwright contiene una prueba con dos páginas reales.

## Fitness functions

- ADP: ciclos prohibidos.
- Ca/Ce/I: derivados del grafo real.
- A/D: A usa módulos de contrato explícitos como aproximación compatible con JavaScript; D=`|A+I-1|`.
- SDP: se reportan dependencias estable→más inestable.
- SAP: observado con A/I/D.
- CCP/CRP/REP: se revisan con historial de cambio/reuso/release, no con números inventados de una snapshot.

## Tamaño

Core (`domain/application/infrastructure`) tiene límite 300 líneas; presentación nueva, 500. Las pocas excepciones heredadas restantes tienen techos congelados en `scripts/source-quality.mjs` y aparecen como migration debt. Liga, League Setup, Editor, Coach y Draw ya no están en esa lista.

El paso final de largo plazo es convertir las entradas de presentación a ES Modules y eliminar `legacy-bridge.js`. Hasta entonces el bridge solo adapta contratos existentes: no es destino permitido para nuevas reglas.
