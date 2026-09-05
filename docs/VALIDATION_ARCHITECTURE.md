# Validación de la migración arquitectónica — 2026-09-05

Entorno de ejecución: Node 22.16.0, Linux. Se ejecutaron los módulos y pruebas nuevos en una copia de trabajo parcial; no se presenta esto como validación de todas las pantallas del repositorio.

## Ejecutado

`npm run quality:core` finalizó con código 0: **33 pruebas unitarias/de contrato y 7 pruebas de arquitectura**, sin fallos.

La última medición nativa del núcleo arrojó **100% de líneas, 100% de ramas y 100% de funciones**. El alcance es el inventario de 14 módulos nuevos de dominio/aplicación/infraestructura y composición; no incluye JSX heredado, hooks, archivos generados ni schedulers. Los umbrales configurados son 95/90/95 y los archivos sin pruebas dentro del alcance se importan para no desaparecer del denominador. Reportes reproducibles en `coverage/lcov.info` y `coverage/summary.json` al ejecutar el comando.

Se probaron explícitamente extensiones de campos y estrategias sin modificar el importador; contratos de almacenamiento; límites y entradas inválidas; rollback exitoso y fallido; conservación del snapshot ante fallos de lectura; edición en memoria ante fallos de escritura; desuscripción idempotente y observadores reentrantes; eventos de otras pestañas simulados; inventario offline, orden declarado de scripts y manifiesto de release con módulos nativos sin configuración local privada.

## No verificado en este entorno

La instalación de dependencias npm falló por resolución de red (`EAI_AGAIN`). No se ejecutaron Babel completo, ESLint, Prettier ni la suite completa de Playwright. El intento de integración Chromium sobre servidor local quedó bloqueado con `ERR_BLOCKED_BY_ADMINISTRATOR` antes de cargar la aplicación. **No se reporta ese intento como un test de navegador aprobado.** Tampoco se ejecutaron pruebas contra Supabase real ni un despliegue.

Las rutas de las pantallas se trasladan conservando los blobs originales, y se actualizan manifiesto de build, HTML, promo, service worker y las comprobaciones estáticas correspondientes. Aun así, antes de publicar una release hay que ejecutar `npm ci`, `npm run format`, `npm run quality` y los proyectos E2E/PWA/Edge pertinentes en un entorno habilitado. No rebajar ni desactivar los controles de calidad para omitir esa verificación.

Esta migración establece una base comprobable; no certifica que todo el repositorio sea ya un ejemplo acabado de SOLID ni que la cobertura de toda la aplicación sea 100%.
