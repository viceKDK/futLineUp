# Estrategia de pruebas

## FIRST

La suite primaria del núcleo usa `node:test` y no necesita navegador, red, servidor ni credenciales. Cada caso crea su propio estado. Clock, random, timers, repositories y remote adapters son inyectables. Las assertions validan comportamiento y error paths; un fallo retorna código no cero.

```sh
npm test
npm run test:architecture
npm run test:coverage
npm run test:mutation
npm run test:source-budgets
npm run quality:core
```

`Timely` se aplica como regla de contribución: el comportamiento o bug debe tener una prueba que lo reproduzca antes de aceptar la implementación. La cobertura no prueba que TDD haya ocurrido.

## Cobertura

El inventario de cobertura incluye los módulos core nativos y los importa aunque no tengan un test dedicado, evitando que un archivo nuevo desaparezca del denominador. Los umbrales configurados son 95% líneas, 90% ramas y 95% funciones para ese alcance. No representan cobertura total de JSX/pantallas.

El resultado histórico de 100% pertenecía a la primera extracción de 14 módulos. La segunda pasada amplió el alcance; hay que volver a ejecutar el reporte antes de citar un porcentaje nuevo.

## Propiedades e invariantes

`feature-domain.test.js` no prueba solamente ejemplos felices: recorre distintos tamaños para round-robin y balance, verifica unicidad de pares, conservación de jugadores, diferencia máxima de tamaños, locks y determinismo con random inyectado. Copa, CSV, lineups y Coach cubren límites e inputs inválidos.

## Mutation smoke

`npm run test:mutation` aplica alteraciones reales sobre reglas sensibles (orden de puntos, frontera temporal, unicidad en lineup). Cada mutante debe ser detectado por un invariante; sobrevivir hace fallar el comando. Es una señal complementaria, no un sustituto de una herramienta de mutación exhaustiva.

## Arquitectura y métricas

`tests/architecture` valida dirección, ciclos, globals, contratos, inventario offline, release assets y source budgets. `metrics:packages` produce Ca/Ce/I/A/D y candidatos SDP. `metrics:source` produce líneas, decisiones, funciones, deuda >500 y violaciones de techo.

## Integración

Playwright conserva journeys existentes y agrega:

- `runtime-architecture.spec.js`: compatibilidad del núcleo modular;
- `storage-concurrency.spec.js`: propagación real entre dos pestañas;
- `draw-strategy.spec.js`: Strategy count/rating desde UI;
- backups/PWA/seguridad/mobile/web-vitals existentes.

`npm run test:functional` incluye los casos críticos anteriores en Chromium. `npm run test:e2e` ejecuta la suite configurada. Supabase real queda separado en `test:supabase` y solo debe apuntar a staging explícito.

## Política de reporte

Distinguir siempre entre tests configurados y tests ejecutados. No declarar un build o porcentaje aprobado si el entorno no permitió correrlo. No se rebajan umbrales ni se excluyen módulos para lograr verde.
