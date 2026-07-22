# Futuras consideraciones a implementar

Notas de una revisión general de la app (UI y flujo). Actualizado tras implementar la mayoría de los puntos.

## ✅ Implementado

1. **Sidebar dinámica**: `src/sidebar.jsx` reemplaza el pie fijo "Martín S. · Capitán · 12 partidos" por `profile.displayName` real y la cantidad real de partidos (`matches.length`).
2. **Auditoría de colisiones CSS**: revisadas todas las clases repetidas entre `page-*.jsx`. Además de `.form-grid` y `.pool-chip` (ya corregidas antes), no se encontraron colisiones activas nuevas — `.col-empty` está duplicada en `page-draw.jsx`/`page-editor.jsx` pero con reglas idénticas, no rompe nada. El resto de nombres repetidos son selectores compuestos (`.rival-side.right`, `.editor-pitch-wrap .pitch-wrap`, etc.) o clases de sistema de diseño compartidas a propósito (`.btn`, `.card`, `.chip`, `.field`, `.panel`, `.pool-chip`, `.temp-*`).
3. **Aviso de actualización de PWA**: nuevo banner superior ("Hay una versión nueva de futbolClub · Actualizar ahora") que aparece cuando el service worker activa una versión nueva mientras la app está abierta, en vez de quedar silenciosamente desactualizada.
4. **Modo rival con plantel propio**: el lado rival ya no sale de `roster.slice(10,20)`. Ahora tiene su propio panel "Plantel rival" para cargar nombres sueltos o generar jugadores genéricos, independiente de tu plantel real. También se puede nombrar al equipo rival (antes era texto fijo "LOS VISITANTES").
5. **Liga amateur con autocompletar**: los campos "Local"/"Visitante" ahora sugieren (datalist) los equipos guardados en Home y los nombres ya usados en el fixture, para reducir errores de tipeo, sin perder la posibilidad de escribir un rival externo.
6. **Editar resultado en Home**: los partidos cargados ahora tienen botón "✎" para editarlos, no solo agregar/borrar.
7. **Sorteo → Editor**: cada columna de equipo en Sorteo tiene un botón para mandar ese equipo directo al editor de alineación (elige automáticamente el modo Fut más chico que entra). Solo funciona con jugadores del plantel real (no con "Sorteo desde 0", ver nota abajo).
8. **Sorteo → Modo rival**: cada columna de equipo también tiene un botón para mandar ese equipo como "plantel rival" al Modo rival.
9. **Ficha de jugador exportable**: en Entrenador → ficha de jugador hay un botón "Exportar ficha" que descarga la ficha completa como PNG (mismo mecanismo que usa Compartir).
10. **Recordatorio de próximo partido en Home**: si hay un partido cargado en Compartir con fecha de hoy o futura, aparece un banner en Home con fecha/hora/cancha/rival y acceso directo a Compartir.
11. **Goleadores en modo Amigos**: al registrar/editar un partido ahora se pueden cargar goleadores (jugador + cantidad de goles). Home muestra una tabla "Goleadores" con el acumulado de todos los partidos cargados.
12. **Recuperar contraseña**: en la pantalla de login hay un link "¿Olvidaste tu contraseña?" que dispara el email de recuperación de Supabase (si está configurado).
13. **Pantallas de login/registro**: ya existían de la iteración anterior (`src/page-auth.jsx`), con tabs, Google, "Continuar sin cuenta" y sin sidebar visible en esa pantalla.
14. **Copa / eliminatoria directa en Liga amateur**: nueva pestaña "Copa" con cuadro tipo mundial (4, 8 o 16 equipos), autocompletado con equipos guardados, sorteo opcional de posiciones del cuadro, carga de resultados por llave, desempate manual si empatan, y tarjeta de campeón al final. Se guarda en `league.cup`.

## Pendiente / a decidir

- **Sin modo claro**: el panel de ajustes visuales cambia acento/estilo de cancha/jugador, pero la app siempre es oscura. Se dejó afuera de esta ronda porque es una decisión de marca, no un bug — evaluar si conviene sumar un toggle claro/oscuro más adelante.
- **"Sorteo desde 0" no se puede enviar al Editor**: los jugadores generados solo para un sorteo puntual (IDs temporales `tmp...`) no existen en el plantel real, así que el editor no puede resolverlos. El botón de enviar al editor está deshabilitado con aviso en ese caso — si se quiere resolver de raíz, el editor necesitaría poder trabajar con un roster temporal también.
- **Liga amateur con equipos reales (escudo/camiseta)**: el autocompletar ya conecta los nombres, pero el fixture y la tabla siguen sin mostrar escudo/camiseta del equipo guardado — sería el siguiente paso si se quiere una integración visual completa.
- **Historial de sorteos**: guardar los últimos 3–5 sorteos hechos para poder repetir un reparto anterior sin rehacerlo.
- **Auth**: se mantiene el comportamiento de mostrar la pantalla de login/registro solo la primera vez (no en cada visita sin sesión), respetando la filosofía "modo invitado sin fricción" de la app.
