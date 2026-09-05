# Compartir: módulos nativos y validación

## Alcance de esta entrega

Se reemplaza `src/features/sharing/presentation/page-share.jsx` por módulos nativos con responsabilidades separadas. La entrada pública `compiled/page-share.js` mantiene su URL, pero carga `src/app/mount-share.js`. El punto de composición recibe las APIs globales que todavía usa la aplicación; las reglas, servicios, adaptadores y componentes de Compartir no consultan `window`.

Esto no elimina el `legacy-bridge.js` de otras funcionalidades, no migra Participant Guard y no certifica toda la aplicación. La única excepción de tamaño registrada que queda en `scripts/source-quality.mjs` es `league-participant-guard.jsx`; eso describe la configuración, no una medición completa del repositorio.

## Responsabilidades

`domain/share-model.js` proyecta exclusivamente los campos necesarios, selecciona camiseta/capitán, resuelve jugadores y aplica las opciones de privacidad al enlace. No copia arbitrariamente el registro de cada jugador. `domain/calendar-event.js` produce el calendario desde instantes UTC explícitos. `shared/domain/civil-date.js` valida fechas reales sin aceptar normalizaciones como 30 de febrero.

`application/share-service.js` coordina exportación, enlaces, canales y compartir nativo por puertos. Los exportadores y canales son estrategias registradas; una extensión no modifica el coordinador y los nombres incorporados no se sobrescriben silenciosamente. `snapshot-service.js` conserva validación estricta y distingue el error de tamaño con `SHARE_TOO_LARGE`.

`infrastructure` implementa captura, PDF, descarga, portapapeles, Web Share y conversión horaria. El código recibe APIs y proveedores, permitiendo dobles de prueba sin red ni navegador. Los fallos se propagan y cancelar un diálogo no se presenta como una exportación exitosa.

`presentation` contiene la página, los controles y tres diseños de vista previa: Card, Lista y Stories. Se conservan fotos/camisetas, camiseta alternativa, posiciones libres, PNG/PDF/ICS, enlaces y canales. Los diseños adicionales también se pueden registrar. Los cambios de partido y opciones en un enlace recibido son locales a esa vista, sin reemplazar los datos persistidos del receptor.

## Correcciones de comportamiento

Los campos opcionales se proyectan con valores JSON válidos: un jugador sin `secondaryPos` o `preferredFoot` ya no produce `undefined` que haga fallar el enlace. El reintento sin fotos solo ocurre ante un error de tamaño; las demás validaciones no se ocultan.

Ocultar nombres también elimina las fotos y el nombre del capitán del contenido compartido. Ocultar cancha/horario elimina fecha, hora y lugar del enlace; ocultar estadísticas elimina los marcadores. El archivo ICS siempre necesita fecha y hora para representar un evento, pero omite el lugar cuando está desactivado. Los enlaces son contenido autocontenido, no cifrado: cualquiera que reciba el enlace puede leer los campos incluidos.

Las exportaciones validan las dimensiones de la captura, rechazan un `toBlob` vacío y limpian URLs temporales incluso ante errores. El PDF ajusta la imagen sin deformarla. Un fallo de enlace no bloquea automáticamente la descarga de archivos. La preparación de imagen para Web Share se realiza antes del clic cuando es posible, evitando introducir esa captura dentro del gesto de compartir.

El calendario usa la zona horaria del dispositivo que exporta, la convierte a UTC y valida horas inexistentes por cambio horario. No hay selector de zona horaria del estadio. El texto se escapa y las líneas se pliegan por bytes UTF-8 según RFC 5545, secciones 3.1 y 3.3.11. Una hora repetida durante un cambio horario sigue la resolución del motor Date del dispositivo.

## Integración y tamaño

El manifiesto de entradas apunta al nuevo punto de arranque. El generador distingue la entrada `data`, cuyo HTML es `type="module"`, de una entrada nativa alcanzada desde un script clásico con `defer`; para esta última genera un import dinámico con aviso de fallo. El arranque espera las dependencias clásicas cuando llegan después del módulo.

El inventario offline incorpora todos los módulos nuevos y la caché del service worker pasa a v38. Se debe publicar `src/`, `compiled/` y el service worker juntos. No se recompilaron las otras pantallas JSX de esta entrega.

Todos los módulos nuevos o modificados de Compartir se comprobaron con `node --check`. Ningún módulo de su núcleo supera 300 líneas y sus componentes/punto de arranque están por debajo de 500, después de formatear; no se comprimió código para sortear el límite.

## Evidencia reproducible

```sh
# Node 22.16.0, sin instalar dependencias
node scripts/test-sharing.mjs --coverage
```

Resultado ejecutado: **31 pruebas aprobadas, cero fallos**. De ellas, tres son contratos del árbol de elementos de vistas sin estado mediante un doble de `createElement`; no son pruebas del renderizador React DOM. Los tests de arranque también usan puertos simulados.

El alcance de coverage contiene nueve módulos: dominio, aplicación e infraestructura de Compartir, más `civil-date.js`. Resultado: **615/615 líneas (100%), 224/230 ramas (97,39%) y 64/64 funciones (100%)**. Los mínimos exigidos siguen en 95/90/95. El inventario importa todo ese alcance, incluso sin assertions dedicadas, para no ocultar archivos nuevos del denominador. Los componentes, el punto de composición y otras funcionalidades quedan fuera de este porcentaje.

El comando genera `coverage/sharing/lcov.info` y `coverage/sharing/summary.json`. El resumen versionado está en `docs/validation/sharing-native.json`, junto con hashes de los módulos medidos.

Se usó Node 22.16.0 y un artefacto de Prettier 3.10.0-dev para formatear estos archivos. La consulta al registro npm falló con `EAI_AGAIN`: no se ejecutaron la instalación, el build completo con Babel fijado, ESLint ni el formatter fijado del proyecto. Tampoco React DOM, Playwright, descargas reales, el ciclo PWA o Supabase. No se extrapola este resultado a `npm run quality` ni a la cobertura total del repositorio.
