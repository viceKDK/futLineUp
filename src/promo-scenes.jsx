// Promo scenes for futbolClub — adaptive layouts (16:9 / 9:16 / 1:1)
// Each scene branches on isLandscape vs narrow (portrait + square).

// ---- Roster (ordered: arquero first, defense, mid, forwards) ----
const PROMO_NAMES = [
  ["Nahuel","NAH",1],   ["Pato","PAT",2],    ["Agus","AGU",3],
  ["Facu","FAC",4],     ["Rama","RAM",6],    ["Tomi","TOM",5],
  ["Lucho","LUC",8],    ["Juampi","JPI",9],  ["Seba","SEB",7],
  ["Martín","MAR",10],  ["Dieguito","DIE",11],
];

const promoColorFor = (seed) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `oklch(0.58 0.14 ${h % 360})`;
};

const display = (extra = {}) => ({
  fontFamily: "'Bebas Neue', 'Archivo Narrow', sans-serif",
  textTransform: 'uppercase',
  fontWeight: 400,
  ...extra,
});
const cond = (extra = {}) => ({
  fontFamily: "'Archivo Narrow', sans-serif",
  ...extra,
});

// ---- Cancha SVG ----
function PromoPitch({ progressDraw = 1, opacity = 1, style = {}, vignette = true }) {
  return (
    <svg viewBox="0 0 100 150" style={{ width: '100%', height: '100%', display: 'block', opacity, ...style }}>
      <defs>
        <pattern id="grass" patternUnits="userSpaceOnUse" width="100" height="15">
          <rect x="0" y="0"   width="100" height="7.5" fill="#2e7d3a"/>
          <rect x="0" y="7.5" width="100" height="7.5" fill="#286f33"/>
        </pattern>
        <radialGradient id="vg" cx="50%" cy="50%" r="70%">
          <stop offset="55%" stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,.55)"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100" height="150" fill="url(#grass)"/>
      {vignette && <rect x="0" y="0" width="100" height="150" fill="url(#vg)"/>}
      <g fill="none" stroke="rgba(255,255,255,.9)" strokeWidth=".35"
         style={{
           strokeDasharray: 600,
           strokeDashoffset: 600 * (1 - progressDraw),
         }}>
        <rect x="3" y="3" width="94" height="144"/>
        <line x1="3" y1="75" x2="97" y2="75"/>
        <circle cx="50" cy="75" r="10"/>
        <rect x="22" y="3" width="56" height="18"/>
        <rect x="36" y="3" width="28" height="7"/>
        <path d="M 40 21 A 12 12 0 0 0 60 21"/>
        <rect x="22" y="129" width="56" height="18"/>
        <rect x="36" y="140" width="28" height="7"/>
        <path d="M 40 129 A 12 12 0 0 1 60 129"/>
      </g>
      <circle cx="50" cy="75" r=".7" fill="rgba(255,255,255,.9)" opacity={progressDraw}/>
      <circle cx="50" cy="14" r=".7" fill="rgba(255,255,255,.9)" opacity={progressDraw}/>
      <circle cx="50" cy="136" r=".7" fill="rgba(255,255,255,.9)" opacity={progressDraw}/>
    </svg>
  );
}

function PromoDot({ x, y, name, num, scale = 1, opacity = 1, kitColor = '#e11d48' }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity} style={{transition:'transform .5s cubic-bezier(.65,0,.35,1)'}}>
      <ellipse cx="0" cy="6.5" rx="4.2" ry=".9" fill="rgba(0,0,0,.35)"/>
      <circle r="4.5" fill={kitColor} stroke="#fff" strokeWidth=".4"/>
      <circle r="3.9" fill={promoColorFor(name)}/>
      <text y="1.2" textAnchor="middle" fontSize="3.2" fontWeight="700"
        fontFamily="'Archivo Narrow', sans-serif" fill="#fff">
        {name.substring(0,2).toUpperCase()}
      </text>
      <g transform="translate(3,-3)">
        <circle r="1.7" fill="#0e1210" stroke="#fff" strokeWidth=".25"/>
        <text y=".7" textAnchor="middle" fontSize="2.2" fontWeight="700"
          fontFamily="'Bebas Neue', 'Archivo Narrow', sans-serif" fill="#fff">{num}</text>
      </g>
      <g transform="translate(0,7.5)">
        <rect x="-6" y="-1.6" width="12" height="3.2" rx="1" fill="rgba(0,0,0,.78)"/>
        <text y=".6" textAnchor="middle" fontSize="2.1"
          fontFamily="'Archivo Narrow', sans-serif" fontWeight="700" fill="#fff">
          {name.toUpperCase()}
        </text>
      </g>
    </g>
  );
}

// Shared kicker label
const Kicker = ({ children, color = '#cefa3e', mb = 14 }) => (
  <div style={cond({
    fontSize: 16, letterSpacing: '4px', color,
    textTransform: 'uppercase', marginBottom: mb, fontWeight: 700,
  })}>{children}</div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 1 — INTRO
// ─────────────────────────────────────────────────────────────────────────────
function SceneIntro() {
  const { localTime } = useSprite();
  const { isLandscape } = useFormat();

  const futOpacity = clamp((localTime - 0.3) / 0.6, 0, 1);
  const futY = (1 - Easing.easeOutCubic(futOpacity)) * 40;
  const clubOpacity = clamp((localTime - 1.0) / 0.5, 0, 1);
  const clubX = (1 - Easing.easeOutBack(clubOpacity)) * (isLandscape ? -60 : 0);
  const clubY = (1 - Easing.easeOutBack(clubOpacity)) * (isLandscape ? 0 : -40);
  const kicker = clamp((localTime - 1.7) / 0.8, 0, 1);
  const exitFade = localTime > 2.4 ? clamp((localTime - 2.4) / 0.6, 0, 1) : 0;
  const lineProgress = clamp((localTime - 0.5) / 1.2, 0, 1);

  const fs = isLandscape ? 280 : 200;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 50% 50%, #131815 0%, #050605 80%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: 1 - exitFade,
    }}>
      <div style={{
        width: isLandscape ? 600 : 480, height: 1, background: '#cefa3e',
        marginBottom: 60, opacity: lineProgress,
        transform: `scaleX(${lineProgress})`, transformOrigin: 'center',
      }}/>

      <div style={{
        display: 'flex',
        flexDirection: isLandscape ? 'row' : 'column',
        alignItems: isLandscape ? 'baseline' : 'center',
        gap: isLandscape ? 30 : 0,
      }}>
        <div style={display({
          fontSize: fs, letterSpacing: '8px', lineHeight: 1,
          color: '#f5f2e8', opacity: futOpacity,
          transform: `translateY(${futY}px)`,
        })}>FÚTBOL</div>
        <div style={display({
          fontSize: fs, letterSpacing: '8px', lineHeight: 1,
          color: '#cefa3e', opacity: clubOpacity,
          transform: `translate(${clubX}px, ${clubY}px)`,
        })}>CLUB</div>
      </div>

      <div style={cond({
        marginTop: 50,
        fontSize: 22, letterSpacing: '10px',
        color: 'rgba(245,242,232,.7)',
        textTransform: 'uppercase',
        opacity: kicker,
        fontWeight: 500,
        textAlign: 'center',
      })}>
        tu equipo · tu cancha · tu fútbol
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 2 — CANCHA REVEAL + MODE
// ─────────────────────────────────────────────────────────────────────────────
function ScenePitchReveal() {
  const { localTime, duration } = useSprite();
  const { isLandscape, isSquare } = useFormat();

  const fadeIn = clamp(localTime / 0.6, 0, 1);
  const draw = clamp((localTime - 0.5) / 2.3, 0, 1);
  const drawEased = Easing.easeInOutCubic(draw);
  const captionIn = clamp((localTime - 1.3) / 0.8, 0, 1);
  const exit = localTime > duration - 0.6 ? clamp((localTime - (duration - 0.6)) / 0.6, 0, 1) : 0;

  // Mode cycle — slow, hold on "11" for the rest of the scene
  const modes = [5, 6, 7, 8, 11];
  const cycleStart = 2.0;
  const modeStep = 0.6;
  const idx = Math.min(modes.length - 1, Math.floor((localTime - cycleStart) / modeStep));
  const current = modes[Math.max(0, idx)];
  const localCycleT = Math.max(0, ((localTime - cycleStart) % modeStep) / modeStep);
  const modePop = 1 + (1 - Easing.easeOutCubic(clamp(localCycleT * 4, 0, 1))) * 0.06;

  if (isLandscape) {
    return (
      <div style={{position:'absolute', inset:0, background:'#050605', opacity: 1 - exit,
        display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div style={{
          width: 640, height: 960,
          transform: `scale(${0.92 + 0.08 * fadeIn})`,
          opacity: fadeIn, position: 'relative',
        }}>
          <PromoPitch progressDraw={drawEased}/>
        </div>
        <div style={{position:'absolute', left:120, top:220, width:540,
          opacity:captionIn, transform:`translateY(${(1-captionIn)*20}px)`}}>
          <Kicker mb={18}>01 / CANCHA</Kicker>
          <div style={display({fontSize:130, letterSpacing:'4px', lineHeight:.88, color:'#f5f2e8'})}>
            ELEGÍ<br/>TU MODO<br/>DE CANCHA
          </div>
          <div style={cond({marginTop:36, fontSize:18, color:'rgba(245,242,232,.55)', letterSpacing:'2px', textTransform:'uppercase', fontWeight:500})}>
            FUT 5 · 6 · 7 · 8 · 11
          </div>
        </div>
        <div style={{position:'absolute', right:140, top:'50%', transform:'translateY(-50%)', opacity:captionIn, textAlign:'right'}}>
          <div style={cond({fontSize:18, letterSpacing:'4px', color:'rgba(245,242,232,.5)', textTransform:'uppercase', marginBottom:8, fontWeight:700})}>JUGADORES</div>
          <div style={display({fontSize:380, lineHeight:.82, color:'#cefa3e', letterSpacing:'4px', transform:`scale(${modePop})`, transformOrigin:'center', transition:'transform .15s'})}>{current}</div>
          <div style={display({fontSize:64, lineHeight:1, color:'rgba(245,242,232,.4)', letterSpacing:'4px'})}>V{current}</div>
        </div>
      </div>
    );
  }

  // Narrow (9:16 / 1:1): pitch as background w/ huge "5/6/7/8/11" overlay
  return (
    <div style={{position:'absolute', inset:0, background:'#050605', opacity:1-exit,
      display:'flex', flexDirection:'column', alignItems:'center'}}>
      {/* Caption top */}
      <div style={{paddingTop: isSquare ? 80 : 130, textAlign:'center',
        opacity:captionIn, transform:`translateY(${(1-captionIn)*-12}px)`}}>
        <Kicker mb={isSquare ? 28 : 12}>01 / CANCHA</Kicker>
        <div style={display({fontSize: isSquare ? 90 : 120, letterSpacing:'4px', lineHeight:.88, color:'#f5f2e8'})}>
          ELEGÍ TU<br/>MODO
        </div>
      </div>

      {/* Centered pitch w/ big number overlay */}
      <div style={{position:'relative', flex:1, display:'flex', alignItems:'center', justifyContent:'center', width:'100%'}}>
        <div style={{
          width: isSquare ? 380 : 540, height: isSquare ? 570 : 810,
          transform:`scale(${0.92 + 0.08 * fadeIn})`,
          opacity: fadeIn * 0.55,
        }}>
          <PromoPitch progressDraw={drawEased}/>
        </div>
        {/* Huge mode number over pitch */}
        <div style={{position:'absolute', textAlign:'center', opacity:captionIn}}>
          <div style={cond({fontSize:18, letterSpacing:'4px', color:'rgba(245,242,232,.6)', textTransform:'uppercase', marginBottom:8, fontWeight:700})}>JUGADORES POR LADO</div>
          <div style={display({fontSize: isSquare ? 380 : 540, lineHeight:.82, color:'#cefa3e', letterSpacing:'8px', transform:`scale(${modePop})`, transformOrigin:'center', transition:'transform .15s'})}>{current}</div>
          <div style={display({fontSize: isSquare ? 60 : 90, lineHeight:1, color:'rgba(245,242,232,.6)', letterSpacing:'6px'})}>V{current}</div>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{paddingBottom: isSquare ? 80 : 140, opacity:captionIn,
        textAlign:'center', width:'100%'}}>
        <div style={cond({fontSize:20, letterSpacing:'6px', color:'rgba(245,242,232,.6)', textTransform:'uppercase', fontWeight:600})}>
          FUT 5 · 6 · 7 · 8 · 11
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 — FORMATION FILL
// ─────────────────────────────────────────────────────────────────────────────
const FORMATION_442 = [
  [50,6], [14,22],[38,22],[62,22],[86,22],
  [14,48],[38,48],[62,48],[86,48], [38,74],[62,74]
];
const FORMATION_433 = [
  [50,6], [14,22],[38,22],[62,22],[86,22],
  [28,46],[50,46],[72,46], [20,74],[50,72],[80,74]
];

function FormationOnPitch({ positions, players, localTime, appearStart, stagger, kitColor='#3b82f6' }) {
  return (
    <svg viewBox="0 0 100 150" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
      {positions.map((pos, i) => {
        const appearAt = appearStart + i * stagger;
        const t = clamp((localTime - appearAt) / 0.5, 0, 1);
        const e = Easing.easeOutBack(t);
        const player = players[i];
        if (!player) return null;
        return <PromoDot key={i} x={pos[0]} y={pos[1]} name={player[0]} num={player[2]} scale={e} opacity={t} kitColor={kitColor}/>;
      })}
    </svg>
  );
}

function SceneFormationFill() {
  const { localTime, duration } = useSprite();
  const { isLandscape, isSquare } = useFormat();
  const exit = localTime > duration - 0.6 ? clamp((localTime - (duration - 0.6)) / 0.6, 0, 1) : 0;
  const captionIn = clamp(localTime / 0.5, 0, 1);
  const appearStart = 0.4;
  const stagger = 0.25;

  if (isLandscape) {
    return (
      <div style={{position:'absolute', inset:0, background:'#050605', opacity: 1-exit}}>
        <div style={{position:'absolute', left:100, top:180, width:650, opacity:captionIn}}>
          <Kicker mb={18}>02 / ALINEACIÓN</Kicker>
          <div style={display({fontSize:130, letterSpacing:'4px', lineHeight:.88, color:'#f5f2e8'})}>
            ARMÁ<br/>EL EQUIPO
          </div>
          <div style={cond({marginTop:32, fontSize:18, color:'rgba(245,242,232,.55)', maxWidth:460, lineHeight:1.5, fontWeight:500})}>
            Arrastrá los pibes a la cancha. Elegí formación predefinida o moveté libre.
          </div>
          <div style={{marginTop:44, display:'flex', gap:14, alignItems:'center'}}>
            <div style={cond({padding:'8px 18px', border:'1px solid #cefa3e', color:'#cefa3e',
              fontSize:16, letterSpacing:'3px', textTransform:'uppercase', fontWeight:700})}>4-4-2</div>
            <span style={{color:'rgba(245,242,232,.3)'}}>·</span>
            <div style={{color:'rgba(245,242,232,.45)', fontSize:14, fontFamily:'monospace'}}>11/11 JUGADORES</div>
          </div>
        </div>
        <div style={{position:'absolute', right:120, top:80, width:580, height:870}}>
          <PromoPitch progressDraw={1}/>
          <FormationOnPitch positions={FORMATION_442} players={PROMO_NAMES} localTime={localTime} appearStart={appearStart} stagger={stagger}/>
        </div>
      </div>
    );
  }

  // Narrow
  return (
    <div style={{position:'absolute', inset:0, background:'#050605', opacity:1-exit,
      display:'flex', flexDirection:'column', alignItems:'center'}}>
      <div style={{paddingTop: isSquare ? 130 : 200, textAlign:'center', opacity:captionIn, width:'100%'}}>
        <Kicker mb={isSquare ? 28 : 12}>02 / ALINEACIÓN</Kicker>
        <div style={display({fontSize: isSquare ? 80 : 120, letterSpacing:'4px', lineHeight:.88, color:'#f5f2e8'})}>
          ARMÁ EL EQUIPO
        </div>
      </div>
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', width:'100%', padding:'20px 0'}}>
        <div style={{width: isSquare ? 420 : 600, height: isSquare ? 630 : 900, position:'relative'}}>
          <PromoPitch progressDraw={1}/>
          <FormationOnPitch positions={FORMATION_442} players={PROMO_NAMES} localTime={localTime} appearStart={appearStart} stagger={stagger}/>
        </div>
      </div>
      <div style={{paddingBottom: isSquare ? 70 : 130, opacity:captionIn, textAlign:'center'}}>
        <div style={{display:'inline-flex', gap:14, alignItems:'center'}}>
          <div style={cond({padding:'8px 18px', border:'1px solid #cefa3e', color:'#cefa3e',
            fontSize:16, letterSpacing:'3px', textTransform:'uppercase', fontWeight:700})}>FORMACIÓN 4-4-2</div>
          <div style={{color:'rgba(245,242,232,.45)', fontSize:14, fontFamily:'monospace'}}>11/11</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 4 — FORMATION CHANGE
// ─────────────────────────────────────────────────────────────────────────────
function SceneFormationChange() {
  const { localTime, duration } = useSprite();
  const { isLandscape, isSquare } = useFormat();
  const enter = clamp(localTime / 0.4, 0, 1);
  const exit = localTime > duration - 0.6 ? clamp((localTime - (duration - 0.6)) / 0.6, 0, 1) : 0;
  const morphStart = 1.0, morphEnd = 2.8;
  const morphT = Easing.easeInOutCubic(clamp((localTime - morphStart) / (morphEnd - morphStart), 0, 1));

  const FormationArrow = ({fs=90, gap=36, arrowW=60}) => (
    <div style={{display:'flex', alignItems:'center', gap, whiteSpace:'nowrap', justifyContent:'center'}}>
      <div style={display({fontSize:fs, color: morphT < 0.5 ? '#cefa3e' : 'rgba(245,242,232,.3)', letterSpacing:'3px'})}>4-4-2</div>
      <svg width={arrowW + 20} height="20" viewBox={`0 0 ${arrowW + 20} 20`} style={{flexShrink:0}}>
        <path d={`M 0 10 L ${morphT * arrowW} 10`} stroke="#cefa3e" strokeWidth="2"/>
        <polygon points={`${morphT * arrowW},5 ${morphT * arrowW + 10},10 ${morphT * arrowW},15`} fill="#cefa3e"/>
      </svg>
      <div style={display({fontSize:fs, color: morphT > 0.5 ? '#cefa3e' : 'rgba(245,242,232,.3)', letterSpacing:'3px'})}>4-3-3</div>
    </div>
  );

  const Morphing = () => (
    <svg viewBox="0 0 100 150" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
      {FORMATION_442.map((from, i) => {
        const to = FORMATION_433[i] || from;
        const x = from[0] + (to[0] - from[0]) * morphT;
        const y = from[1] + (to[1] - from[1]) * morphT;
        const player = PROMO_NAMES[i];
        if (!player) return null;
        return <PromoDot key={i} x={x} y={y} name={player[0]} num={player[2]} kitColor="#3b82f6"/>;
      })}
    </svg>
  );

  if (isLandscape) {
    return (
      <div style={{position:'absolute', inset:0, background:'#050605', opacity:enter*(1-exit)}}>
        <div style={{position:'absolute', left:100, top:'50%', transform:'translateY(-50%)', width:720}}>
          <Kicker mb={14}>03 / FORMACIÓN</Kicker>
          <div style={display({fontSize:110, lineHeight:.88, letterSpacing:'3px', color:'#f5f2e8', marginBottom:50})}>
            CAMBIÁ DE PLAN<br/>AL TOQUE
          </div>
          <FormationArrow fs={90} gap={36} arrowW={60}/>
        </div>
        <div style={{position:'absolute', right:120, width:580, height:870, top:105}}>
          <PromoPitch progressDraw={1}/>
          <Morphing/>
        </div>
      </div>
    );
  }

  return (
    <div style={{position:'absolute', inset:0, background:'#050605', opacity:enter*(1-exit),
      display:'flex', flexDirection:'column', alignItems:'center'}}>
      <div style={{paddingTop: isSquare ? 120 : 180, textAlign:'center', width:'100%'}}>
        <Kicker mb={isSquare ? 28 : 12}>03 / FORMACIÓN</Kicker>
        <div style={display({fontSize: isSquare ? 78 : 110, letterSpacing:'3px', lineHeight:.88, color:'#f5f2e8'})}>
          CAMBIÁ DE PLAN<br/>AL TOQUE
        </div>
      </div>
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', width:'100%', padding:'20px 0'}}>
        <div style={{width: isSquare ? 420 : 600, height: isSquare ? 630 : 900, position:'relative'}}>
          <PromoPitch progressDraw={1}/>
          <Morphing/>
        </div>
      </div>
      <div style={{paddingBottom: isSquare ? 70 : 130, width:'100%'}}>
        <FormationArrow fs={isSquare ? 50 : 78} gap={isSquare ? 24 : 36} arrowW={isSquare ? 40 : 60}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 5 — KIT MORPHS
// ─────────────────────────────────────────────────────────────────────────────
function SceneKits() {
  const { localTime, duration } = useSprite();
  const { isLandscape, isSquare } = useFormat();
  const enter = clamp(localTime / 0.4, 0, 1);
  const exit = localTime > duration - 0.5 ? clamp((localTime - (duration - 0.5)) / 0.5, 0, 1) : 0;
  const kits = [
    { design: 'solid',   primary: '#dc2626', secondary: '#ffffff' },
    { design: 'stripes', primary: '#1e3a8a', secondary: '#ffffff' },
    { design: 'sash',    primary: '#ffffff', secondary: '#dc2626' },
    { design: 'halves',  primary: '#16a34a', secondary: '#0f172a' },
  ];
  const cycleStart = 0.6, perKit = 1.0;
  const activeIdx = Math.min(kits.length - 1, Math.max(0, Math.floor((localTime - cycleStart) / perKit)));
  const localKitT = clamp(((localTime - cycleStart) - activeIdx * perKit) / perKit, 0, 1);

  const Indicator = () => (
    <div style={{display:'flex', gap:14, alignItems:'center', justifyContent:'center'}}>
      {kits.map((k, i) => (
        <div key={i} style={{
          width: i === activeIdx ? 50 : 10, height: 10,
          background: i === activeIdx ? '#cefa3e' : 'rgba(245,242,232,.25)',
          borderRadius:5, transition:'all .25s',
        }}/>
      ))}
    </div>
  );

  const kitSize = isLandscape ? 520 : (isSquare ? 400 : 540);
  const kitJsx = (
    <div style={{
      transform: `scale(${0.95 + 0.05 * Easing.easeOutBack(localKitT < 0.3 ? localKitT/0.3 : 1)})`,
      opacity: localKitT > 0.85 ? 1 - (localKitT - 0.85) / 0.15 : 1,
    }}>
      <Kit design={kits[activeIdx].design} primary={kits[activeIdx].primary} secondary={kits[activeIdx].secondary} number={10} name="FUTBOLCLUB" size={kitSize}/>
    </div>
  );

  if (isLandscape) {
    return (
      <div style={{position:'absolute', inset:0, background:'radial-gradient(ellipse at center, #131815, #050605 75%)', opacity:enter*(1-exit)}}>
        <div style={{position:'absolute', left:100, top:'50%', transform:'translateY(-50%)', width:600}}>
          <Kicker mb={16}>04 / CAMISETAS</Kicker>
          <div style={display({fontSize:130, lineHeight:.88, letterSpacing:'4px', color:'#f5f2e8'})}>
            DISEÑÁ<br/>TU KIT
          </div>
          <div style={cond({marginTop:36, fontSize:18, color:'rgba(245,242,232,.55)', letterSpacing:'2px', textTransform:'uppercase', fontWeight:500, maxWidth:400, lineHeight:1.6})}>
            4 diseños · colores libres<br/>dorsal · nombre del club
          </div>
          <div style={{marginTop:40}}><Indicator/></div>
        </div>
        <div style={{position:'absolute', right:150, top:'50%', transform:'translateY(-50%)'}}>{kitJsx}</div>
      </div>
    );
  }

  return (
    <div style={{position:'absolute', inset:0, background:'radial-gradient(ellipse at center, #131815, #050605 75%)', opacity:enter*(1-exit),
      display:'flex', flexDirection:'column', alignItems:'center'}}>
      <div style={{paddingTop: isSquare ? 130 : 230, textAlign:'center'}}>
        <Kicker mb={isSquare ? 28 : 12}>04 / CAMISETAS</Kicker>
        <div style={display({fontSize: isSquare ? 78 : 120, letterSpacing:'4px', lineHeight:.88, color:'#f5f2e8'})}>
          DISEÑÁ TU KIT
        </div>
      </div>
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center'}}>
        {kitJsx}
      </div>
      <div style={{paddingBottom: isSquare ? 60 : 120, width:'100%', textAlign:'center'}}>
        <Indicator/>
        <div style={cond({marginTop:18, fontSize:14, letterSpacing:'4px', color:'rgba(245,242,232,.5)', textTransform:'uppercase', fontWeight:600})}>
          4 diseños · colores libres · dorsal · nombre
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 6 — SORTEO
// ─────────────────────────────────────────────────────────────────────────────
function SceneDraw() {
  const { localTime, duration } = useSprite();
  const { isLandscape, isSquare } = useFormat();
  const enter = clamp(localTime / 0.4, 0, 1);
  const exit = localTime > duration - 0.5 ? clamp((localTime - (duration - 0.5)) / 0.5, 0, 1) : 0;
  const spinStart = 0.5, spinEnd = 3.0;
  const t = clamp((localTime - spinStart) / (spinEnd - spinStart), 0, 1);
  let cycleIdx = 0;
  if (t < 1) {
    const totalCycles = 22 * (1 - Math.pow(t, 1.5));
    cycleIdx = Math.floor(totalCycles + t * PROMO_NAMES.length * 3);
  } else {
    cycleIdx = 7; // lands on Juampi
  }
  const currentName = PROMO_NAMES[cycleIdx % PROMO_NAMES.length];
  const assigned = localTime > spinEnd ? clamp((localTime - spinEnd) / 0.5, 0, 1) : 0;
  const teamColor = '#dc2626';
  const teamLabel = 'EQUIPO 1';

  const Spinner = ({ big, minWidth, fs, pad = '50px 90px' }) => (
    <div style={{
      textAlign:'center',
      background:'rgba(20,25,22,.85)',
      border:`2px solid ${assigned > 0 ? '#cefa3e' : 'rgba(245,242,232,.15)'}`,
      borderRadius:24, padding: pad, minWidth,
      boxShadow: assigned > 0 ? '0 0 80px rgba(206,250,62,.2)' : 'none',
    }}>
      <div style={cond({fontSize:14, letterSpacing:'4px', color:'rgba(245,242,232,.4)', textTransform:'uppercase', marginBottom:14, fontWeight:700})}>
        {assigned > 0 ? 'ASIGNADO' : 'SORTEANDO...'}
      </div>
      <div style={display({
        fontSize: fs, lineHeight:.9, color:'#f5f2e8', letterSpacing:'6px',
        minWidth: minWidth - 100, height: fs * .95,
        display:'flex', alignItems:'center', justifyContent:'center',
        transform: t < 1 ? `translateY(${Math.sin(localTime * 30) * 4}px)` : 'none',
      })}>
        {currentName[0].toUpperCase()}
      </div>
      {assigned > 0 && (
        <div style={display({marginTop:18, fontSize: fs * .32, letterSpacing:'4px', color:teamColor, opacity:assigned, transform:`translateY(${(1-assigned) * 12}px)`})}>
          → {teamLabel}
        </div>
      )}
    </div>
  );

  const TeamCards = ({ vertical }) => (
    <div style={{display:'flex', flexDirection: vertical ? 'column' : 'row', gap:14, justifyContent:'center'}}>
      {[['EQUIPO 1','#dc2626','3'],['EQUIPO 2','#2563eb','3'],['EQUIPO 3','#16a34a','3']].map((tm, i) => (
        <div key={i} style={{
          padding:'12px 20px', background:'rgba(20,25,22,.7)',
          border:`1px solid ${tm[1]}`, borderTop:`4px solid ${tm[1]}`,
          borderRadius:8, minWidth:180,
        }}>
          <div style={display({fontSize:28, letterSpacing:'3px', color:'#f5f2e8', lineHeight:1})}>{tm[0]}</div>
          <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'rgba(245,242,232,.5)', marginTop:4}}>
            {i === 0 && assigned > 0 ? '4 JUGADORES' : `${tm[2]} JUGADORES`}
          </div>
        </div>
      ))}
    </div>
  );

  if (isLandscape) {
    return (
      <div style={{position:'absolute', inset:0, background:'#050605', opacity:enter*(1-exit)}}>
        <div style={{position:'absolute', left:80, top:160, width:600}}>
          <Kicker mb={14}>05 / SORTEO</Kicker>
          <div style={display({fontSize:110, lineHeight:.88, letterSpacing:'3px', color:'#f5f2e8'})}>REPARTÍ<br/>LOS PIBES</div>
          <div style={cond({marginTop:28, fontSize:17, color:'rgba(245,242,232,.55)', maxWidth:420, lineHeight:1.5, fontWeight:500})}>
            Fijá algunos por equipo. Sorteá el resto. O sorteá todo de una.
          </div>
        </div>
        <div style={{position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)'}}>
          <Spinner minWidth={520} fs={170}/>
        </div>
        <div style={{position:'absolute', right:80, top:'50%', transform:'translateY(-50%)'}}>
          <TeamCards vertical={true}/>
        </div>
      </div>
    );
  }

  return (
    <div style={{position:'absolute', inset:0, background:'#050605', opacity:enter*(1-exit),
      display:'flex', flexDirection:'column', alignItems:'center'}}>
      <div style={{paddingTop: isSquare ? 130 : 220, textAlign:'center'}}>
        <Kicker mb={isSquare ? 28 : 12}>05 / SORTEO</Kicker>
        <div style={display({fontSize: isSquare ? 80 : 120, lineHeight:.88, letterSpacing:'4px', color:'#f5f2e8'})}>
          REPARTÍ<br/>LOS PIBES
        </div>
      </div>
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <Spinner minWidth={isSquare ? 420 : 600} fs={isSquare ? 130 : 200} pad={isSquare ? '30px 50px' : '40px 70px'}/>
      </div>
      <div style={{paddingBottom: isSquare ? 60 : 120}}>
        <TeamCards vertical={false}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 7 — VS RIVAL  (single combined pitch, two halves)
// ─────────────────────────────────────────────────────────────────────────────
const HOME_433 = [
  [50,144],
  [14,128],[38,128],[62,128],[86,128],
  [28,104],[50,104],[72,104],
  [20,82],[50,84],[80,82],
];
const AWAY_442 = [
  [50,6],
  [14,22],[38,22],[62,22],[86,22],
  [14,42],[38,42],[62,42],[86,42],
  [38,64],[62,64],
];

function SceneRival() {
  const { localTime, duration } = useSprite();
  const { isLandscape, isSquare } = useFormat();
  const enter = clamp(localTime / 0.4, 0, 1);
  const exit = localTime > duration - 0.5 ? clamp((localTime - (duration - 0.5)) / 0.5, 0, 1) : 0;
  const slideT = clamp((localTime - 0.3) / 0.8, 0, 1);
  const slideE = Easing.easeOutCubic(slideT);
  const vsT = clamp((localTime - 1.0) / 0.5, 0, 1);

  const PitchVS = ({ w, h }) => (
    <div style={{position:'relative', width:w, height:h, opacity:slideE}}>
      <PromoPitch progressDraw={1}/>
      <svg viewBox="0 0 100 150" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
        {AWAY_442.map((pos, i) => {
          const t = clamp(slideT - i * 0.04, 0, 1);
          const offsetY = (1 - t) * -30;
          const player = PROMO_NAMES[(i + 5) % PROMO_NAMES.length];
          return <PromoDot key={`a-${i}`} x={pos[0]} y={pos[1] + offsetY} name={player[0]} num={player[2]} scale={t} opacity={t} kitColor="#eab308"/>;
        })}
        {HOME_433.map((pos, i) => {
          const t = clamp(slideT - i * 0.04, 0, 1);
          const offsetY = (1 - t) * 30;
          const player = PROMO_NAMES[i];
          return <PromoDot key={`h-${i}`} x={pos[0]} y={pos[1] + offsetY} name={player[0]} num={player[2]} scale={t} opacity={t} kitColor="#3b82f6"/>;
        })}
      </svg>
      <div style={{
        position:'absolute', left:'50%', top:'50%',
        transform:`translate(-50%,-50%) scale(${0.5 + 0.5 * Easing.easeOutBack(vsT)})`,
        opacity:vsT,
        padding:'8px 28px',
        ...display({fontSize: w > 700 ? 140 : 100, color:'#cefa3e', letterSpacing:'10px', lineHeight:1}),
        textShadow: '0 0 40px rgba(206,250,62,.9), 0 0 12px rgba(0,0,0,.8), 0 4px 24px rgba(0,0,0,.6)',
        zIndex:10,
      }}>VS</div>
    </div>
  );

  if (isLandscape) {
    return (
      <div style={{position:'absolute', inset:0, background:'#050605', opacity:enter*(1-exit),
        display:'flex', alignItems:'center', justifyContent:'center'}}>
        <PitchVS w={650} h={975}/>

        {/* Left labels */}
        <div style={{position:'absolute', left:80, top:'50%', transform:`translate(${(1-vsT)*-20}px, -50%)`, opacity:vsT, width:360}}>
          <Kicker color="rgba(245,242,232,.5)" mb={10}>06 / MODO RIVAL</Kicker>
          <div style={display({fontSize:96, lineHeight:.86, color:'#f5f2e8', letterSpacing:'3px'})}>
            LOS<br/>PIBES
          </div>
          <div style={cond({marginTop:18, padding:'8px 14px', display:'inline-block', background:'#3b82f6', color:'#fff',
            fontSize:13, letterSpacing:'2px', fontWeight:700, textTransform:'uppercase'})}>LOCAL · 4-3-3</div>
        </div>

        {/* Right labels */}
        <div style={{position:'absolute', right:80, top:'50%', transform:`translate(${(1-vsT)*20}px, -50%)`, opacity:vsT, width:360, textAlign:'right'}}>
          <Kicker color="rgba(245,242,232,.5)" mb={10}>21:30 · CANCHA 3</Kicker>
          <div style={display({fontSize:96, lineHeight:.86, color:'#f5f2e8', letterSpacing:'3px'})}>
            LOS<br/>RIVALES
          </div>
          <div style={cond({marginTop:18, padding:'8px 14px', display:'inline-block', background:'#eab308', color:'#0f172a',
            fontSize:13, letterSpacing:'2px', fontWeight:700, textTransform:'uppercase'})}>VISITANTE · 4-4-2</div>
        </div>
      </div>
    );
  }

  // Narrow: rival on top label, pitch in middle, our label below
  return (
    <div style={{position:'absolute', inset:0, background:'#050605', opacity:enter*(1-exit),
      display:'flex', flexDirection:'column', alignItems:'center'}}>
      {/* Away label top */}
      <div style={{paddingTop: isSquare ? 70 : 130, opacity:vsT, textAlign:'center'}}>
        <Kicker color="rgba(245,242,232,.5)" mb={8}>VISITANTE · 4-4-2</Kicker>
        <div style={display({fontSize: isSquare ? 56 : 84, lineHeight:.88, color:'#eab308', letterSpacing:'4px'})}>
          LOS<br/>RIVALES
        </div>
      </div>
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 0', minHeight: 0}}>
        <div style={{flexShrink:0}}>
          <PitchVS w={isSquare ? 440 : 640} h={isSquare ? 660 : 960}/>
        </div>
      </div>
      {/* Home label bottom */}
      <div style={{paddingBottom: isSquare ? 70 : 130, opacity:vsT, textAlign:'center'}}>
        <div style={display({fontSize: isSquare ? 56 : 84, lineHeight:.88, color:'#3b82f6', letterSpacing:'4px', marginBottom: 10})}>
          LOS<br/>PIBES
        </div>
        <Kicker color="rgba(245,242,232,.5)" mb={0}>LOCAL · 4-3-3 · 21:30 · CANCHA 3</Kicker>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 8 — END CARD
// ─────────────────────────────────────────────────────────────────────────────
function SceneEnd() {
  const { localTime } = useSprite();
  const { isLandscape, isSquare } = useFormat();

  const fade = clamp(localTime / 0.8, 0, 1);
  const logoIn = clamp((localTime - 0.2) / 0.8, 0, 1);
  const urlIn = clamp((localTime - 1.4) / 0.5, 0, 1);
  const ctaIn = clamp((localTime - 2.0) / 0.5, 0, 1);

  const wordFs = isLandscape ? 180 : (isSquare ? 130 : 170);

  return (
    <div style={{position:'absolute', inset:0,
      background:'radial-gradient(ellipse at center, #131815 0%, #050605 75%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      opacity:fade}}>
      {/* Logo mark */}
      <div style={{opacity:logoIn, transform:`scale(${0.7 + 0.3 * Easing.easeOutBack(logoIn)})`, marginBottom:36}}>
        <div style={{
          width:130, height:130, background:'#cefa3e', color:'#050605',
          display:'flex', alignItems:'center', justifyContent:'center',
          borderRadius:28, transform:'skewX(-8deg)',
          ...display({fontSize:84, letterSpacing:'2px', lineHeight:1}),
        }}>
          <span style={{transform:'skewX(8deg)', display:'block'}}>FC</span>
        </div>
      </div>

      <div style={{
        display:'flex',
        flexDirection: isLandscape ? 'row' : 'column',
        alignItems: isLandscape ? 'baseline' : 'center',
        gap: isLandscape ? 30 : 0,
        opacity:logoIn,
        transform:`translateY(${(1-logoIn)*20}px)`,
        marginBottom:56,
      }}>
        <div style={display({fontSize:wordFs, letterSpacing:'8px', lineHeight:1, color:'#f5f2e8'})}>FÚTBOL</div>
        <div style={display({fontSize:wordFs, letterSpacing:'8px', lineHeight:1, color:'#cefa3e'})}>CLUB</div>
      </div>

      <div style={cond({fontSize:isSquare ? 18 : 22, letterSpacing:'8px',
        color:'rgba(245,242,232,.7)', textTransform:'uppercase',
        opacity:urlIn, marginBottom:48, fontWeight:500, textAlign:'center'})}>
        armá tu equipo · sorteá los pibes · ganen
      </div>

      <div style={{
        opacity:ctaIn, transform:`translateY(${(1-ctaIn)*16}px)`,
        padding:'18px 40px', border:'1px solid #cefa3e', borderRadius:8,
        fontFamily:'JetBrains Mono, monospace',
        fontSize:18, letterSpacing:'4px', color:'#cefa3e',
      }}>FUTBOLCLUB.APP</div>
    </div>
  );
}

Object.assign(window, {
  SceneIntro, ScenePitchReveal, SceneFormationFill, SceneFormationChange,
  SceneKits, SceneDraw, SceneRival, SceneEnd,
  PromoPitch, PromoDot,
});
