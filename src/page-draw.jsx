// Sorteo de equipos con animación tipo ruleta — persiste asignaciones
function DrawPage() {
  const [roster] = window.useStore('roster', window.DEFAULT_ROSTER);
  const [state, setState] = window.useStore('draw', {
    numTeams: 2,
    assignments: {}, // { [playerId]: teamIdx }
    locked:      {}, // { [playerId]: true }
  });

  const numTeams = state.numTeams;
  const [spinning, setSpinning] = React.useState(false);
  const [currentPick, setCurrentPick] = React.useState(null);

  const teamColors = ["#e11d48", "#2563eb", "#f59e0b", "#16a34a"];
  const teamKits = ["solid", "stripes", "sash", "halves"];
  const teamNames = ["Rojos", "Azules", "Amarillos", "Verdes"];

  // Derive the working list
  const pool = roster.map(p => ({
    ...p,
    team: state.assignments[p.id] ?? null,
    locked: !!state.locked[p.id],
  }));

  const setTeamFor = (id, team) => {
    setState(s => {
      const assignments = { ...s.assignments };
      const locked = { ...s.locked };
      if (team === null) { delete assignments[id]; delete locked[id]; }
      else { assignments[id] = team; locked[id] = true; }
      return { ...s, assignments, locked };
    });
  };

  const toggleLock = (id, team) => {
    setState(s => {
      const locked = { ...s.locked };
      const assignments = { ...s.assignments };
      if (team === null) { delete locked[id]; delete assignments[id]; }
      else { locked[id] = true; assignments[id] = team; }
      return { ...s, locked, assignments };
    });
  };

  const setNumTeams = (n) => setState(s => ({ ...s, numTeams: n }));

  const spin = () => {
    const unassigned = pool.filter(p => p.team === null);
    if (unassigned.length === 0) return;
    setSpinning(true);
    let i = 0;
    const spinInterval = setInterval(() => {
      setCurrentPick(unassigned[i % unassigned.length]);
      i++;
    }, 80);
    setTimeout(() => {
      clearInterval(spinInterval);
      const chosen = unassigned[Math.floor(Math.random() * unassigned.length)];
      const teamSizes = Array(numTeams).fill(0);
      pool.forEach(p => { if (p.team !== null && !p.locked) teamSizes[p.team]++; });
      const minTeam = teamSizes.indexOf(Math.min(...teamSizes));
      setState(s => ({ ...s, assignments: { ...s.assignments, [chosen.id]: minTeam } }));
      setCurrentPick({ ...chosen, team: minTeam });
      setSpinning(false);
    }, 1800);
  };

  const drawAll = () => {
    const unassigned = pool.filter(p => p.team === null);
    const shuffled = [...unassigned].sort(() => Math.random() - 0.5);
    const teamSizes = Array(numTeams).fill(0);
    pool.forEach(p => { if (p.team !== null) teamSizes[p.team]++; });
    const updates = {};
    shuffled.forEach(p => {
      const minTeam = teamSizes.indexOf(Math.min(...teamSizes));
      updates[p.id] = minTeam;
      teamSizes[minTeam]++;
    });
    setState(s => ({ ...s, assignments: { ...s.assignments, ...updates } }));
  };

  const reset = () => {
    setState(s => {
      const assignments = {};
      for (const id of Object.keys(s.locked)) {
        if (s.locked[id]) assignments[id] = s.assignments[id];
      }
      return { ...s, assignments };
    });
  };

  const teams = Array.from({length: numTeams}, (_, i) => pool.filter(p => p.team === i));
  const unassigned = pool.filter(p => p.team === null);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Sorteo</div>
          <h1 className="page-title">Repartir los pibes</h1>
          <div className="page-sub">Fijá algunos jugadores por equipo y sorteá los demás. O sorteá todo de una.</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <div className="seg">
            {[2,3,4].map(n => (
              <button key={n} className={numTeams===n?"on":""} onClick={()=>setNumTeams(n)}>{n} equipos</button>
            ))}
          </div>
          <button className="btn" onClick={reset}>↺ Reset</button>
          <button className="btn" onClick={drawAll}>Sortear todos</button>
          <button className="btn primary" onClick={spin} disabled={spinning || unassigned.length===0}>
            {spinning ? "Sorteando..." : "🎰 Sortear uno"}
          </button>
        </div>
      </div>

      <div className={`spinner-display ${spinning ? 'on':''} ${currentPick && !spinning ? 'just-picked':''}`}>
        {currentPick ? (
          <>
            <div className="spinner-avatar" style={{background: window.colorFor(currentPick.name)}}>
              {window.initials(currentPick.name)}
            </div>
            <div className="spinner-name">{currentPick.name}</div>
            {!spinning && currentPick.team !== null && currentPick.team !== undefined && (
              <div className="spinner-to" style={{color: teamColors[currentPick.team]}}>
                → equipo {teamNames[currentPick.team]}
              </div>
            )}
            {spinning && <div className="spinner-to dim">girando...</div>}
          </>
        ) : (
          <div className="spinner-empty">Tocá "Sortear uno" para girar la ruleta</div>
        )}
      </div>

      <div className="draw-grid" style={{gridTemplateColumns: `repeat(${numTeams}, 1fr)`}}>
        {teams.map((team, ti) => (
          <div key={ti} className="team-column" style={{'--teamcolor': teamColors[ti]}}>
            <div className="team-col-head">
              <Kit design={teamKits[ti]} primary={teamColors[ti]} secondary="#0f172a" size={44} showNumber={false}/>
              <div>
                <div className="team-col-name">{teamNames[ti]}</div>
                <div className="team-col-sub">{team.length} jugadores</div>
              </div>
            </div>
            <div className="team-col-list">
              {team.map(p => (
                <div key={p.id} className={`draw-card ${p.locked?'locked':''}`}>
                  <div className="draw-avatar" style={{background: window.colorFor(p.name)}}>{window.initials(p.name)}</div>
                  <div className="draw-info">
                    <div className="draw-name">{p.name}</div>
                    <div className="draw-sub"><span className="pos-tag">{p.pos}</span> #{p.num}</div>
                  </div>
                  <button className="lock-btn" onClick={()=>toggleLock(p.id, p.locked ? null : ti)}
                          title={p.locked?"Desfijar":"Fijar"}>
                    {p.locked ? "🔒" : "⟳"}
                  </button>
                  <button className="lock-btn" onClick={()=>setTeamFor(p.id, null)} title="Sacar del equipo">×</button>
                </div>
              ))}
              {team.length === 0 && <div className="col-empty">vacío</div>}
              <button className="col-add" onClick={()=>{
                if (unassigned.length) toggleLock(unassigned[0].id, ti);
              }}>+ fijar jugador</button>
            </div>
          </div>
        ))}
      </div>

      <div className="pool-card">
        <div className="panel-head" style={{padding:0, marginBottom:10}}>
          <span>Sin asignar · {unassigned.length}</span>
          <span className="chip">Tocá un número para fijar, o sorteá</span>
        </div>
        <div className="pool-chips">
          {unassigned.map(p => (
            <div key={p.id} className="pool-chip">
              <div className="pool-chip-avatar" style={{background: window.colorFor(p.name)}}>{window.initials(p.name)}</div>
              <span>{p.name}</span>
              <div className="pool-chip-assign">
                {Array.from({length: numTeams}).map((_, ti) => (
                  <button key={ti}
                    style={{background: teamColors[ti]}}
                    onClick={()=>toggleLock(p.id, ti)}
                    title={`Fijar en ${teamNames[ti]}`}>
                    {ti+1}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {unassigned.length === 0 && <div className="col-empty">Todos los jugadores ya están asignados ✓</div>}
        </div>
      </div>
    </div>
  );
}

const drawCSS = document.createElement("style");
drawCSS.textContent = `
  .spinner-display {
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    padding: 20px 24px;
    margin-bottom: 24px;
    display: flex; align-items: center; gap: 20px;
    min-height: 92px;
    position: relative; overflow: hidden;
    transition: transform .3s, border-color .3s;
  }
  .spinner-display.on {
    border-color: var(--accent);
    animation: pulse 1.6s ease;
  }
  .spinner-display.just-picked {
    border-color: var(--accent);
  }
  @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 transparent} 50%{box-shadow:0 0 0 8px color-mix(in oklch, var(--accent) 20%, transparent)} }
  .spinner-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    display: grid; place-items: center;
    color: #fff; font-family: var(--font-cond); font-weight: 700; font-size: 20px;
    transition: transform .2s;
  }
  .spinner-display.on .spinner-avatar { animation: shake .08s infinite alternate; }
  @keyframes shake { to { transform: translateX(2px) rotate(2deg); } }
  .spinner-name {
    font-family: var(--font-display);
    font-size: 40px; letter-spacing: 1px;
    line-height: 1;
  }
  .spinner-to {
    font-family: var(--font-cond);
    text-transform: uppercase; letter-spacing: 1.4px;
    font-size: 13px; font-weight: 700;
    margin-left: auto;
  }
  .spinner-to.dim { color: var(--fg-dim); }
  .spinner-empty { color: var(--fg-dim); font-size: 13px; }

  .draw-grid {
    display: grid; gap: 14px; margin-bottom: 24px;
  }
  .team-column {
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-top: 3px solid var(--teamcolor);
    border-radius: var(--radius);
    padding: 14px;
  }
  .team-col-head {
    display: flex; align-items: center; gap: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line-soft);
    margin-bottom: 10px;
  }
  .team-col-name {
    font-family: var(--font-display);
    font-size: 22px; letter-spacing: 1px; line-height: 1;
  }
  .team-col-sub {
    font-family: var(--font-mono); font-size: 11px;
    color: var(--fg-dim); margin-top: 2px;
  }
  .team-col-list { display: flex; flex-direction: column; gap: 4px; }

  .draw-card {
    display: flex; align-items: center; gap: 10px;
    padding: 8px;
    background: var(--bg-elev-2);
    border: 1px solid transparent;
    border-radius: 6px;
    animation: dropin .3s ease;
  }
  @keyframes dropin {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .draw-card.locked { border-color: var(--teamcolor); }
  .draw-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    display: grid; place-items: center;
    color: #fff; font-weight: 700; font-size: 11px;
    font-family: var(--font-cond); flex-shrink: 0;
  }
  .draw-info { flex: 1; min-width: 0; }
  .draw-name { font-size: 13px; font-weight: 500; }
  .draw-sub { display: flex; gap: 6px; font-size: 11px; color: var(--fg-dim); align-items: center; }
  .lock-btn {
    width: 24px; height: 24px; border-radius: 4px;
    background: transparent;
    font-size: 12px; color: var(--fg-mute);
  }
  .lock-btn:hover { background: var(--line); color: var(--fg); }

  .col-empty {
    padding: 12px; text-align: center;
    color: var(--fg-dim); font-family: var(--font-mono); font-size: 11px;
  }
  .col-add {
    padding: 6px; border: 1px dashed var(--line); border-radius: 4px;
    color: var(--fg-dim); font-size: 11px;
    background: transparent; margin-top: 4px;
  }
  .col-add:hover { border-color: var(--accent); color: var(--accent); }

  .pool-card {
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    padding: 16px;
  }
  .pool-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .pool-chip {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 6px 4px 4px;
    background: var(--bg-elev-2);
    border: 1px solid var(--line);
    border-radius: 99px;
    font-size: 12px;
  }
  .pool-chip-avatar {
    width: 22px; height: 22px; border-radius: 50%;
    display: grid; place-items: center;
    color: #fff; font-weight: 700; font-size: 9px;
    font-family: var(--font-cond);
  }
  .pool-chip-assign { display: flex; gap: 2px; margin-left: 4px; }
  .pool-chip-assign button {
    width: 18px; height: 18px; border-radius: 4px;
    color: #fff; font-size: 10px; font-weight: 700;
    opacity: .7;
  }
  .pool-chip-assign button:hover { opacity: 1; }
`;
document.head.appendChild(drawCSS);

ReactDOM.createRoot(document.getElementById("page-draw")).render(<DrawPage/>);
