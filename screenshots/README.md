# Capturas de futbolClub

Capturas generadas automáticamente con Playwright desde la rama `develop`. Todas las pantallas principales y los estados especiales relevantes quedan cubiertos por `tests/screenshots.spec.js`.

| # | Archivo | Pantalla o estado |
|---|---|---|
| 01 | [`01-home.png`](01-home.png) | Mis equipos y resumen general |
| 02 | [`02-mode.png`](02-mode.png) | Creación de equipo y selector Fut 5/6/7/8/11 |
| 03 | [`03-editor.png`](03-editor.png) | Editor de alineación vacío |
| 03b | [`03b-editor-autocompletado.png`](03b-editor-autocompletado.png) | Editor autocompletado |
| 04 | [`04-draw.png`](04-draw.png) | Sorteo inicial |
| 04b | [`04b-draw-sorteado.png`](04b-draw-sorteado.png) | Equipos sorteados y balanceados |
| 05 | [`05-kits.png`](05-kits.png) | Diseñador de camisetas |
| 06 | [`06-rival.png`](06-rival.png) | Modo rival |
| 07 | [`07-share.png`](07-share.png) | Compartir y exportar |
| 08 | [`08-tweaks.png`](08-tweaks.png) | Ajustes visuales |
| 09 | [`09-coach.png`](09-coach.png) | Entrenador: fichas, evaluaciones y asistencia |
| 10 | [`10-league.png`](10-league.png) | Liga amateur: calendario, resultados y tabla |
| 11 | [`11-settings.png`](11-settings.png) | Perfil, Google/Supabase, backup e importación |

## Nuevos módulos

### Entrenador

![Modo Entrenador](09-coach.png)

### Liga amateur

![Modo Liga](10-league.png)

### Cuenta y datos

![Cuenta y datos](11-settings.png)

## Regeneración

```powershell
npm.cmd run screenshots
```

La configuración de Playwright usa el canal de Chrome instalado en el sistema. El test también regenera los estados `03b`, `04b` y `08`, evitando que queden capturas antiguas mezcladas con las nuevas.