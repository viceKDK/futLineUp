# Observabilidad, disponibilidad y backups

## Errores, logs y rendimiento real

La aplicación registra en `sessionStorage` los últimos 100 eventos: errores globales,
promesas rechazadas, inicio correcto, cambios online/offline, latidos de disponibilidad
y Web Vitals. Cada evento lleva release, commit, ruta y sesión; claves sensibles como
tokens, contraseñas, cookies y correos se censuran.

En **Cuenta y datos → Backup local** se puede descargar un diagnóstico JSON. Para
enviar eventos a un colector propio, copiar `src/local-config.example.js` como
`src/local-config.js` y definir `window.OBSERVABILITY_CONFIG.endpoint`. Solo se
aceptan destinos del mismo origen o `*.supabase.co`; el receptor debe aceptar JSON
por `POST`. No almacenar datos personales en mensajes de log.

Medición local reproducible:

```powershell
npm run perf:vitals
```

La prueba imprime `WEB_VITALS` con LCP, CLS e INP obtenidos por las Performance APIs
del navegador real. La telemetría de usuarios se obtiene mediante la distribución
con atribución de `web-vitals`.

## Disponibilidad

El workflow `.github/workflows/availability.yml` comprueba la aplicación cada 15
minutos, con tres intentos, timeout, estado HTTP, TTFB, tiempo total y contenido
esperado. Configurar la variable de repositorio `FUTBOLCLUB_URL` con la URL pública.
Si no está definida, el job se omite. También se puede ejecutar sin desplegar:

```powershell
$env:FC_MONITOR_URL="https://ejemplo.com/futbolClub.html"
npm run monitor:availability
```

## Backups y restauración

IndexedDB conserva automáticamente hasta siete copias rotativas. Se intenta crear
una al iniciar y después de cambios, con un intervalo mínimo de seis horas. Antes
de restaurar una copia se crea otra con motivo `before-restore`.

Prueba real de recuperación:

```powershell
npm run test:backups
```

La prueba guarda un perfil, crea una copia en IndexedDB, altera el perfil, restaura
la copia y verifica tanto los datos recuperados como la copia preventiva. Estas
copias pertenecen al dispositivo; para cubrir pérdida física hay que conservar
además una exportación JSON o la sincronización de cuenta.
