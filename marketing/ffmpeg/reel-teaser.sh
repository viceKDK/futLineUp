#!/usr/bin/env bash
# reel-teaser.sh — 6s vertical (1080x1920) teaser desde 2 screenshots
# Output: out/reel-teaser.mp4
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p out
SCREENS="../../screenshots"
W=1080; H=1920; FPS=30

# 2 frames clave: home (0–3s) → editor (3–6s), con zoom progresivo
# drawtext con texto editorial superpuesto

ffmpeg -y \
  -loop 1 -t 3 -i "$SCREENS/01-home.png" \
  -loop 1 -t 3 -i "$SCREENS/03-editor.png" \
  -filter_complex "
    [0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},
         zoompan=z='min(zoom+0.0015,1.15)':d=${FPS}*3:s=${W}x${H}:fps=${FPS},
         drawbox=y=ih*0.78:color=black@0.55:width=iw:height=ih*0.22:t=fill,
         drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:
                  text='¿QUIÉN VA DE 9?':fontcolor=#c6ff3d:fontsize=78:
                  x=(w-text_w)/2:y=h*0.82:
                  enable='between(t,0.3,3)'
    [s0];
    [1:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},
         zoompan=z='min(zoom+0.002,1.2)':d=${FPS}*3:s=${W}x${H}:fps=${FPS},
         drawbox=y=ih*0.78:color=black@0.55:width=iw:height=ih*0.22:t=fill,
         drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:
                  text='ARMÁ LA 11':fontcolor=#f4f3ec:fontsize=92:
                  x=(w-text_w)/2:y=h*0.81:
                  enable='between(t,0.2,3)',
         drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:
                  text='futbolClub.html':fontcolor=#c6ff3d:fontsize=44:
                  x=(w-text_w)/2:y=h*0.91:
                  enable='between(t,1.2,3)'
    [s1];
    [s0][s1]concat=n=2:v=1:a=0,format=yuv420p[v]
  " \
  -map "[v]" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart \
  -r ${FPS} out/reel-teaser.mp4

echo "✓ out/reel-teaser.mp4 ($(du -h out/reel-teaser.mp4 | cut -f1))"
