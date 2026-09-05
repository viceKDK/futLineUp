# Segunda pasada de arquitectura — estado

## Implementado

La segunda pasada extrajo y conectó reglas que estaban mezcladas con presentación: clasificación, fixture round-robin, CSV y copa de Liga; transformaciones del editor de alineaciones; asistencia/evaluaciones/objetivos de Entrenador; balance de equipos por cantidad/rating; backups automáticos; y sincronización cloud.

Las pantallas de **Liga**, **configuración/importación de Liga**, **Editor**, **Entrenador** y **Sorteo** ya delegan sus reglas a `domain`/`application` mediante las facades temporales del composition root. Esos archivos salieron de sus excepciones de tamaño legacy. Tests arquitectónicos impiden volver a copiar parsers, balanceadores, standings o transformaciones de lineup/coach en presentación.

IndexedDB y Supabase son adapters. Clock, random, timers, almacenamiento y remotos son sustituibles en tests. La sincronización cloud preserva/exporta el snapshot local antes del reemplazo destructivo. Copa invalida resultados de rondas posteriores cuando cambia un ganador previo, evitando scores asociados a equipos antiguos.

La calidad incluye pruebas basadas en invariantes, mutation smoke, contract tests, gates de dirección/ciclos/globals, concurrencia real entre pestañas, métricas Ca/Ce/I/A/D, source budgets, ADRs y Definition of Done.

## Deuda visible restante

El objetivo global sigue siendo 500 líneas. Las únicas excepciones de presentación que permanecen registradas en `scripts/source-quality.mjs` son áreas heredadas que no formaban el núcleo de negocio de esta pasada: compartir, home, participant guard y escenas de promo. Tienen techo congelado: no pueden crecer y deben salir de esa lista al ser trabajadas. Core nuevo conserva límite de 300 líneas.

`legacy-bridge.js` sigue siendo temporal porque las pantallas se cargan como scripts clásicos y consumen React/servicios globales existentes. No contiene reglas de negocio y no se permite agregar nuevas facades fuera de ese composition root. Su eliminación completa requiere migrar el sistema de entradas de presentación a módulos nativos; se mantiene como deuda explícita, no como arquitectura objetivo.

## Validación

La primera pasada se ejecutó con 33 tests unitarios/de contrato + 7 de arquitectura y 100% line/branch/function sobre el alcance de 14 módulos de ese momento. El alcance actual es mayor, por lo que ese porcentaje histórico no se reutiliza.

En esta segunda pasada los tests/gates fueron agregados al repositorio pero este entorno no volvió a ejecutar `npm ci`, Babel completo, ESLint, Prettier ni Playwright. Para validar una entrega ejecutar:

```sh
npm run format
npm run quality:core
npm run metrics:packages
npm run metrics:source
npm run lint
npm run test:functional
npm run test:e2e
```

`test:supabase` queda separado y solo debe apuntar a staging. No se agregó GitHub Actions.
