#!/usr/bin/env bash
# slideshow-screens.sh — 20s horizontal (1920x1080) slideshow de las 8 pantallas
# Output: out/slideshow.mp4
set -euo pipefail

cd "$(dirname "$0")"
mkdir -p out
SCREENS="../../screenshots"
W=1920; H=1080; FPS=30
PER=2.5  # segundos por slide × 8 slides = 20s

# Resolve fonts. Override via FONT_BOLD / FONT_REGULAR env vars.
find_font() {
  local name="$1"; shift
  for p in "$@"; do [ -f "$p" ] && { echo "$p"; return; }; done
  command -v fc-match >/dev/null 2>&1 && fc-match -f '%{file}' "$name" 2>/dev/null || true
}
FONT_BOLD="${FONT_BOLD:-$(find_font 'DejaVu Sans:bold' \
  /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf \
  /usr/share/fonts/TTF/DejaVuSans-Bold.ttf \
  /Library/Fonts/Arial\ Bold.ttf \
  /System/Library/Fonts/Supplemental/Arial\ Bold.ttf \
  /c/Windows/Fonts/arialbd.ttf)}"
[ -z "${FONT_BOLD}" ] && { echo "✗ No bold font found. Set FONT_BOLD=/path/to/font.ttf" >&2; exit 1; }
FONT_REGULAR="${FONT_REGULAR:-$(find_font 'DejaVu Sans' \
  /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf \
  /usr/share/fonts/TTF/DejaVuSans.ttf \
  /Library/Fonts/Arial.ttf \
  /System/Library/Fonts/Supplemental/Arial.ttf \
  /c/Windows/Fonts/arial.ttf)}"
[ -z "${FONT_REGULAR}" ] && FONT_REGULAR="${FONT_BOLD}"

slides=(
  "01-home.png|MIS EQUIPOS"
  "02-mode.png|ELEGÍ MODO"
  "03-editor.png|EDITOR DE ALINEACIÓN"
  "04-draw.png|SORTEO"
  "05-kits.png|CAMISETAS"
  "06-rival.png|MODO RIVAL"
  "07-share.png|COMPARTIR"
  "08-tweaks.png|TUS AJUSTES"
)

inputs=""
filters=""
labels=""
i=0
for s in "${slides[@]}"; do
  IFS='|' read -r file label <<< "$s"
  inputs+=" -loop 1 -t ${PER} -i $SCREENS/$file"
  filters+="[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,
            pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=#0c1410,
            zoompan=z='min(zoom+0.0015,1.08)':d=${FPS}*${PER}:s=${W}x${H}:fps=${FPS},
            drawbox=y=ih*0.86:color=#0c1410@0.75:width=iw:height=ih*0.14:t=fill,
            drawtext=fontfile=${FONT_BOLD}:
                     text='${label}':fontcolor=#c6ff3d:fontsize=54:
                     x=80:y=h*0.89,
            drawtext=fontfile=${FONT_REGULAR}:
                     text='futbolClub · 0$((i+1))/08':fontcolor=#f4f3ec:fontsize=28:
                     x=w-text_w-80:y=h*0.91
            [v${i}];"
  labels+="[v${i}]"
  i=$((i+1))
done

# Crossfade chained between slides
filters+="${labels}concat=n=${i}:v=1:a=0,fade=t=in:st=0:d=0.4,fade=t=out:st=$(echo "${i}*${PER}-0.5" | bc):d=0.5,format=yuv420p[out]"

ffmpeg -y ${inputs} -filter_complex "${filters}" \
  -map "[out]" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart \
  -r ${FPS} out/slideshow.mp4

echo "✓ out/slideshow.mp4 ($(du -h out/slideshow.mp4 | cut -f1))"
