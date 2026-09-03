import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, TAGLINE } from './theme.js';

const features = [
  { emoji: '⚽', title: 'Editor', desc: 'Drag & drop, modo libre, 5 modos de juego.' },
  { emoji: '🎲', title: 'Sorteo', desc: '2/3/4 equipos. Lockeos. Balanceado.' },
  { emoji: '👕', title: 'Camisetas', desc: '4 diseños · 8 presets · color picker.' },
  { emoji: '🆚', title: 'Rival', desc: 'Cancha completa, previa de TV.' },
  { emoji: '📤', title: 'Compartir', desc: 'PNG · PDF · ICS · WhatsApp.' },
];

const FeatureCard = ({ f, frame, fps, startFrame }) => {
  const local = frame - startFrame;
  const s = spring({ frame: local, fps, config: { damping: 14 } });
  const exit = interpolate(local, [150, 180], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const o = Math.min(s, exit);
  return (
    <div style={{ opacity: o, transform: `scale(${0.9 + s * 0.1})`, textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 280, lineHeight: 1 }}>{f.emoji}</div>
      <div style={{ fontSize: 120, fontWeight: 800, color: COLORS.paper, marginTop: 30, letterSpacing: -2 }}>{f.title}</div>
      <div style={{ fontSize: 50, color: COLORS.lime, marginTop: 20, maxWidth: 900, marginInline: 'auto', lineHeight: 1.25 }}>{f.desc}</div>
    </div>
  );
};

const ProgressBar = ({ frame, total }) => {
  const p = interpolate(frame, [0, total], [0, 1]);
  return (
    <div style={{ position: 'absolute', top: 60, left: 60, right: 60, height: 8, background: '#ffffff22', borderRadius: 4 }}>
      <div style={{ width: `${p * 100}%`, height: '100%', background: COLORS.lime, borderRadius: 4 }} />
    </div>
  );
};

export const FeatureShowcase = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${COLORS.ink} 0%, ${COLORS.pitchDark} 100%)`, fontFamily: FONTS.display }}>
      <ProgressBar frame={frame} total={durationInFrames} />

      {features.map((f, i) => (
        <Sequence key={i} from={i * 150} durationInFrames={180}>
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
            <FeatureCard f={f} frame={frame} fps={fps} startFrame={i * 150} />
          </AbsoluteFill>
        </Sequence>
      ))}

      <Sequence from={750} durationInFrames={150}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 80 }}>
          <div style={{ fontSize: 90, fontWeight: 800, color: COLORS.paper, letterSpacing: -2 }}>futbol<span style={{ color: COLORS.lime }}>Club</span></div>
          <div style={{ fontSize: 48, color: COLORS.paper, marginTop: 20, opacity: 0.8 }}>{TAGLINE}</div>
          <div style={{ marginTop: 60, padding: '24px 60px', borderRadius: 999, background: COLORS.lime, color: COLORS.ink, fontSize: 48, fontWeight: 800 }}>
            github.com/viceKDK/futLineUp
          </div>
        </AbsoluteFill>
      </Sequence>

      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0, textAlign: 'center', color: COLORS.paper, opacity: 0.5, fontSize: 30, fontFamily: FONTS.mono }}>
        100% client-side · sin build · MIT
      </div>
    </AbsoluteFill>
  );
};
