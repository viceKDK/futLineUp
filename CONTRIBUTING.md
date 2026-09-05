# Contribuir

Leer [arquitectura](docs/ARCHITECTURE.md) y [pruebas](docs/TESTING.md) antes de introducir lógica nueva.

Una funcionalidad pertenece a `src/features/<nombre>/`; una regla pura va en `domain`, una operación coordinada en `application`, un acceso externo en `infrastructure` y la UI en `presentation`. Solo `app` compone implementaciones. Compartir código después de demostrar reutilización real, no mediante una carpeta genérica de utilidades.

Cada cambio debe incluir una prueba de comportamiento, los casos de error relevantes y ausencia de regresiones. Extender políticas mediante composición. No añadir herencia o interfaces sin un punto de variación real. Mantener contratos pequeños y errores explícitos; no ocultar fallos de persistencia bajo mensajes de éxito.

Ejecutar `npm run quality:core`, `npm run format:check`, `npm run lint` y las pruebas funcionales afectadas antes de publicar. No rebajar umbrales para conseguir un resultado verde. Documentar cualquier comando que no pudo ejecutarse. No afirmar cobertura total usando el informe del núcleo.

Actualizar `scripts/client-entries.mjs` al mover entradas, regenerar `compiled/` con `npm run build:client` y revisar el inventario offline. Nunca guardar credenciales privadas ni usar una cuenta de producción para tests.
