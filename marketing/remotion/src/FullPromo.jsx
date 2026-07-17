import { AbsoluteFill, Sequence, Series, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, TAGLINE } from './theme.js';

const Chip = ({ children, color = COLORS.lime }) => (
  <span style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 999, background: color, color: COLORS.ink, fontWeight: 700, fontSize: 36, margin: 6 }}>{children}</span>
);

const Scene = ({ children, bg = COLORS.paper }) => (
  <AbsoluteFill style={{ background: bg, fontFamily: FONTS.display, alignItems: 'center', justifyContent: 'center', padding: 60 }}>
    {children}
  </AbsoluteFill>
);

const SceneHook = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 15, 240, 270], [0, 1, 1, 0]);
  const scale = interpolate(frame, [0, 60], [0.95, 1]);
  return (
    <Scene bg={COLORS.ink}>
      <div style={{ opacity: o, transform: `scale(${scale})`, textAlign: 'center' }}>
        <div style={{ fontSize: 50, color: COLORS.lime, marginBottom: 20 }}>¿Otra vez peleando en el grupo</div>
        <div style={{ fontSize: 90, fontWeight: 800, color: COLORS.paper, lineHeight: 1 }}>por quién juega <span style={{ color: COLORS.red }}>de 9</span>?</div>
      </div>
    </Scene>
  );
};

const SceneReveal = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12 } });
  return (
    <Scene bg={COLORS.pitch}>
      <div style={{ transform: `scale(${s})`, textAlign: 'center' }}>
        <div style={{ fontSize: 40, letterSpacing: 8, color: COLORS.paper, opacity: 0.7 }}>TE PRESENTO</div>
        <div style={{ fontSize: 180, fontWeight: 800, color: COLORS.paper, letterSpacing: -4, lineHeight: 1 }}>
          futbol<span style={{ color: COLORS.lime }}>Club</span>
        </div>
        <div style={{ fontSize: 44, color: COLORS.paper, marginTop: 20, opacity: 0.9 }}>{TAGLINE}</div>
      </div>
    </Scene>
  );
};

const SceneModes = () => {
  const frame = useCurrentFrame();
  return (
    <Scene bg={COLORS.paper}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, color: COLORS.ink, fontWeight: 700 }}>Elegí tu modo</div>
        <div style={{ marginTop: 40, fontSize: 70 }}>
          {['Fut 5', 'Fut 6', 'Fut 7', 'Fut 8', 'Fut 11'].map((m, i) => {
            const o = interpolate(frame, [i * 15, i * 15 + 20], [0, 1], { extrapolateRight: 'clamp' });
            return <span key={m} style={{ opacity: o }}><Chip color={i % 2 ? COLORS.cyan : COLORS.lime}>{m}</Chip></span>;
          })}
        </div>
      </div>
    </Scene>
  );
};

const SceneFeatures = () => {
  const frame = useCurrentFrame();
  const rows = [
    ['🎯 Drag & drop', '🔓 Modo libre'],
    ['📷 Fotos jugador', '🎰 Sorteo balanceado'],
    ['👕 Diseñador kits', '🆚 Modo rival'],
    ['📤 Export PNG/PDF', '📅 .ics calendario'],
  ];
  return (
    <Scene bg={COLORS.ink}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 50, color: COLORS.lime, marginBottom: 30 }}>Todo lo que necesitás</div>
        {rows.map((r, i) => {
          const o = interpolate(frame, [i * 20, i * 20 + 25], [0, 1], { extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{ opacity: o, fontSize: 48, color: COLORS.paper, margin: '14px 0' }}>
              <span style={{ marginRight: 30 }}>{r[0]}</span>
              <span style={{ color: COLORS.paper, opacity: 0.3 }}>·</span>
              <span style={{ marginLeft: 30 }}>{r[1]}</span>
            </div>
          );
        })}
      </div>
    </Scene>
  );
};

const SceneShare = () => {
  const frame = useCurrentFrame();
  const items = ['WhatsApp', 'Twitter', 'Telegram', 'Instagram'];
  return (
    <Scene bg={COLORS.lime}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80, fontWeight: 800, color: COLORS.ink, letterSpacing: -2 }}>Compartilo en un toque</div>
        <div style={{ marginTop: 40 }}>
          {items.map((it, i) => {
            const s = spring({ frame: frame - i * 8, fps: 30, config: { damping: 10 } });
            return <span key={it} style={{ transform: `scale(${s})`, display: 'inline-block' }}><Chip color={COLORS.ink}><span style={{ color: COLORS.lime }}>{it}</span></Chip></span>;
          })}
        </div>
      </div>
    </Scene>
  );
};

const SceneCTA = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * 0.15) * 0.03;
  return (
    <Scene bg={COLORS.ink}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60, color: COLORS.paper }}>Abrilo en el navegador</div>
        <div style={{ fontSize: 50, color: COLORS.paper, opacity: 0.6, marginTop: 10 }}>Sin instalar. Sin login. Sin vueltas.</div>
        <div style={{ marginTop: 60, transform: `scale(${pulse})`, padding: '30px 80px', borderRadius: 999, background: COLORS.lime, color: COLORS.ink, fontSize: 60, fontWeight: 800, display: 'inline-block' }}>
          ⚽ futbolClub.html
        </div>
        <div style={{ marginTop: 40, fontSize: 36, color: COLORS.paper, opacity: 0.6, fontFamily: FONTS.mono }}>github.com/viceKDK/futLineUp</div>
      </div>
    </Scene>
  );
};

export const FullPromo = () => (
  <Series>
    <Series.Sequence durationInFrames={270}><SceneHook /></Series.Sequence>
    <Series.Sequence durationInFrames={240}><SceneReveal /></Series.Sequence>
    <Series.Sequence durationInFrames={300}><SceneModes /></Series.Sequence>
    <Series.Sequence durationInFrames={360}><SceneFeatures /></Series.Sequence>
    <Series.Sequence durationInFrames={300}><SceneShare /></Series.Sequence>
    <Series.Sequence durationInFrames={330}><SceneCTA /></Series.Sequence>
  </Series>
);
