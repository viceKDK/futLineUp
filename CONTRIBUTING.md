# Contribuir

Leer [arquitectura](docs/ARCHITECTURE.md), [política de calidad](docs/CODE_QUALITY.md), [pruebas](docs/TESTING.md) y los ADRs antes de introducir lógica nueva.

Una funcionalidad pertenece a `src/features/<nombre>/`; una regla pura va en `domain`, una operación coordinada en `application`, un acceso externo en `infrastructure` y la UI en `presentation`. Solo `app` compone implementaciones. Compartir código después de demostrar reutilización real, no mediante una carpeta genérica de utilidades.

Cada cambio de comportamiento debe incluir primero una prueba que reproduzca la regla o el defecto, los casos de error relevantes y ausencia de regresiones. Extender políticas mediante composición. No añadir herencia, interfaces o patrones sin un punto de variación real. Mantener contratos pequeños y errores explícitos; no ocultar fallos de persistencia bajo mensajes de éxito.

Ejecutar `npm run quality:core`, `npm run metrics:packages`, `npm run metrics:source`, `npm run format:check`, `npm run lint` y las pruebas funcionales afectadas antes de publicar. No rebajar umbrales para conseguir un resultado verde. Documentar cualquier comando que no pudo ejecutarse. No afirmar cobertura total usando el informe del núcleo.

Los módulos nuevos de dominio/aplicación/infraestructura no pueden superar 300 líneas. Presentación nueva tiene objetivo y límite de 500. Los archivos legacy con techo explícito no pueden crecer; al modificarlos deben reducirse. La lista está en `scripts/source-quality.mjs` y se reporta como deuda, no como excepción permanente.

Actualizar `scripts/client-entries.mjs` al mover entradas, regenerar `compiled/` con `npm run build:client` y revisar el inventario offline. Nunca guardar credenciales privadas ni usar una cuenta de producción para tests.

Los controles de calidad son scripts del repositorio y se ejecutan localmente o en el entorno que el equipo elija. Este repositorio no requiere agregar GitHub Actions para aplicar estas reglas.
