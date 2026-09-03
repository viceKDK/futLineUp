import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, TAGLINE } from './theme.js';

const Player = ({ x, y, n, delay, frame, fps }) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 120 } });
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="32" fill={COLORS.lime} stroke={COLORS.ink} strokeWidth="3" />
      <text textAnchor="middle" dy="10" fontSize="28" fontFamily={FONTS.display} fontWeight="700" fill={COLORS.ink}>{n}</text>
    </g>
  );
};

export const HeroIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pitchProgress = spring({ frame, fps, config: { damping: 20 } });
  const titleY = interpolate(frame, [0, 30], [80, 0], { extrapolateRight: 'clamp' });
  const titleO = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const taglineO = interpolate(frame, [330, 360], [0, 1], { extrapolateRight: 'clamp' });
  const ctaO = interpolate(frame, [390, 420], [0, 1], { extrapolateRight: 'clamp' });

  const positions = [
    [600, 600, 1], [300, 500, 4], [900, 500, 2], [200, 350, 6],
    [1000, 350, 3], [600, 350, 10], [400, 200, 7], [800, 200, 11],
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.paper, fontFamily: FONTS.display }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 1200 700" style={{ width: '85%', height: '70%' }}>
          <rect x="0" y="0" width="1200" height="700" rx="24" fill={COLORS.pitch} />
          <g stroke={COLORS.paper} strokeWidth="4" fill="none" opacity={pitchProgress}>
            <rect x="30" y="30" width="1140" height="640" rx="8" />
            <line x1="600" y1="30" x2="600" y2="670" />
            <circle cx="600" cy="350" r="80" />
            <rect x="30" y="200" width="160" height="300" />
            <rect x="1010" y="200" width="160" height="300" />
          </g>
          {positions.map(([x, y, n], i) => (
            <Player key={i} x={x} y={y} n={n} delay={60 + i * 8} frame={frame} fps={fps} />
          ))}
        </svg>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 60 }}>
        <div style={{ opacity: titleO, transform: `translateY(${titleY}px)`, textAlign: 'center' }}>
          <div style={{ fontSize: 32, letterSpacing: 6, color: COLORS.ink, opacity: 0.6 }}>FUTBOLCLUB</div>
          <div style={{ fontSize: 96, fontWeight: 800, color: COLORS.ink, marginTop: 8, letterSpacing: -2 }}>
            Armá la <span style={{ color: COLORS.red }}>11</span>.
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 100 }}>
        <div style={{ opacity: taglineO, fontSize: 42, color: COLORS.ink }}>{TAGLINE}</div>
        <div style={{ opacity: ctaO, marginTop: 20, padding: '14px 40px', borderRadius: 999, background: COLORS.ink, color: COLORS.lime, fontSize: 32, fontWeight: 700 }}>
          → futbolClub.html
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
