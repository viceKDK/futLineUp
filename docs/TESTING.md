# Pruebas, FIRST y cobertura

## Comandos

Usar Node 22.16.0 (`.nvmrc`). El runtime mantiene el rango previo del paquete; los umbrales nativos de cobertura requieren Node >=22.8.

```sh
npm test                    # unitarias y contratos; no instala ni abre navegador
npm run test:architecture   # imports estáticos, capas, ciclos e inventario offline
npm run test:coverage       # 95% líneas, 90% ramas, 95% funciones como mínimos globales del núcleo
npm run quality:core        # arquitectura + cobertura, sin red ni npm ci
npm ci
npm run format:check
npm run lint
npm run test:functional     # build + selección de pruebas Chromium, sin Supabase real
npm run test:e2e            # suite Playwright, incluyendo proyectos configurados
npm run quality            # formato, lint, núcleo y selección funcional
npm run security:audit     # auditoría de dependencias separada; requiere red
```

`npm test` ya no es el alias de Playwright: ese comportamiento pasa a `test:e2e`. `testMatch: **/*.spec.js` impide que Playwright ejecute los tests nativos `.test.js`.

## FIRST en este repositorio

**Fast:** dominio, servicios y adaptadores se verifican con `node:test`, sin navegador, servidor ni instalación previa. La integración visual queda en otra suite.

**Independent:** cada prueba crea almacenes, runtimes y listeners propios. Se verifica el contrato de ambos adaptadores con los mismos casos. No compartir un singleton entre pruebas.

**Repeatable:** inyectar reloj, secuencia aleatoria y puertos. Se prueban fallos de cuota, bloqueo de lectura y rollback con dobles locales. No depender de red, credenciales, fechas del día ni pausas arbitrarias.

**Self-validating:** assertions comprueban resultados, excepciones, preservación de datos y notificaciones. Cualquier fallo o umbral insuficiente devuelve salida distinta de cero. También se prueban infracciones deliberadas del guardián arquitectónico.

**Timely:** escribir el caso que reproduce el defecto o la nueva regla antes de implementarla y conservarlo como regresión. La cobertura no demuestra que se haya seguido TDD ni certifica este principio por sí sola.

## Qué se mide y qué no

El inventario incluye todos los módulos JavaScript nativos de `domain`, `application` e `infrastructure`, más `create-runtime.js` e `install-browser-runtime.js`. La prueba de inventario importa cada módulo para que un archivo sin pruebas no desaparezca del denominador. El runner usa exactamente ese inventario como lista de inclusión, también para subcarpetas nuevas.

Se generan `coverage/lcov.info` y `coverage/summary.json`. **No es cobertura global de la aplicación.** No incluye JSX heredado, hooks/UI, el bridge con efectos de arranque, los schedulers planos ni archivos generados. Los umbrales son agregados: revisar además cada archivo del reporte. No elevar un porcentaje eliminando módulos del inventario o excluyendo ramas difíciles.

La validación de comportamiento cubre límites y claves peligrosas de JSON, Unicode y tamaño real en bytes, formatos de backup compatibles, extensiones, sorteos reproducibles, snapshots estables, suscripciones, almacenamiento fallido, recuperación con y sin fallos secundarios y contratos de persistencia.

## Integración y seguridad

Las pruebas `.spec.js` existentes se conservan. `runtime-architecture.spec.js` comprueba las APIs heredadas sobre el núcleo nuevo en el navegador. Las pruebas de PWA verifican la experiencia offline en su proyecto con service workers habilitados.

No ejecutar `test:supabase` contra producción. Requiere credenciales explícitas de staging y modifica datos de ese usuario. No es parte del circuito FIRST ni una condición del modo invitado.

Un informe honesto distingue pruebas ejecutadas, configuradas y pendientes. Sin ejecutar `npm ci`, build, lint y la suite de navegador no se puede afirmar que toda la calidad de entrega esté validada.
