// Product profiles, coach, league and data/account settings.
const EXPERIENCE_OPTIONS = [
  {
    id: "friends",
    title: "Amigos",
    icon: "friends",
    text: "Formaciones, sorteos y compartir rápido.",
  },
  {
    id: "coach",
    title: "Entrenador",
    icon: "vest",
    text: "Plantel, entrenamientos, asistencia y evolución.",
  },
  {
    id: "league",
    title: "Liga amateur",
    icon: "trophy",
    text: "Calendario, resultados y tabla de posiciones.",
  },
];

const DEFAULT_ATTRS = { tech: 6, phys: 6, tac: 6, fin: 6, att: 6 };
const RADAR_AXES = [
  { key: "tech", label: "Técnica" },
  { key: "phys", label: "Físico" },
  { key: "tac", label: "Táctica" },
  { key: "fin", label: "Definición" },
  { key: "att", label: "Actitud" },
];

// ---- Small chart primitives (SVG, sin dependencias) ----
function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function RadarChart({ values, size = 200 }) {
  const cx = size / 2,
    cy = size / 2,
    maxR = size * 0.35;
  const n = RADAR_AXES.length;
  const ringPts = (r) =>
    RADAR_AXES.map((_, i) => polar(cx, cy, r, (i * 360) / n).join(",")).join(
      " ",
    );
  const valuePts = RADAR_AXES.map((axis, i) =>
    polar(
      cx,
      cy,
      maxR * Math.min(1, (values[axis.key] ?? 5) / 10),
      (i * 360) / n,
    ),
  );
  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`}>
      {[1, 0.7, 0.4].map((f) => (
        <polygon
          key={f}
          points={ringPts(maxR * f)}
          fill="none"
          stroke="var(--line-soft)"
        />
      ))}
      {RADAR_AXES.map((_, i) => {
        const [x, y] = polar(cx, cy, maxR, (i * 360) / n);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--line-soft)"
          />
        );
      })}
      <polygon
        points={valuePts.map((p) => p.join(",")).join(" ")}
        fill="color-mix(in oklch, var(--accent) 18%, transparent)"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {valuePts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--accent)" />
      ))}
      {RADAR_AXES.map((axis, i) => {
        const [x, y] = polar(cx, cy, maxR * 1.28, (i * 360) / n);
        return (
          <text
            key={axis.key}
            x={x}
            y={y}
            textAnchor="middle"
            fill="var(--fg-mute)"
            fontSize="10"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}

function Sparkline({
  values,
  width = 86,
  height = 24,
  color = "var(--accent)",
}) {
  if (!values.length) return <svg width={width} height={height}></svg>;
  const min = Math.min(...values),
    max = Math.max(...values);
  const span = Math.max(1, max - min);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const pts = values
    .map(
      (v, i) =>
        `${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 4) - 2).toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EvolutionChart({ points, width = 640, height = 150 }) {
  if (points.length < 2)
    return (
      <div className="empty-state sm">
        Necesitás al menos 2 evaluaciones para ver la evolución.
      </div>
    );
  const min = Math.min(...points.map((p) => p.v), 1),
    max = Math.max(...points.map((p) => p.v), 10);
  const span = Math.max(1, max - min);
  const padL = 26,
    padR = 12,
    padT = 12,
    padB = 14;
  const innerW = width - padL - padR,
    innerH = height - padT - padB;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;
  const coords = points.map((p, i) => [
    padL + i * step,
    padT + innerH - ((p.v - min) / span) * innerH,
  ]);
  const line = coords.map((c) => c.join(",")).join(" ");
  const area = `${padL},${padT + innerH} ${line} ${padL + innerW},${padT + innerH}`;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {[0, 0.33, 0.66, 1].map((f) => (
        <line
          key={f}
          x1={padL}
          y1={padT + innerH * f}
          x2={width - padR}
          y2={padT + innerH * f}
          stroke="var(--line-soft)"
        />
      ))}
      <polygon
        points={area}
        fill="color-mix(in oklch, var(--accent) 16%, transparent)"
      />
      <polyline
        points={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c, i) => (
        <circle
          key={i}
          cx={c[0]}
          cy={c[1]}
          r={i === coords.length - 1 ? 4.5 : 3.5}
          fill={i === coords.length - 1 ? "var(--accent)" : "var(--bg-elev)"}
          stroke="var(--accent)"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

function Donut({ pct, size = 60 }) {
  const r = size * 0.4,
    c = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flex: "none" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--bg-elev-2)"
        strokeWidth={size * 0.1}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={size * 0.1}
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fill="var(--fg)"
        fontFamily="var(--font-display)"
        fontSize={size * 0.26}
      >
        {pct}%
      </text>
    </svg>
  );
}
