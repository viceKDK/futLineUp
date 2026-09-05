# Segunda pasada de arquitectura — estado

## Implementado

La segunda pasada extrajo reglas que seguían mezcladas con presentación: clasificación y fixture de Liga, CSV, copa eliminatoria, transformaciones del editor de alineaciones, dominio de Entrenador, balance de equipos por cantidad/rating, política/scheduler de backups automáticos y sincronización cloud. IndexedDB y Supabase quedan como adapters; reloj, random, timers y repositorios son sustituibles en tests.

El sorteo ya consume el `TeamBalancer` extraído y permite Strategy `count`/`rating`. El bridge de compatibilidad expone temporalmente los módulos a pantallas clásicas, pero no contiene reglas de negocio nuevas. Se corrigió además el flujo cloud para ofrecer la preservación del snapshot local antes de reemplazarlo por la copia remota.

La calidad ahora incluye pruebas basadas en invariantes para round-robin y balance, mutation smoke de reglas sensibles, tests de contratos, gates de dirección/ciclos/globals, pruebas de concurrencia real entre pestañas, métricas Ca/Ce/I/A/D y presupuestos de tamaño. Presentación nueva no puede superar 500 líneas; core nuevo, 300. Los archivos heredados grandes tienen techos congelados para impedir crecimiento mientras se reducen.

Se añadieron ADRs para arquitectura feature-first, puertos/adapters y bridge, FIRST/cobertura/mutación, persistencia/rollback y métricas de paquetes.

## Deuda de migración deliberadamente visible

`page-league.jsx`, `page-editor.jsx`, `page-coach.jsx`, `page-share.jsx` y algunas pantallas auxiliares siguen siendo componentes heredados grandes. La lógica reutilizable ya tiene hogar fuera de ellos, pero aún contienen wiring/UI y algunas transformaciones duplicadas. No se los marca como “terminados”: aparecen en el reporte `metrics:source` hasta quedar por debajo del objetivo de 500 líneas y hasta que el bridge pueda eliminarse.

La regla es monotónica: esos archivos no pueden crecer por encima de su techo actual y cualquier trabajo funcional nuevo debe usar los módulos extraídos. No se introducen nuevos globals ni nuevas reglas dentro del bridge.

## Validación

La primera pasada fue ejecutada anteriormente con 33 tests unitarios/de contrato + 7 de arquitectura y 100% line/branch/function sobre su alcance de 14 módulos. Desde entonces el alcance aumentó sustancialmente; por eso ese porcentaje histórico **no se reutiliza** para afirmar cobertura de la segunda pasada.

La segunda pasada agrega pruebas y gates al repositorio, pero en este entorno no se volvió a ejecutar `npm ci`, Babel completo, ESLint, Prettier ni Playwright. La validación de entrega requerida es:

```sh
npm run format
npm run quality:core
npm run metrics:packages
npm run metrics:source
npm run lint
npm run test:functional
npm run test:e2e
```

`test:supabase` queda fuera de FIRST y solo debe ejecutarse con staging explícito. No se agregó GitHub Actions.
