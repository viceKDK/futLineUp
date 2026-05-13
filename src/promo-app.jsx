// Promo app — composes all scenes; supports multiple aspect ratios

const FormatContext = React.createContext({ format: '16:9', isPortrait: false, isSquare: false, isLandscape: true });
window.useFormat = () => React.useContext(FormatContext);

const FORMATS = {
  '16:9': { w: 1920, h: 1080, label: 'YouTube · Web',        sublabel: '1920×1080', duration: 35 },
  '9:16': { w: 1080, h: 1920, label: 'Stories · Reels · TikTok', sublabel: '1080×1920', duration: 32 },
  '1:1':  { w: 1080, h: 1080, label: 'IG Feed',              sublabel: '1080×1080', duration: 30 },
};

// Per-format scene proportions (sum to 1.0)
const SCENE_PROPS = {
  '16:9': [0.085, 0.155, 0.155, 0.105, 0.140, 0.135, 0.115, 0.110],
  '9:16': [0.080, 0.180, 0.150, 0.100, 0.135, 0.130, 0.115, 0.110],
  '1:1':  [0.080, 0.150, 0.145, 0.105, 0.140, 0.125, 0.135, 0.120],
};

function PromoApp() {
  const [format, setFormat] = React.useState(() => {
    try { return localStorage.getItem('futbolclub-promo:fmt') || '16:9'; } catch { return '16:9'; }
  });
  const [clean, setClean] = React.useState(false);

  React.useEffect(() => {
    try { localStorage.setItem('futbolclub-promo:fmt', format); } catch {}
  }, [format]);

  // Toggle clean mode with 'h' or Escape
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'h' || e.key === 'H') { e.preventDefault(); setClean(c => !c); }
      if (e.key === 'Escape' && clean) { setClean(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clean]);

  const autoplay = typeof location !== 'undefined' && location.hash.includes('pause') ? false : true;

  const dim = FORMATS[format];
  const isPortrait = format === '9:16';
  const isSquare = format === '1:1';
  const isLandscape = format === '16:9';

  return (
    <div className={`promo-shell ${clean ? 'clean' : ''}`} style={{position:'fixed', inset:0, display:'flex', flexDirection:'column'}}>
      {!clean && <FormatBar value={format} onChange={setFormat} onClean={() => setClean(true)}/>}
      <div className="stage-wrap" style={{position:'relative', flex:1, minHeight:0}}>
        <Stage
          key={format}
          width={dim.w}
          height={dim.h}
          duration={dim.duration}
          background="#050605"
          autoplay={autoplay}
          persistKey={`futbolclub-promo:${format}`}
        >
          <FormatContext.Provider value={{ format, isPortrait, isSquare, isLandscape, width: dim.w, height: dim.h }}>
            <SceneFlow/>
          </FormatContext.Provider>
        </Stage>
      </div>
      {clean && (
        <button onClick={() => setClean(false)}
          style={{
            position:'fixed', top:14, right:14, zIndex:999,
            width:30, height:30, borderRadius:6,
            background:'rgba(20,25,22,.6)', color:'rgba(245,242,232,.7)',
            border:'1px solid rgba(255,255,255,.1)',
            cursor:'pointer', fontSize:16, opacity: 0.5,
          }}
          title="Salir modo limpio (Esc o H)"
          onMouseEnter={e=>e.currentTarget.style.opacity=1}
          onMouseLeave={e=>e.currentTarget.style.opacity=0.5}
        >×</button>
      )}
    </div>
  );
}

// Scene flow — same scenes, but timings condensed for shorter formats
function SceneFlow() {
  const { format } = useFormat();
  const D = FORMATS[format].duration;

  const names = ['SceneIntro','ScenePitchReveal','SceneFormationFill','SceneFormationChange','SceneKits','SceneDraw','SceneRival','SceneEnd'];
  const fmtProps = SCENE_PROPS[format];
  const props = names.map((name, i) => [name, fmtProps[i]]);

  // For 1:1 (IG Feed @ 22s) we want to keep all scenes but ensure end card is generous
  // Just compute starts
  let t = 0;
  const ranges = props.map(([name, p]) => {
    const start = t;
    const end = t + p * D;
    t = end;
    return [name, start, end];
  });

  // Persistent chrome
  return (
    <>
      <Grain/>
      <CinematicBars/>
      <CornerMark/>
      <TimeCode/>

      {ranges.map(([name, start, end]) => {
        const Comp = window[name];
        return (
          <Sprite key={name} start={start} end={end}>
            <Comp/>
          </Sprite>
        );
      })}
    </>
  );
}

function FormatBar({ value, onChange, onClean }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      padding:'10px 20px', background:'#0a0c0a',
      borderBottom:'1px solid #1a1f1c',
      fontFamily:"'Inter', system-ui, sans-serif",
      flexShrink: 0,
    }}>
      <div style={{
        fontFamily:"'Bebas Neue', 'Archivo Narrow', sans-serif",
        fontSize:18, color:'#cefa3e', letterSpacing:'2px',
      }}>fútbol<span style={{color:'#f5f2e8'}}>Club</span> · PROMO</div>
      <div style={{flex:1}}/>
      <div style={{fontSize:11, color:'rgba(245,242,232,.4)', letterSpacing:'2px', textTransform:'uppercase', marginRight:8}}>FORMATO</div>
      {Object.entries(FORMATS).map(([k, v]) => (
        <button key={k}
          onClick={() => onChange(k)}
          style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'8px 14px',
            background: value === k ? '#cefa3e' : 'transparent',
            color: value === k ? '#050605' : 'rgba(245,242,232,.7)',
            border:'1px solid', borderColor: value === k ? '#cefa3e' : '#1a1f1c',
            borderRadius:6, fontSize:12,
            cursor:'pointer',
            fontFamily:"'Inter', system-ui, sans-serif",
            fontWeight: 500,
          }}>
          <AspectIcon ratio={k} active={value === k}/>
          <div style={{textAlign:'left', lineHeight:1.2}}>
            <div style={{fontWeight:600}}>{k}</div>
            <div style={{fontSize:10, opacity:.7}}>{v.label}</div>
          </div>
        </button>
      ))}
      <div style={{width:1, height:24, background:'#1a1f1c', margin:'0 4px'}}/>
      <button onClick={onClean}
        title="Modo limpio para grabar (H / Esc para volver)"
        style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'8px 12px',
          background:'transparent',
          color:'rgba(245,242,232,.7)',
          border:'1px solid #1a1f1c',
          borderRadius:6, fontSize:12, cursor:'pointer',
          fontFamily:"'Inter', system-ui, sans-serif", fontWeight:500,
        }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="1" y="1" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="6.5" cy="6.5" r="2" fill="currentColor"/>
        </svg>
        Modo limpio
      </button>
    </div>
  );
}

function AspectIcon({ ratio, active }) {
  const sizes = { '16:9':[24,14], '9:16':[14,24], '1:1':[18,18] };
  const [w, h] = sizes[ratio];
  return (
    <div style={{
      width: w, height: h,
      border: `1.5px solid ${active ? '#050605' : 'rgba(245,242,232,.6)'}`,
      borderRadius: 2,
    }}/>
  );
}

// ── Chrome ─────────────────────────────────────────────────────────────────
function Grain() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      zIndex: 100, opacity: 0.05, mixBlendMode: 'overlay',
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
    }}/>
  );
}

function CinematicBars() {
  const { isPortrait, isSquare, height } = useFormat();
  // Smaller bars on portrait/square
  const barH = isPortrait ? 80 : (isSquare ? 40 : 60);
  return (
    <>
      <div style={{position:'absolute', top:0, left:0, right:0, height:barH, background:'#050605', zIndex:90}}/>
      <div style={{position:'absolute', bottom:0, left:0, right:0, height:barH, background:'#050605', zIndex:90}}/>
    </>
  );
}

function CornerMark() {
  const time = useTime();
  const { isPortrait, isSquare } = useFormat();
  return (
    <div style={{
      position: 'absolute',
      top: isPortrait ? 22 : (isSquare ? 12 : 22),
      right: 30, zIndex: 95,
      display:'flex', alignItems:'center', gap:8,
      fontFamily:'JetBrains Mono, monospace', fontSize:11,
      color:'rgba(245,242,232,.6)', letterSpacing:'2px',
    }}>
      <div style={{
        width:8, height:8, borderRadius:'50%',
        background:'#cefa3e',
        opacity: 0.4 + 0.6 * Math.abs(Math.sin(time * 3)),
      }}/>
      <span>REC · futbolClub · 2026</span>
    </div>
  );
}

function TimeCode() {
  const time = useTime();
  const { isPortrait, isSquare } = useFormat();
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  const f = Math.floor((time * 24) % 24);
  const fmt = (n, w=2) => String(n).padStart(w, '0');
  return (
    <div style={{
      position:'absolute',
      bottom: isPortrait ? 22 : (isSquare ? 12 : 22),
      right:30, zIndex:95,
      fontFamily:'JetBrains Mono, monospace', fontSize:11,
      color:'rgba(245,242,232,.4)', letterSpacing:'2px',
    }}>
      00:{fmt(m)}:{fmt(s)}:{fmt(f)}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PromoApp/>);
