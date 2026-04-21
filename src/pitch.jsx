// Pitch component — cancha SVG + jugadores posicionados + drag & drop + formaciones
// Soporta modo libre: posiciones arbitrarias, arrastradas con el puntero.
// props:
//   mode, formationIndex, players, kit, orientation ("up" | "down"),
//   half, interactive, style, showNames, label,
//   onSwap, onAssign, onRemove,
//   freeMode (bool) — permite mover slots a cualquier punto de la cancha,
//   positionOverrides ([x,y]|null[]) — posiciones por slot (si null, usa formación),
//   onMovePosition(idx, x, y) — callback cuando el usuario mueve un slot en modo libre.

function Pitch(props) {
  const {
    mode = 7,
    formationIndex = 0,
    players = [],
    onSwap,
    onAssign,
    onRemove,
    kit = { design: "solid", primary: "#e11d48", secondary: "#0f172a" },
    orientation = "up",
    half = false,
    interactive = true,
    style = "classic",
    showNames = true,
    label,
    freeMode = false,
    positionOverrides = null,
    onMovePosition,
  } = props;

  const formation = window.FORMATIONS[mode][formationIndex];
  const rawPositions = formation.positions;
  const positions = rawPositions.map((p, i) => (positionOverrides && positionOverrides[i]) || p);

  const [hoverIndex, setHoverIndex] = React.useState(null);
  const svgRef = React.useRef(null);

  // Pitch visuals
  const pitchPalette = {
    classic: { a: "#2e8440", b: "#2a7a3b" },
    flat:    { a: "#3a8f4a", b: "#3a8f4a" },
    dark:    { a: "#163324", b: "#12291d" },
  }[style] || { a: "#2e8440", b: "#2a7a3b" };

  const lineColor = style === "dark" ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.85)";

  const vbW = 100, vbH = half ? 80 : 150;

  const stripes = [];
  const stripeCount = 10;
  for (let i = 0; i < stripeCount; i++) {
    stripes.push(
      <rect key={i}
        x="0" y={(i * 150/stripeCount)}
        width="100" height={150/stripeCount}
        fill={i % 2 ? pitchPalette.a : pitchPalette.b} />
    );
  }

  const handleDragStart = (e, idx) => {
    if (!interactive || freeMode) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };
  const handleDragOver = (e, idx) => {
    if (!interactive) return;
    e.preventDefault();
    setHoverIndex(idx);
  };
  const handleDrop = (e, idx) => {
    if (!interactive) return;
    e.preventDefault();
    const fromData = e.dataTransfer.getData("text/plain");
    const fromRoster = e.dataTransfer.getData("application/x-roster");
    if (fromRoster) {
      onAssign && onAssign(parseInt(fromRoster, 10), idx);
    } else if (fromData !== "" && !freeMode) {
      const from = parseInt(fromData, 10);
      if (!isNaN(from) && from !== idx) onSwap && onSwap(from, idx);
    }
    setHoverIndex(null);
  };

  // Convert pitch coord (formation 0-100, own goal y=0 in "up")
  const toScreen = (x, y) => {
    let sx = x;
    let sy;
    if (orientation === "up") sy = 150 - (y/100) * 140 - 5;
    else                      sy = (y/100) * 140 + 5;
    return [sx, sy];
  };
  // Reverse: SVG y → formation y
  const fromScreenY = (svgY) => {
    if (orientation === "up") return (145 - svgY) / 1.4;
    return (svgY - 5) / 1.4;
  };

  // Pointer-based drag for free-mode position editing
  const slotPointerDown = (e, idx) => {
    if (!freeMode || !interactive || !onMovePosition) return;
    const svg = svgRef.current;
    if (!svg) return;
    e.preventDefault();
    e.stopPropagation();

    const update = (ev) => {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const loc = pt.matrixTransform(ctm.inverse());
      const fx = Math.max(4, Math.min(96, loc.x));
      const fy = Math.max(2, Math.min(98, fromScreenY(loc.y)));
      onMovePosition(idx, fx, fy);
    };
    const up = () => {
      window.removeEventListener('pointermove', update);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', update);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className={`pitch-wrap ${style} ${freeMode?'free':''}`} data-orientation={orientation}>
      {label && <div className="pitch-label">{label}</div>}
      {freeMode && <div className="pitch-free-hint">MODO LIBRE · arrastrá los círculos</div>}
      <svg ref={svgRef} className="pitch-svg" viewBox={`0 ${half ? (orientation==='up' ? 70 : 0) : 0} ${vbW} ${vbH}`}
           xmlns="http://www.w3.org/2000/svg"
           preserveAspectRatio="xMidYMid meet">
        <g>{stripes}</g>
        <rect x="0" y="0" width="100" height="150" fill="url(#pitchVignette)"/>
        <defs>
          <radialGradient id="pitchVignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="rgba(0,0,0,0)"/>
            <stop offset="100%" stopColor="rgba(0,0,0,.35)"/>
          </radialGradient>
        </defs>

        {/* Lines */}
        <g fill="none" stroke={lineColor} strokeWidth=".4">
          <rect x="3" y="3" width="94" height="144"/>
          <line x1="3" y1="75" x2="97" y2="75"/>
          <circle cx="50" cy="75" r="10"/>
          <circle cx="50" cy="75" r=".8" fill={lineColor}/>
          <rect x="22" y="3" width="56" height="18"/>
          <rect x="36" y="3" width="28" height="7"/>
          <circle cx="50" cy="14" r=".8" fill={lineColor}/>
          <path d="M 40 21 A 12 12 0 0 0 60 21" />
          <rect x="22" y="129" width="56" height="18"/>
          <rect x="36" y="140" width="28" height="7"/>
          <circle cx="50" cy="136" r=".8" fill={lineColor}/>
          <path d="M 40 129 A 12 12 0 0 1 60 129" />
          <path d="M 3 5 A 2 2 0 0 0 5 3"/>
          <path d="M 97 5 A 2 2 0 0 1 95 3"/>
          <path d="M 3 145 A 2 2 0 0 1 5 147"/>
          <path d="M 97 145 A 2 2 0 0 0 95 147"/>
        </g>

        {/* Player slots */}
        {positions.map((p, idx) => {
          const [sx, sy] = toScreen(p[0], p[1]);
          const player = players[idx];
          const isEmpty = !player;
          const isHover = hoverIndex === idx;
          return (
            <g key={idx}
               transform={`translate(${sx},${sy})`}
               className={`slot ${isEmpty?'empty':''} ${isHover?'hover':''} ${freeMode?'free':''}`}
               onDragOver={(e)=>handleDragOver(e,idx)}
               onDragLeave={()=>setHoverIndex(null)}
               onDrop={(e)=>handleDrop(e,idx)}
               onPointerDown={(e)=>slotPointerDown(e,idx)}>
              <PlayerDot
                player={player}
                kit={kit}
                interactive={interactive}
                htmlDraggable={interactive && !freeMode && !!player}
                showName={showNames}
                onDragStart={(e)=>handleDragStart(e,idx)}
                onRemove={onRemove ? () => onRemove(idx) : null}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PlayerDot({ player, kit, interactive, htmlDraggable, showName, onDragStart, onRemove }) {
  const empty = !player;
  const display = (typeof window !== 'undefined' && window.document?.body?.dataset?.playerStyle) || "photo";

  return (
    <g style={{ cursor: interactive && !empty ? "grab" : "default" }}>
      <ellipse cx="0" cy="7.6" rx="5" ry="1.1" fill="rgba(0,0,0,.35)"/>

      {empty ? (
        <g>
          <circle r="5.2" fill="rgba(0,0,0,.25)" stroke="rgba(255,255,255,.45)" strokeWidth=".4" strokeDasharray="1 1.2"/>
          <text y="1.5" textAnchor="middle" fontSize="5" fill="rgba(255,255,255,.55)" fontFamily="'Bebas Neue'">+</text>
        </g>
      ) : display === "shirt" ? (
        <g draggable={htmlDraggable} onDragStart={onDragStart}>
          <foreignObject x="-5" y="-5.5" width="10" height="11">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <MiniKit kit={kit} num={player.num}/>
            </div>
          </foreignObject>
          {showName && (
            <g transform="translate(0,8)">
              <rect x="-7" y="-1.8" width="14" height="3.6" rx="1.2" fill="rgba(0,0,0,.72)"/>
              <text y=".7" textAnchor="middle" fontSize="2.4"
                fontFamily="'Archivo Narrow', sans-serif" fontWeight="700" fill="#fff">
                {player.name.toUpperCase()}
              </text>
            </g>
          )}
        </g>
      ) : (
        <g draggable={htmlDraggable} onDragStart={onDragStart}>
          <circle r="5.2" fill={kit.primary} stroke="#fff" strokeWidth=".5"/>
          {player.photo ? (
            <>
              <defs>
                <clipPath id={`ph-${player.id}`}>
                  <circle r="4.6"/>
                </clipPath>
              </defs>
              <image href={player.photo} x="-4.6" y="-4.6" width="9.2" height="9.2"
                     preserveAspectRatio="xMidYMid slice" clipPath={`url(#ph-${player.id})`}/>
            </>
          ) : (
            <>
              <circle r="4.6" fill={window.colorFor(player.name)}/>
              <text y="1.4" textAnchor="middle" fontSize="3.6" fontWeight="700"
                fontFamily="'Archivo Narrow', sans-serif" fill="#fff">
                {window.initials(player.name)}
              </text>
            </>
          )}
          <g transform="translate(3.6,-3.6)">
            <circle r="2.2" fill="#0e1210" stroke="#fff" strokeWidth=".3"/>
            <text y="0.9" textAnchor="middle" fontSize="2.6" fontWeight="700"
              fontFamily="'Bebas Neue'" fill="#fff">{player.num}</text>
          </g>
          {showName && (
            <g transform="translate(0,8)">
              <rect x="-7" y="-1.8" width="14" height="3.6" rx="1.2" fill="rgba(0,0,0,.72)"/>
              <text y=".7" textAnchor="middle" fontSize="2.4"
                fontFamily="'Archivo Narrow', sans-serif" fontWeight="700" fill="#fff">
                {player.name.toUpperCase()}
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
}

function MiniKit({ kit, num }) {
  const id = React.useId().replace(/:/g,'');
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 105">
      <defs>
        <clipPath id={`mk-${id}`}>
          <path d="M20,10 L35,4 C40,12 60,12 65,4 L80,10 L95,22 L82,38 L78,32 L78,95 C78,97 76,99 74,99 L26,99 C24,99 22,97 22,95 L22,32 L18,38 L5,22 Z"/>
        </clipPath>
      </defs>
      <path d="M20,10 L35,4 C40,12 60,12 65,4 L80,10 L95,22 L82,38 L78,32 L78,95 C78,97 76,99 74,99 L26,99 C24,99 22,97 22,95 L22,32 L18,38 L5,22 Z"
        fill={kit.primary} stroke="rgba(0,0,0,.35)" strokeWidth="1"/>
      <g clipPath={`url(#mk-${id})`}>
        {kit.design === "stripes" && (
          [0,1,2,3,4,5].map(i => <rect key={i} x={i*18} y="0" width="9" height="105" fill={kit.secondary}/>)
        )}
        {kit.design === "sash" && (
          <polygon points="-5,40 60,-5 105,25 25,95" fill={kit.secondary}/>
        )}
        {kit.design === "halves" && (
          <rect x="50" y="0" width="55" height="105" fill={kit.secondary}/>
        )}
      </g>
      <text x="50" y="70" textAnchor="middle" fontFamily="'Bebas Neue'" fontSize="40" fill="#fff">{num}</text>
    </svg>
  );
}

window.Pitch = Pitch;
window.PlayerDot = PlayerDot;

const pitchCSS = document.createElement("style");
pitchCSS.textContent = `
  .pitch-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 100 / 150;
    background: #0e1210;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), 0 20px 40px -20px rgba(0,0,0,.6);
    touch-action: none;
  }
  .pitch-svg { width: 100%; height: 100%; display: block; }
  .pitch-label {
    position: absolute; top: 12px; left: 14px;
    font-family: "Bebas Neue","Archivo Narrow",sans-serif;
    letter-spacing: 1.6px;
    font-size: 18px;
    padding: 2px 10px;
    background: rgba(14,18,16,.78);
    color: #fff;
    border-radius: 4px;
    z-index: 2;
  }
  .pitch-free-hint {
    position: absolute; top: 12px; right: 14px;
    font-family: "Archivo Narrow", sans-serif;
    text-transform: uppercase; letter-spacing: 1.6px;
    font-size: 10px; color: #0e1210;
    background: var(--accent);
    padding: 3px 8px;
    border-radius: 4px;
    z-index: 2;
  }
  .slot { transition: transform .25s ease; }
  .slot.free { cursor: grab; }
  .slot.free:active { cursor: grabbing; }
  .slot.hover circle { stroke: oklch(0.95 0.18 124) !important; stroke-width: .9 !important; }
`;
document.head.appendChild(pitchCSS);
