# ADR 0002 — Puertos/adapters y bridge temporal

**Estado:** aceptado.

Casos de uso reciben capacidades mínimas: lectura/escritura, backup repository, remote backup, clock, codec o timers. Browser, IndexedDB y Supabase son adapters. No se usa un contenedor DI global; el composition root conecta funciones/fábricas explícitamente.

Las pantallas existentes todavía consumen globals. `src/app/legacy-bridge.js` expone temporalmente facades compatibles para permitir una migración incremental sin reescribir toda la UI en un solo cambio. Código nuevo no debe agregar otra dependencia a ese bridge.

El bridge se considera terminado cuando todas las pantallas consuman módulos/casos de uso mediante entradas explícitas y pueda eliminarse sin modificar dominio.
