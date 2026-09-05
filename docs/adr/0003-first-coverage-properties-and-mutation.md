# ADR 0003 — FIRST, cobertura, propiedades y mutación

**Estado:** aceptado.

La suite primaria del núcleo usa `node:test`: rápida, independiente, repetible, auto-validante y escrita junto al cambio. Reloj, random, timers, almacenamiento y remotos son inyectables. Playwright queda para integración/journeys.

La cobertura del núcleo tiene umbrales globales, pero ningún porcentaje se presenta como cobertura de toda la UI. El inventario carga cada módulo medido para que un archivo sin tests no desaparezca del denominador.

Pruebas de propiedades recorren tamaños y semillas en algoritmos con invariantes. `test:mutation` aplica mutaciones reales a reglas críticas sin sumar una dependencia de producción; si un mutante sensible sobrevive, la suite falla.
