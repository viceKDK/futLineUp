# marketing/ — videos promocionales de futbolClub

11 videos de marketing en 5 tecnologías distintas, con duraciones variadas (6s a 60s) y formatos 16:9, 9:16 y 1:1.

## Catálogo

| # | Tech                       | Archivo                                            | Duración | Formato | Uso sugerido           |
|---|----------------------------|----------------------------------------------------|----------|---------|------------------------|
| 1 | Remotion                   | `remotion/src/HeroIntro.jsx`                       | 15s      | 16:9    | Web hero, YouTube pre-roll |
| 2 | Remotion                   | `remotion/src/FeatureShowcase.jsx`                 | 30s      | 9:16    | Reels / TikTok / Stories |
| 3 | Remotion                   | `remotion/src/FullPromo.jsx`                       | 60s      | 1:1     | IG Feed, post pinned   |
| 4 | FFmpeg                     | `ffmpeg/reel-teaser.sh`                            | 6s       | 9:16    | Teaser ultra-corto     |
| 5 | FFmpeg                     | `ffmpeg/slideshow-screens.sh`                      | 20s      | 16:9    | Demo de pantallas      |
| 6 | Motion Canvas              | `motion-canvas/src/scenes/logo-intro.tsx`          | 10s      | 16:9    | Bumper / intro         |
| 7 | Motion Canvas              | `motion-canvas/src/scenes/feature-flow.tsx`        | 45s      | 16:9    | Demo larga LinkedIn    |
| 8 | Canvas API + MediaRecorder | `canvas-api/loop-anim.html`                        | 8s loop  | 1:1     | GIF/MP4 loopable web   |
| 9 | Canvas API + MediaRecorder | `canvas-api/formation-draw.html`                   | 30s      | 16:9    | Tutorial táctico       |
| 10| Manim                      | `manim/math_of_formations.py`                      | 15s      | 16:9    | Twitter / X            |
| 11| Manim                      | `manim/tactic_board.py`                            | 25s      | 16:9    | Educativo táctico      |

## Cómo renderizar cada una

### Remotion (videos 1–3)
```bash
cd marketing/remotion
npm install
npx remotion render src/index.jsx HeroIntro out/hero-intro.mp4
npx remotion render src/index.jsx FeatureShowcase out/feature-showcase.mp4
npx remotion render src/index.jsx FullPromo out/full-promo.mp4
```

### FFmpeg (videos 4–5)
```bash
cd marketing/ffmpeg
bash reel-teaser.sh           # → out/reel-teaser.mp4 (9:16, 6s)
bash slideshow-screens.sh     # → out/slideshow.mp4   (16:9, 20s)
```

### Motion Canvas (videos 6–7)
```bash
cd marketing/motion-canvas
npm install
npm run render -- --scenes=logo-intro     # → output/logo-intro.mp4
npm run render -- --scenes=feature-flow   # → output/feature-flow.mp4
```

### Canvas API + MediaRecorder (videos 8–9)
Son HTML standalone. Abrilos en Chrome, presioná **Grabar** y descargá el `.webm`. Luego (opcional) convertí a MP4 con ffmpeg:
```bash
ffmpeg -i loop-anim.webm -c:v libx264 -pix_fmt yuv420p loop-anim.mp4
```

### Manim (videos 10–11)
```bash
cd marketing/manim
pip install manim
manim -qh math_of_formations.py MathOfFormations   # → media/videos/.../MathOfFormations.mp4
manim -qh tactic_board.py TacticBoard
```

## Paleta y branding compartido

- **Verde cancha**: `#0e7a3e`
- **Lima acento**: `#c6ff3d`
- **Cyan acento**: `#33d6e6`
- **Rojo acento**: `#ff3d4e`
- **Tinta**: `#0c1410`
- **Papel**: `#f4f3ec`
- **Fuente display**: `"Space Grotesk"` / fallback `system-ui`
- **Fuente mono**: `"JetBrains Mono"`

Tagline recurrente: **"Armá tu equipo. Compartí la formación."**
