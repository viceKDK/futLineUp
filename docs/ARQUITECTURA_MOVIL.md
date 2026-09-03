# Preparación para la futura aplicación móvil

La aplicación móvil debe reutilizar el dominio y los contratos de datos de futbolClub, no copiar la lógica de cada pantalla web. La PWA actual sigue siendo el producto principal; esta guía prepara una futura implementación con React Native/Expo o Capacitor sin comprometer el despliegue web actual.

## Decisiones vigentes

- El modo invitado continúa siendo local-first y nunca requiere una cuenta.
- El backup JSON versionado es el formato portátil entre web y móvil.
- `schemaVersion` es obligatorio. Toda versión futura debe incluir migraciones puras y conservar compatibilidad hacia atrás.
- La sincronización remota debe comparar versiones antes de sobrescribir y crear una copia local antes de descargar.
- Fotos, backups y enlaces compartidos tienen límites comunes definidos por el dominio, no por una pantalla.
- Una app móvil no debe incluir `service_role`; utiliza sesión de usuario y las mismas políticas RLS.

## Capas objetivo

1. **Dominio compartido:** validación, migraciones, formaciones, cálculo de tablas, sorteos y serialización.
2. **Persistencia:** adaptadores para `localStorage` en web y almacenamiento seguro/SQLite en móvil.
3. **Sincronización:** adaptador Supabase con detección de conflictos y estado observable.
4. **Presentación:** React web y React Native consumen los mismos casos de uso.

La implementación actual ya centraliza validación, límites, backup y snapshots en `src/data.jsx`. La siguiente iteración estructural debe extraer esas funciones puras a un paquete `core` sin dependencias del DOM antes de iniciar el cliente móvil.

## Contrato mínimo de seguridad

- Máximo 5 MB por backup remoto o importado.
- Máximo 200 jugadores, 200 equipos y 50 competencias por backup.
- Máximo 60.000 caracteres por snapshot compartido.
- Imágenes JPG, PNG o WebP de hasta 8 MB y 40 megapíxeles antes del redimensionado.
- Todos los datos no confiables se representan como texto; nunca se interpolan con `innerHTML`.
- Los roles de workspace se aplican en RLS. La interfaz nunca se considera una barrera de autorización.

## Camino recomendado

1. Extraer `core` y ejecutar sus pruebas en Node y navegador.
2. Sustituir el backup monolítico por repositorios sincronizables sólo si se confirma colaboración multiusuario.
3. Prototipar navegación móvil y editor táctil con datos falsos.
4. Implementar almacenamiento offline y cola de cambios.
5. Conectar Auth/RLS y probar cambio de cuenta, pérdida de red y conflictos.
6. Publicar una beta cerrada antes de sumar notificaciones o pagos.

## Fuera de alcance actual

- No se creó un proyecto nativo ni se eligió una tienda.
- No se modificó hosting, dominio, CI de despliegue ni configuración productiva.
- Notificaciones push, compras y publicación en stores requieren decisiones de producto separadas.
