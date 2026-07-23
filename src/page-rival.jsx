// Modo rival — dos alineaciones encaradas (clásico TV), persistido
function RivalPage() {
  const [roster] = window.useStore('roster', window.DEFAULT_ROSTER);
  const [state, setState] = window.useStore('rival', {
    myMode: 11,
    myForm: 0,
    rivalForm: 1,
    myKit: { design: "stripes", primary: "#3b82f6", secondary: "#ffffff" },
    rivalKit: { design: "solid", primary: "#eab308", secondary: "#16a34a" },
    rivalRoster: [], // jugadores propios del equipo rival (no salen de tu plantel)
    rivalName: "LOS VISITANTES",
  });
  const [rivalNameInput, setRivalNameInput] = React.useState('');
  const [teamCrests] = window.useStore('teamCrests', {});
  const crestEntryFor = (name) => {
    const raw = teamCrests[(name||'').trim().toLowerCase()];
    if (!raw) return null;
    if (typeof raw === 'string') return raw === 'none' ? { hidden: true } : { photo: raw };
    return raw;
  };
  const crestFor = (name, fallbackKit) => {
    const entry = crestEntryFor(name) || {};
    if (entry.hidden) return { name, photo: 'none' };
    return {
      name,
      design: entry.design || fallbackKit.design,
      primary: entry.primary || fallbackKit.primary,
      secondary: entry.secondary || fallbackKit.secondary,
      photo: entry.photo || undefined,
    };
  };

  const {
    myMode = 11, myForm = 0, rivalForm = 1,
    myKit = { design: "stripes", primary: "#3b82f6", secondary: "#ffffff" },
    rivalKit = { design: "solid", primary: "#eab308", secondary: "#16a34a" },
  } = state;
  const myTeamName = 'LOS PIBES';
  const rivalTeamName = state.rivalName || 'LOS VISITANTES';
  const rivalRoster = state.rivalRoster || [];

  const myPlayers = roster.slice(0, window.FORMATIONS[myMode][myForm].positions.length);
  const rivalSize = window.FORMATIONS[myMode][rivalForm].positions.length;
  const rivalPlayers = Array.from({length: rivalSize}, (_, i) => rivalRoster[i] || null);

  const addRivalPlayer = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState(s => ({ ...s, rivalRoster: [...(s.rivalRoster||[]), { id: `rv${Date.now()}${Math.random().toString(36).slice(2,6)}`, name: trimmed } ] }));
  };
  const generateRivalPlayers = (n) => {
    setState(s => {
      const base = (s.rivalRoster||[]).length;
      const added = Array.from({length: n}, (_, i) => ({ id: `rv${Date.now()}${Math.random().toString(36).slice(2,6)}${i}`, name: `Rival ${base+i+1}` }));
      return { ...s, rivalRoster: [...(s.rivalRoster||[]), ...added] };
    });
  };
  const removeRivalPlayer = (id) => setState(s => ({ ...s, rivalRoster: (s.rivalRoster||[]).filter(p=>p.id!==id) }));
  const clearRivalRoster = () => setState(s => ({ ...s, rivalRoster: [] }));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Modo rival</div>
          <h1 className="page-title">Nosotros vs. ellos</h1>
          <div className="page-sub">Cancha completa, dos alineaciones encaradas, como la previa en la TV.</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <div className="seg">
            {[7,8,11].map(m => (
              <button key={m} className={myMode===m?"on":""}
                      onClick={()=>setState(s=>({ ...s, myMode: m, myForm: 0, rivalForm: Math.min(1, window.FORMATIONS[m].length-1) }))}>
                Fut {m}
              </button>
            ))}
          </div>
          <button className="btn primary" onClick={()=>window.go('share')}>Compartir →</button>
        </div>
      </div>

      <div className="rival-head-row">
        <div className="rival-side">
          <div className="rival-flag" style={{background: myKit.primary}}></div>
          <Crest {...crestFor(myTeamName, myKit)} size={38}/>
          <div>
            <div className="rival-name">{myTeamName}</div>
            <div className="rival-meta">
              <span className="chip lime">LOCAL</span>
              <span className="chip">{window.FORMATIONS[myMode][myForm].name}</span>
            </div>
          </div>
        </div>
        <div className="rival-vs">
          <div className="vs-word">VS</div>
          <div className="vs-time">21:30 · Cancha 3</div>
        </div>
        <div className="rival-side right">
          <div>
            <input className="rival-name-input" value={state.rivalName || ''} onChange={e=>setState(s=>({...s, rivalName: e.target.value}))} placeholder="LOS VISITANTES"/>
            <div className="rival-meta">
              <span className="chip">VISITANTE</span>
              <span className="chip">{window.FORMATIONS[myMode][rivalForm].name}</span>
            </div>
          </div>
          <Crest {...crestFor(rivalTeamName, rivalKit)} size={38}/>
          <div className="rival-flag" style={{background: rivalKit.primary}}></div>
        </div>
      </div>

      <div className="combined-pitch">
        <div className="half-own">
          <Pitch mode={myMode} formationIndex={myForm} players={myPlayers} kit={myKit}
                 orientation="up" interactive={false}
                 style={document.body.dataset.pitch || "classic"} showNames={true}/>
        </div>
        <div className="half-rival">
          <Pitch mode={myMode} formationIndex={rivalForm} players={rivalPlayers} kit={rivalKit}
                 orientation="up" interactive={false}
                 style={document.body.dataset.pitch || "classic"} showNames={true}/>
        </div>
        <div className="midline-badge">● CENTRO ●</div>
      </div>

      <div className="rival-form-controls">
        <div className="panel">
          <div className="panel-head">Mi formación</div>
          <div className="form-list">
            {window.FORMATIONS[myMode].map((f,i) => (
              <button key={f.name} className={`form-pill ${myForm===i?'on':''}`}
                      onClick={()=>setState(s=>({ ...s, myForm: i }))}>
                <FormationDot formation={f}/><span>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">Formación rival</div>
          <div className="form-list">
            {window.FORMATIONS[myMode].map((f,i) => (
              <button key={f.name} className={`form-pill ${rivalForm===i?'on':''}`}
                      onClick={()=>setState(s=>({ ...s, rivalForm: i }))}>
                <FormationDot formation={f}/><span>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel rival-roster-panel">
        <div className="panel-head-row">
          <span>Plantel rival · {rivalRoster.length}/{rivalSize}</span>
          <span className="chip">No se guarda en tu plantel</span>
        </div>
        <div className="temp-controls">
          <input type="text" placeholder="Nombre y Enter…" value={rivalNameInput}
                 onChange={e=>setRivalNameInput(e.target.value)}
                 onKeyDown={e=>{ if (e.key==='Enter') { addRivalPlayer(rivalNameInput); setRivalNameInput(''); } }}/>
          <button className="btn" onClick={()=>{ addRivalPlayer(rivalNameInput); setRivalNameInput(''); }}>+ Agregar</button>
          <span className="temp-divider">o</span>
          <button className="btn" onClick={()=>generateRivalPlayers(rivalSize - rivalRoster.length > 0 ? rivalSize - rivalRoster.length : 1)}>Completar equipo rival</button>
          {rivalRoster.length > 0 && <button className="btn ghost" onClick={clearRivalRoster}>Vaciar</button>}
        </div>
        {rivalRoster.length > 0 && (
          <div className="pool-chips" style={{marginTop:10}}>
            {rivalRoster.map(p => (
              <div key={p.id} className="pool-chip">
                <div className="pool-chip-avatar" style={{background: window.colorFor(p.name)}}>{window.initials(p.name)}</div>
                <span>{p.name}</span>
                <button className="temp-remove" onClick={()=>removeRivalPlayer(p.id)} title="Quitar">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const rivalCSS = document.createElement("style");
rivalCSS.textContent = `
  .rival-head-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 20px;
    padding: 16px 20px;
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    margin-bottom: 16px;
  }
  @media (max-width: 1000px) {
    .rival-head-row {
      grid-template-columns: 1fr;
      text-align: center;
    }
    .rival-side, .rival-side.right { justify-content: center; text-align: center; }
    .rival-side.right .rival-meta { justify-content: center; }
    .vs-word { font-size: 32px; }
  }
  .rival-side { display: flex; align-items: center; gap: 14px; }
  .rival-side.right { justify-content: flex-end; text-align: right; }
  .rival-flag { width: 6px; height: 48px; border-radius: 2px; }
  .rival-name {
    font-family: var(--font-display);
    font-size: 28px; letter-spacing: 1.5px;
    line-height: 1;
  }
  .rival-meta { display: flex; gap: 6px; margin-top: 6px; }
  .rival-side.right .rival-meta { justify-content: flex-end; }
  .rival-name-input {
    background: transparent; border: 0; border-bottom: 1px solid transparent;
    text-align: right; padding: 0;
    font-family: var(--font-display);
    font-size: 28px; letter-spacing: 1.5px; line-height: 1;
    color: var(--fg); width: 100%; outline: none;
  }
  .rival-name-input:hover, .rival-name-input:focus { border-bottom-color: var(--line); }
  .rival-roster-panel { margin-top: 18px; }
  .vs-word {
    font-family: var(--font-display);
    font-size: 48px; color: var(--accent);
    line-height: 1;
  }
  .vs-time {
    font-family: var(--font-mono); font-size: 11px;
    color: var(--fg-dim); text-align: center;
  }

  .combined-pitch {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    max-width: 1200px; margin: 0 auto;
    background: #0e1210;
    border-radius: 14px;
    overflow: hidden;
  }
  @media (max-width: 800px) {
    .combined-pitch { grid-template-columns: 1fr; }
  }
  .half-own, .half-rival { width: 100%; }
  .half-own .pitch-wrap, .half-rival .pitch-wrap {
    border-radius: 0;
    aspect-ratio: auto;
    height: 60vh; min-height: 480px;
  }
  .midline-badge {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(14,18,16,.85);
    border: 1px solid rgba(255,255,255,.15);
    padding: 4px 14px;
    border-radius: 99px;
    font-family: var(--font-cond);
    font-size: 10px; letter-spacing: 2px;
    color: var(--fg-mute);
    z-index: 5;
  }

  .rival-form-controls {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
    margin-top: 18px;
  }

  .combined-pitch { max-height: 80vh; }
  .combined-pitch .pitch-svg { width: 100%; }
`;
document.head.appendChild(rivalCSS);

ReactDOM.createRoot(document.getElementById("page-rival")).render(<RivalPage/>);
