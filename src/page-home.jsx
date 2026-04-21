// Home / Mis equipos — stats derivadas de partidos reales
function HomePage() {
  const [teams]   = window.useStore('teams',   window.DEFAULT_SAVED_TEAMS);
  const [roster]  = window.useStore('roster',  window.DEFAULT_ROSTER);
  const [matches, setMatches] = window.useStore('matches', []);
  const [, setDraft] = window.useStore('editor', null);
  const [filter, setFilter] = React.useState('all');
  const [modal, setModal] = React.useState(null);

  const loadTeam = (t) => {
    const fIdx = (window.FORMATIONS[t.mode] || []).findIndex(f => f.name === t.formation);
    setDraft({
      teamId: t.id,
      name: t.name,
      mode: t.mode,
      formIdx: Math.max(0, fIdx),
      freeMode: false,
      kit: { design: t.kit, primary: t.color, secondary: t.secondary || "#0f172a" },
      assignedIds: [],
      freePositions: {},
    });
    window.go('editor');
  };

  const deleteTeam = (t) => {
    if (!confirm(`¿Borrar "${t.name}"?`)) return;
    window.db.save('teams', teams.filter(x => x.id !== t.id));
  };

  const filtered = teams.filter(t =>
    filter === 'all' ? true : t.mode === parseInt(filter, 10)
  );

  // Stats derivadas
  const lastMatch = matches.length ? matches[matches.length - 1] : null;
  const lastResult = lastMatch ? `${lastMatch.us}–${lastMatch.them}` : '—';

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Temporada 26 · Otoño</div>
          <h1 className="page-title">Mis equipos</h1>
          <div className="page-sub">Armá la alineación, sorteá pibes, elegí la camiseta. Todo en un solo lado.</div>
        </div>
        <div style={{display:'flex', gap:10}}>
          <button className="btn" onClick={()=>setModal({type:'match'})}>+ Resultado</button>
          <button className="btn" onClick={()=>window.go('draw')}>Sortear ahora</button>
          <button className="btn primary" onClick={()=>window.go('mode')}>+ Nuevo equipo</button>
        </div>
      </div>

      <div className="hero-strip">
        <div className="hero-stat">
          <div className="hero-stat-n">{String(teams.length).padStart(2,'0')}</div>
          <div className="hero-stat-l">equipos</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-n">{roster.length}</div>
          <div className="hero-stat-l">jugadores en plantel</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-n">{String(matches.length).padStart(2,'0')}</div>
          <div className="hero-stat-l">partidos jugados</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-n">{lastResult}</div>
          <div className="hero-stat-l">
            {lastMatch ? `vs ${lastMatch.opponent}` : 'último resultado'}
          </div>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="recent-matches">
          <div className="section-head">
            <h2>Últimos partidos</h2>
            <span className="chip">{matches.length}</span>
          </div>
          <div className="matches-row">
            {matches.slice(-6).reverse().map(m => {
              const team = teams.find(t => t.id === m.teamId);
              const won = m.us > m.them, tied = m.us === m.them;
              return (
                <div key={m.id} className="match-chip">
                  <div className={`match-result ${won?'win':tied?'tie':'loss'}`}>
                    {m.us}–{m.them}
                  </div>
                  <div className="match-info">
                    <div className="match-team">{team?.name || 'Mi equipo'}</div>
                    <div className="match-opp">vs {m.opponent}</div>
                  </div>
                  <button className="match-del" onClick={()=>{
                    setMatches(prev => prev.filter(x => x.id !== m.id));
                  }} title="Borrar">×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="section-head">
        <h2>Equipos guardados</h2>
        <div className="filters">
          <button className={`chip ${filter==='all'?'lime':''}`} onClick={()=>setFilter('all')}>Todos</button>
          <button className={`chip ${filter==='5'?'lime':''}`} onClick={()=>setFilter('5')}>Fut 5</button>
          <button className={`chip ${filter==='7'?'lime':''}`} onClick={()=>setFilter('7')}>Fut 7</button>
          <button className={`chip ${filter==='11'?'lime':''}`} onClick={()=>setFilter('11')}>Fut 11</button>
        </div>
      </div>

      <div className="teams-grid">
        {filtered.map(t => <TeamCard key={t.id} team={t} onOpen={()=>loadTeam(t)} onDelete={()=>deleteTeam(t)}/>)}
        <button className="team-card new" onClick={()=>window.go('mode')}>
          <div className="new-plus">+</div>
          <div className="new-label">Nuevo equipo</div>
          <div className="new-sub">Elegí modo y empezá</div>
        </button>
      </div>

      <div className="section-head" style={{marginTop:40}}>
        <h2>Accesos rápidos</h2>
      </div>
      <div className="quick-grid">
        <QuickCard title="Editor de alineación" sub="Arrastrá jugadores a la cancha" icon="◈" action={()=>window.go('editor')}/>
        <QuickCard title="Sorteo de equipos" sub="Con ruleta + jugadores fijos" icon="⟳" action={()=>window.go('draw')}/>
        <QuickCard title="Modo rival" sub="Enfrentá dos alineaciones" icon="⚔" action={()=>window.go('rival')}/>
        <QuickCard title="Camisetas" sub="4 diseños + personalización" icon="▦" action={()=>window.go('kits')}/>
      </div>

      {modal?.type === 'match' && (
        <MatchModal
          teams={teams}
          onClose={()=>setModal(null)}
          onSave={(m) => {
            setMatches(prev => [...prev, { ...m, id: 'm' + Date.now() }]);
            window.__toast?.('Resultado guardado');
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function MatchModal({ teams, onClose, onSave }) {
  const [teamId, setTeamId] = React.useState(teams[0]?.id || '');
  const [us, setUs] = React.useState(0);
  const [them, setThem] = React.useState(0);
  const [opponent, setOpponent] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().slice(0,10));

  const submit = () => {
    if (!teamId) return;
    onSave({
      teamId,
      us: parseInt(us, 10) || 0,
      them: parseInt(them, 10) || 0,
      opponent: opponent.trim() || 'Rival',
      date,
    });
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="page-kicker">Registrar partido</div>
            <div className="modal-title">Cargá el resultado</div>
          </div>
          <button className="btn sm ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid match-form">
            <label style={{gridColumn:'span 2'}}>
              <span>Equipo</span>
              <select value={teamId} onChange={e=>setTeamId(e.target.value)}>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
            <label>
              <span>Nosotros</span>
              <input type="number" min="0" value={us} onChange={e=>setUs(e.target.value)}/>
            </label>
            <label>
              <span>Ellos</span>
              <input type="number" min="0" value={them} onChange={e=>setThem(e.target.value)}/>
            </label>
            <label style={{gridColumn:'span 2'}}>
              <span>Rival</span>
              <input type="text" value={opponent} onChange={e=>setOpponent(e.target.value)} placeholder="Los del Jueves"/>
            </label>
            <label style={{gridColumn:'span 2'}}>
              <span>Fecha</span>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
            </label>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={submit}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function TeamCard({ team, onOpen, onDelete }) {
  return (
    <div className="team-card-wrap">
      <button className="team-card" onClick={onOpen}>
        <div className="team-card-top">
          <div className="team-kit-thumb">
            <Kit design={team.kit} primary={team.color} secondary={team.secondary || "#0f172a"} number={team.mode === 11 ? 10 : 7} size={68} showNumber={true}/>
          </div>
          <div className="team-meta-tags">
            <span className="chip lime">Fut {team.mode}</span>
            <span className="chip">{team.formation}</span>
          </div>
        </div>
        <div className="team-name">{team.name}</div>
        <div className="team-foot">
          <span>{team.players} jugadores</span>
          <span className="dot">·</span>
          <span>{team.lastPlayed}</span>
        </div>
      </button>
      <button className="team-del" onClick={onDelete} title="Borrar equipo">×</button>
    </div>
  );
}

function QuickCard({ title, sub, icon, action }) {
  return (
    <button className="quick-card" onClick={action}>
      <div className="quick-icon">{icon}</div>
      <div className="quick-body">
        <div className="quick-title">{title}</div>
        <div className="quick-sub">{sub}</div>
      </div>
      <div className="quick-arrow">→</div>
    </button>
  );
}

const homeCSS = document.createElement("style");
homeCSS.textContent = `
  .hero-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: var(--line-soft);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 32px;
  }
  .hero-stat { background: var(--bg-elev); padding: 18px 22px; }
  .hero-stat-n {
    font-family: var(--font-display);
    font-size: 44px; line-height: 1;
    letter-spacing: 1px;
  }
  .hero-stat-l {
    font-family: var(--font-cond);
    text-transform: uppercase; letter-spacing: 1.4px;
    font-size: 11px; color: var(--fg-dim);
    margin-top: 4px;
  }

  .section-head {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 14px;
  }
  .section-head h2 {
    font-family: var(--font-display);
    font-size: 22px; letter-spacing: 1.2px;
    margin: 0; font-weight: 400;
  }
  .filters { display: flex; gap: 6px; }

  .recent-matches { margin-bottom: 32px; }
  .matches-row {
    display: grid; gap: 8px;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  .match-chip {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px;
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    position: relative;
  }
  .match-result {
    font-family: var(--font-display);
    font-size: 28px; line-height: 1;
    letter-spacing: 1px;
  }
  .match-result.win  { color: var(--accent); }
  .match-result.loss { color: var(--accent-2); }
  .match-result.tie  { color: var(--fg-mute); }
  .match-info { flex: 1; min-width: 0; }
  .match-team { font-size: 13px; font-weight: 600; }
  .match-opp  { font-size: 11px; color: var(--fg-dim); font-family: var(--font-mono); }
  .match-del {
    width: 22px; height: 22px; border-radius: 4px;
    background: transparent; color: var(--fg-dim); font-size: 14px; line-height: 1;
    flex-shrink: 0;
  }
  .match-del:hover { background: var(--accent-2); color: #fff; }

  .teams-grid {
    display: grid; gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  .team-card-wrap { position: relative; }
  .team-card {
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    padding: 16px;
    text-align: left;
    color: var(--fg);
    display: flex; flex-direction: column;
    transition: border-color .15s, transform .15s;
    width: 100%;
  }
  .team-card:hover { border-color: var(--accent); transform: translateY(-2px); }
  .team-del {
    position: absolute; top: 8px; right: 8px;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--bg-elev-2); color: var(--fg-dim);
    font-size: 14px; line-height: 1;
    opacity: 0; transition: opacity .15s;
    z-index: 2;
  }
  .team-card-wrap:hover .team-del { opacity: 1; }
  .team-del:hover { background: var(--accent-2); color: #fff; }

  .team-card-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 14px;
  }
  .team-kit-thumb {
    background:
      radial-gradient(circle at 50% 60%, rgba(255,255,255,.04), transparent 70%),
      var(--bg-elev-2);
    padding: 8px; border-radius: 8px;
  }
  .team-meta-tags { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
  .team-name {
    font-family: var(--font-display);
    font-size: 22px; letter-spacing: 1px;
    line-height: 1.1;
    margin-bottom: 6px;
  }
  .team-foot {
    font-size: 12px; color: var(--fg-dim);
    display: flex; gap: 6px; align-items: center;
    margin-top: auto;
  }
  .team-foot .dot { opacity: .5; }

  .team-card.new {
    display: grid; place-items: center;
    border-style: dashed; background: transparent;
    color: var(--fg-mute);
  }
  .team-card.new:hover { color: var(--accent); border-color: var(--accent); transform: none; }
  .new-plus {
    font-family: var(--font-display); font-size: 54px;
    line-height: 1;
  }
  .new-label { font-weight: 600; margin-top: 6px; }
  .new-sub { font-size: 12px; color: var(--fg-dim); }

  .quick-grid {
    display: grid; gap: 10px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
  .quick-card {
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    padding: 14px 16px;
    display: flex; align-items: center; gap: 14px;
    text-align: left; color: var(--fg);
    transition: background .15s, border-color .15s;
  }
  .quick-card:hover { background: var(--bg-elev-2); border-color: var(--accent); }
  .quick-icon {
    width: 36px; height: 36px;
    display: grid; place-items: center;
    background: var(--bg-elev-2);
    border: 1px solid var(--line);
    border-radius: 8px;
    font-size: 18px; color: var(--accent);
    font-family: var(--font-display);
  }
  .quick-body { flex: 1; min-width: 0; }
  .quick-title { font-weight: 600; }
  .quick-sub { color: var(--fg-dim); font-size: 12px; }
  .quick-arrow { color: var(--fg-dim); font-size: 18px; }
  .quick-card:hover .quick-arrow { color: var(--accent); transform: translateX(2px); }

  .match-form select {
    background: var(--bg-elev-2);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 8px 10px; font-size: 13px;
    color: var(--fg); outline: none;
  }
  .match-form select:focus { border-color: var(--accent); }
  .match-form input[type="date"] { color-scheme: dark; }
`;
document.head.appendChild(homeCSS);

ReactDOM.createRoot(document.getElementById("page-home")).render(<HomePage/>);
