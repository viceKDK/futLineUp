# TODO

## Pendiente: grabar promo 1:1 para el README

El README apunta a `screenshots/promo-1x1.gif` pero el archivo todavía no existe.

### Cómo grabarlo

1. Abrí `promo.html` en el navegador.
2. En la barra superior elegí formato **1:1** (IG Feed, 1080×1080).
3. Apretá `H` (o el botón "Modo limpio") para esconder la barra y dejar solo la animación.
4. Grabá la animación completa con alguna de estas:
   - [ScreenToGif](https://www.screentogif.com/) — Windows, exporta GIF directo.
   - [ShareX](https://getsharex.com/) — captura a GIF/MP4.
   - OBS + conversión a GIF.
5. Recortá el GIF al área 1:1 (cuadrado) y guardalo como `screenshots/promo-1x1.gif`.
6. Verificá que se vea en el README haciendo `git status` y abriendo el `.md`.

### Detalles del 1:1

- Duración del loop: **30s**.
- Resolución nativa: **1080×1080** (podés escalar hacia abajo para que el GIF pese menos — ~480×480 alcanza para el README).
- Mantené FPS bajo (12–15) para que el GIF no se vaya de tamaño.

### Otros formatos disponibles en `promo.html`

Por si querés grabarlos también:
- **16:9** — YouTube · Web (1920×1080, 35s)
- **9:16** — Stories · Reels · TikTok (1080×1920, 32s)
