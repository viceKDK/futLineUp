// Home / Mis equipos — stats derivadas de partidos reales
function HomePage() {
  const [teams, setTeams] = window.useStore('teams', window.DEFAULT_SAVED_TEAMS);
  const [profile] = window.useStore('profile', window.DEFAULT_PROFILE);
  const [roster]  = window.useStore('roster',  window.DEFAULT_ROSTER);
  const [matches, setMatches] = window.useStore('matches', []);
  const [matchInfo] = window.useStore('matchInfo', null);
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
      freeMode: !!t.freeMode,
      kit: { design: t.kit, primary: t.color, secondary: t.secondary || "#0f172a" },
      assignedIds: (t.assignedIds || []).slice(),
      freePositions: { ...(t.freePositions || {}) },
      captainId: t.captainId || null,
      substituteIds: (t.substituteIds || []).slice(),
    });
    window.go('editor');
  };

  const deleteTeam = (t) => {
    if (!confirm(`¿Borrar "${t.name}"?`)) return;
    setTeams(prev => prev.filter(x => x.id !== t.id));
  };

  const duplicateTeam = (team) => {
    const copy = {
      ...team,
      id: `t${Date.now()}`,
      name: `${team.name} (copia)`,
      assignedIds: (team.assignedIds || []).slice(),
      freePositions: structuredClone(team.freePositions || {}),
      substituteIds: (team.substituteIds || []).slice(),
      updatedAt: new Date().toISOString(),
    };
    setTeams(prev => [...prev, copy]);
    window.__toast?.('Equipo duplicado');
  };
  const filtered = teams.filter(t =>
    filter === 'all' ? true : t.mode === parseInt(filter, 10)
  );

  // Stats derivadas
  const lastMatch = matches.length ? matches[matches.length - 1] : null;
  const lastResult = lastMatch ? `${lastMatch.us}–${lastMatch.them}` : '—';

  const topScorers = React.useMemo(() => {
    const totals = {};
    matches.forEach(m => (m.scorers || []).forEach(s => {
      if (!s.playerId || !s.goals) return;
      totals[s.playerId] = (totals[s.playerId] || 0) + Number(s.goals);
    }));
    return Object.entries(totals)
      .map(([playerId, goals]) => ({ player: roster.find(p => p.id === Number(playerId) || p.id === playerId), goals }))
      .filter(x => x.player)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
  }, [matches, roster]);

  return (
    <div>
      <GuestModeBanner />
      <NextMatchBanner matchInfo={matchInfo} />
      <div className="page-head">
        <div>
          <div className="page-kicker">{profile.season || (profile.experience === "coach" ? "Modo entrenador" : profile.experience === "league" ? "Modo liga" : "Tu fútbol, a tu manera")}</div>
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
                  <button className="match-edit" onClick={()=>setModal({type:'match', match:m})} title="Editar">✎</button>
                  <button className="match-del" onClick={()=>{
                    setMatches(prev => prev.filter(x => x.id !== m.id));
                  }} title="Borrar">×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {topScorers.length > 0 && (
        <div className="scorers-card">
          <div className="panel-head-row"><span>Goleadores</span><span className="chip">Basado en tus partidos cargados</span></div>
          <div className="scorers-list">
            {topScorers.map((s, i) => (
              <div key={s.player.id} className="scorer-row">
                <span className="scorer-pos">{i+1}</span>
                <div className="mini-avatar" style={{background: window.colorFor(s.player.name)}}>{window.initials(s.player.name)}</div>
                <span className="scorer-name">{s.player.name}</span>
                <span className="scorer-goals">{s.goals} gol{s.goals===1?'':'es'}</span>
              </div>
            ))}
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
        {filtered.map(t => <TeamCard key={t.id} team={t} onOpen={()=>loadTeam(t)} onDuplicate={()=>duplicateTeam(t)} onDelete={()=>deleteTeam(t)}/>)}
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
        <QuickCard title="Editor de alineación" sub="Arrastrá jugadores a la cancha" icon="editorNav" action={()=>window.go('editor')}/>
        <QuickCard title="Sorteo de equipos" sub="Con ruleta + jugadores fijos" icon="shuffle" action={()=>window.go('draw')}/>
        <QuickCard title="Modo rival" sub="Enfrentá dos alineaciones" icon="target" action={()=>window.go('rival')}/>
        <QuickCard title="Camisetas" sub="4 diseños + personalización" icon="jersey" action={()=>window.go('kits')}/>
      </div>

      {modal?.type === 'match' && (
        <MatchModal
          teams={teams}
          roster={roster}
          initial={modal.match || null}
          onClose={()=>setModal(null)}
          onSave={(m) => {
            if (modal.match) {
              setMatches(prev => prev.map(x => x.id === modal.match.id ? { ...x, ...m } : x));
              window.__toast?.('Resultado actualizado');
            } else {
              setMatches(prev => [...prev, { ...m, id: 'm' + Date.now() }]);
              window.__toast?.('Resultado guardado');
            }
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function GuestModeBanner() {
  const [session, setSession] = React.useState(undefined);

  React.useEffect(() => {
    window.fcAuth?.session().then(value => setSession(value || null)).catch(() => setSession(null));
    const subscription = window.fcSupabase?.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription?.data?.subscription?.unsubscribe?.();
  }, []);

  if (session === undefined || session) return null;
  return (
    <aside className="guest-banner" aria-label="Modo sin cuenta">
      <div className="guest-banner-icon" aria-hidden="true">✓</div>
      <div>
        <strong>Estás usando futbolClub sin cuenta</strong>
        <span>Podés crear, guardar y compartir alineaciones. Tus datos quedan en este dispositivo.</span>
      </div>
      <button className="btn sm ghost" onClick={()=>window.go('settings')}>Backup y sincronización</button>
    </aside>
  );
}

function NextMatchBanner({ matchInfo }) {
  if (!matchInfo?.date) return null;
  const today = new Date().toISOString().slice(0,10);
  if (matchInfo.date < today) return null;
  const isToday = matchInfo.date === today;
  const days = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
  let label = matchInfo.date;
  try { label = days[new Date(matchInfo.date + 'T00:00').getDay()]; } catch (_) {}
  return (
    <aside className="next-match-banner" aria-label="Próximo partido">
      <div className="next-match-icon" aria-hidden="true"><Icon name="session" size={18}/></div>
      <div>
        <strong>{isToday ? '¡Partido hoy!' : `Próximo partido · ${label}`} {matchInfo.time && `· ${matchInfo.time}`}</strong>
        <span>{matchInfo.venue ? `${matchInfo.venue} · ` : ''}vs {matchInfo.opponent || 'rival'}</span>
      </div>
      <button className="btn sm" onClick={()=>window.go('share')}>Ver detalles</button>
    </aside>
  );
}

function MatchModal({ teams, roster, initial, onClose, onSave }) {
  const [teamId, setTeamId] = React.useState(initial?.teamId || teams[0]?.id || '');
  const [us, setUs] = React.useState(initial?.us ?? 0);
  const [them, setThem] = React.useState(initial?.them ?? 0);
  const [opponent, setOpponent] = React.useState(initial?.opponent || '');
  const [date, setDate] = React.useState(initial?.date || new Date().toISOString().slice(0,10));
  const [scorers, setScorers] = React.useState(initial?.scorers || []);
  const [scorerPick, setScorerPick] = React.useState(roster[0]?.id ?? '');
  const [scorerGoals, setScorerGoals] = React.useState(1);

  const addScorer = () => {
    if (scorerPick === '') return;
    setScorers(prev => {
      const existing = prev.find(s => s.playerId === scorerPick);
      const goals = Number(scorerGoals) || 1;
      if (existing) return prev.map(s => s.playerId === scorerPick ? { ...s, goals: s.goals + goals } : s);
      return [...prev, { playerId: scorerPick, goals }];
    });
  };
  const removeScorer = (playerId) => setScorers(prev => prev.filter(s => s.playerId !== playerId));

  const submit = () => {
    if (!teamId) return;
    onSave({
      teamId,
      us: parseInt(us, 10) || 0,
      them: parseInt(them, 10) || 0,
      opponent: opponent.trim() || 'Rival',
      date,
      scorers,
    });
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="page-kicker">{initial ? 'Editar partido' : 'Registrar partido'}</div>
            <div className="modal-title">{initial ? 'Corregí el resultado' : 'Cargá el resultado'}</div>
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

          <div className="scorers-field">
            <span className="scorers-field-label">Goleadores (opcional)</span>
            <div className="scorers-add-row">
              <select value={scorerPick} onChange={e=>setScorerPick(Number(e.target.value)||e.target.value)}>
                {roster.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" min="1" value={scorerGoals} onChange={e=>setScorerGoals(e.target.value)}/>
              <button className="btn sm" type="button" onClick={addScorer}>+ Agregar</button>
            </div>
            {scorers.length > 0 && (
              <div className="scorers-chip-row">
                {scorers.map(s => {
                  const p = roster.find(r => r.id === s.playerId);
                  if (!p) return null;
                  return (
                    <span key={s.playerId} className="chip">
                      {p.name} · {s.goals}
                      <button className="scorer-chip-del" onClick={()=>removeScorer(s.playerId)}>×</button>
                    </span>
                  );
                })}
              </div>
            )}
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

function TeamCard({ team, onOpen, onDelete, onDuplicate }) {
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
      <button className="team-duplicate" onClick={onDuplicate} title="Duplicar equipo" aria-label={`Duplicar ${team.name}`}>⧉</button>
      <button className="team-del" onClick={onDelete} title="Borrar equipo" aria-label={`Borrar ${team.name}`}>×</button>
    </div>
  );
}

function QuickCard({ title, sub, icon, action }) {
  return (
    <button className="quick-card" onClick={action}>
      <div className="quick-icon"><Icon name={icon} size={18}/></div>
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
  .scorers-card {
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 24px;
  }
  .scorers-list { display: flex; flex-direction: column; gap: 4px; }
  .scorer-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
  .scorer-pos { width: 18px; color: var(--fg-dim); font-family: var(--font-mono); font-size: 11px; text-align: center; }
  .scorer-name { flex: 1; font-size: 13px; font-weight: 500; }
  .scorer-goals { font-family: var(--font-cond); font-size: 12px; color: var(--accent); font-weight: 700; }
  .guest-banner {
    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px;
    margin-bottom: 18px; padding: 12px 14px;
    border: 1px solid color-mix(in oklch, var(--accent) 45%, var(--line));
    border-radius: var(--radius);
    background: color-mix(in oklch, var(--accent) 7%, var(--bg-elev));
  }
  .guest-banner-icon {
    width: 28px; height: 28px; display: grid; place-items: center;
    border-radius: 50%; background: var(--accent); color: #0e1210; font-weight: 800;
  }
  .guest-banner strong, .guest-banner span { display: block; }
  .guest-banner span { margin-top: 2px; color: var(--fg-mute); font-size: 12px; }
  @media (max-width: 650px) {
    .guest-banner { grid-template-columns: auto 1fr; }
    .guest-banner .btn { grid-column: 1/-1; justify-content: center; }
  }
  .next-match-banner {
    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px;
    margin-bottom: 18px; padding: 12px 14px;
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    background: var(--bg-elev);
  }
  .next-match-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--bg-elev-2); color: var(--accent);
    display: grid; place-items: center; flex: none;
  }
  .next-match-banner strong, .next-match-banner span { display: block; }
  .next-match-banner span { margin-top: 2px; color: var(--fg-mute); font-size: 12px; }
  @media (max-width: 650px) {
    .next-match-banner { grid-template-columns: auto 1fr; }
    .next-match-banner .btn { grid-column: 1/-1; justify-content: center; }
  }
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
  .match-edit, .match-del {
    width: 22px; height: 22px; border-radius: 4px;
    background: transparent; color: var(--fg-dim); font-size: 13px; line-height: 1;
    flex-shrink: 0;
  }
  .match-edit:hover { background: var(--bg-elev-2); color: var(--accent); }
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
  .team-duplicate, .team-del {
    position: absolute; top: 8px; right: 8px;
    width: 22px; height: 22px; border-radius: 50%;
    background: var(--bg-elev-2); color: var(--fg-dim);
    font-size: 14px; line-height: 1;
    opacity: 0; transition: opacity .15s;
    z-index: 2;
  }
  .team-card-wrap:hover .team-del { opacity: 1; }
  .team-duplicate { right: 38px; }
  .team-duplicate:hover { background: var(--line); color: var(--fg); }
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

  .match-form.form-grid {
    grid-template-columns: 1fr 1fr;
  }
  .scorers-field { margin-top: 14px; }
  .scorers-field-label {
    display: block; font-family: var(--font-cond); font-size: 10px;
    letter-spacing: 1.4px; text-transform: uppercase; color: var(--fg-dim);
    margin-bottom: 6px;
  }
  .scorers-add-row { display: flex; gap: 6px; }
  .scorers-add-row select {
    flex: 1; min-width: 0; background: var(--bg-elev-2); border: 1px solid var(--line);
    border-radius: 6px; padding: 8px 10px; font-size: 13px; color: var(--fg); outline: none;
  }
  .scorers-add-row input {
    width: 56px; background: var(--bg-elev-2); border: 1px solid var(--line);
    border-radius: 6px; padding: 8px 10px; font-size: 13px; color: var(--fg); outline: none;
  }
  .scorers-chip-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .scorer-chip-del { margin-left: 6px; color: var(--fg-dim); }
  .scorer-chip-del:hover { color: var(--accent-2); }
  @media (max-width: 500px) { .match-form.form-grid { grid-template-columns: 1fr; } }
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
