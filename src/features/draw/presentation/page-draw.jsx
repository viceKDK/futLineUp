// Draw presentation: state wiring + DOM only. Balancing rules live in domain/team-balancer.js.
function DrawPage() {
  const [roster] = window.useStore("roster", window.DEFAULT_ROSTER);
  const [, setEditorDraft] = window.useStore("editor", null);
  const [state, setState] = window.useStore("draw", {
    numTeams: 2,
    assignments: {},
    locked: {},
    source: "roster",
    tempRoster: [],
    strategy: "count",
  });
  const [spinning, setSpinning] = React.useState(false);
  const [currentPick, setCurrentPick] = React.useState(null);
  const [tempName, setTempName] = React.useState("");
  const [tempCount, setTempCount] = React.useState(10);
  const [dragOverTeam, setDragOverTeam] = React.useState(null);
  const [dragOverPool, setDragOverPool] = React.useState(false);

  const numTeams = state.numTeams;
  const source = state.source || "roster";
  const sourceList = source === "temp" ? state.tempRoster || [] : roster;
  const teamColors = ["#e11d48", "#2563eb", "#f59e0b", "#16a34a"];
  const teamKits = ["solid", "stripes", "sash", "halves"];
  const teamNames = ["Rojos", "Azules", "Amarillos", "Verdes"];
  const pool = sourceList.map((player) => ({
    ...player,
    team: state.assignments[player.id] ?? null,
    locked: !!state.locked[player.id],
  }));
  const teams = window.fcDrawDomain.groupAssignments(
    pool,
    Object.fromEntries(pool.filter((player) => player.team != null).map((player) => [player.id, player.team])),
    numTeams,
  );
  const unassigned = pool.filter((player) => player.team == null);

  const patchState = (patch) => setState((current) => ({ ...current, ...patch }));
  const idFactory = (prefix = "tmp") => `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;

  const setTeamFor = (id, team, { lock = true } = {}) => {
    setState((current) => {
      const assignments = { ...current.assignments }, locked = { ...current.locked };
      if (team == null) {
        delete assignments[id];
        delete locked[id];
      } else {
        assignments[id] = team;
        if (lock) locked[id] = true;
        else delete locked[id];
      }
      return { ...current, assignments, locked };
    });
  };

  const addTempPlayer = (name) => {
    const clean = name.trim();
    if (!clean) return;
    setState((current) => ({
      ...current,
      tempRoster: [
        ...(current.tempRoster || []),
        { id: idFactory(), name: clean, pos: "-", num: (current.tempRoster || []).length + 1 },
      ],
    }));
  };

  const generateTempPlayers = (value) => {
    const count = Math.max(1, Math.min(40, Number(value) || 0));
    setState((current) => {
      const base = (current.tempRoster || []).length;
      const added = Array.from({ length: count }, (_, index) => ({
        id: idFactory(`tmp${index}-`),
        name: `Jugador ${base + index + 1}`,
        pos: "-",
        num: base + index + 1,
      }));
      return { ...current, tempRoster: [...(current.tempRoster || []), ...added] };
    });
  };

  const removeTempPlayer = (id) => {
    setState((current) => {
      const assignments = { ...current.assignments }, locked = { ...current.locked };
      delete assignments[id];
      delete locked[id];
      return { ...current, tempRoster: (current.tempRoster || []).filter((player) => player.id !== id), assignments, locked };
    });
  };

  const clearTempRoster = () => {
    const ids = new Set((state.tempRoster || []).map((player) => player.id));
    setState((current) => ({
      ...current,
      tempRoster: [],
      assignments: Object.fromEntries(Object.entries(current.assignments).filter(([id]) => !ids.has(id))),
      locked: Object.fromEntries(Object.entries(current.locked).filter(([id]) => !ids.has(id))),
    }));
  };

  const drawAll = () => {
    try {
      const assignments = window.fcDrawDomain.createTeamBalancer().balance(
        state.strategy || "count",
        sourceList,
        { assignments: state.assignments, locked: state.locked, numTeams },
      );
      patchState({ assignments });
    } catch (error) {
      window.__toast?.(error.message || "No se pudo realizar el sorteo");
    }
  };

  const spin = () => {
    if (!unassigned.length || spinning) return;
    setSpinning(true);
    let index = 0;
    const interval = setInterval(() => {
      setCurrentPick(unassigned[index % unassigned.length]);
      index += 1;
    }, 80);
    setTimeout(() => {
      clearInterval(interval);
      const chosen = unassigned[Math.floor(Math.random() * unassigned.length)];
      const hypothetical = window.fcDrawDomain.countBalance(
        sourceList.filter((player) => player.id === chosen.id || state.assignments[player.id] != null),
        { assignments: state.assignments, locked: state.locked, numTeams },
      );
      const team = hypothetical[chosen.id];
      setTeamFor(chosen.id, team, { lock: false });
      setCurrentPick({ ...chosen, team });
      setSpinning(false);
    }, 1800);
  };

  const reset = () => {
    const assignments = Object.fromEntries(
      Object.keys(state.locked || {})
        .filter((id) => state.locked[id] && state.assignments[id] != null)
        .map((id) => [id, state.assignments[id]]),
    );
    patchState({ assignments });
  };

  const sendToEditor = (teamIndex) => {
    const players = teams[teamIndex];
    if (!players.length) return window.__toast?.("Ese equipo está vacío");
    if (source === "temp") return window.__toast?.("El envío al editor solo funciona con jugadores de tu plantel");
    const mode = window.fcLineup.chooseModeForPlayerCount(players.length, window.FORMATIONS);
    setEditorDraft({
      teamId: null,
      name: teamNames[teamIndex],
      mode,
      formIdx: 0,
      freeMode: false,
      kit: { design: teamKits[teamIndex], primary: teamColors[teamIndex], secondary: "#0f172a" },
      assignedIds: players.slice(0, window.FORMATIONS[mode][0].positions.length).map((player) => player.id),
      freePositions: {},
    });
    window.__toast?.(`${teamNames[teamIndex]} enviado al editor`);
    window.go("editor");
  };

  const sendToRival = (teamIndex) => {
    const players = teams[teamIndex];
    if (!players.length) return window.__toast?.("Ese equipo está vacío");
    const defaults = {
      myMode: 11,
      myForm: 0,
      rivalForm: 1,
      myKit: { design: "stripes", primary: "#3b82f6", secondary: "#ffffff" },
      rivalKit: { design: "solid", primary: "#eab308", secondary: "#16a34a" },
      rivalRoster: [],
      rivalName: "LOS VISITANTES",
    };
    const current = window.db.load("rival", defaults);
    window.db.save("rival", {
      ...defaults,
      ...current,
      rivalRoster: players.map((player) => ({ id: `rv_${player.id}_${Date.now()}`, name: player.name })),
      rivalName: teamNames[teamIndex].toUpperCase(),
    });
    window.__toast?.(`${teamNames[teamIndex]} enviado a Modo rival`);
    window.go("rival");
  };

  const onDragStart = (event, id) => {
    event.dataTransfer.setData("application/x-draw-player", String(id));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Sorteo</div>
          <h1 className="page-title">Repartir los pibes</h1>
          <div className="page-sub">Fijá jugadores, elegí estrategia y sorteá el resto.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div className="seg">
            {[2, 3, 4].map((value) => (
              <button key={value} className={numTeams === value ? "on" : ""} onClick={() => patchState({ numTeams: value })}>
                {value} equipos
              </button>
            ))}
          </div>
          <div className="seg">
            <button className={(state.strategy || "count") === "count" ? "on" : ""} onClick={() => patchState({ strategy: "count" })}>Cantidad</button>
            <button className={state.strategy === "rating" ? "on" : ""} onClick={() => patchState({ strategy: "rating" })}>Rating</button>
          </div>
          <button className="btn" onClick={reset}><Icon name="refresh" size={13} /> Reset</button>
          <button className="btn" onClick={drawAll}>Sortear todos</button>
          <button className="btn primary" onClick={spin} disabled={spinning || !unassigned.length}>
            {spinning ? "Sorteando..." : <><Icon name="shuffle" size={14} /> Sortear uno</>}
          </button>
        </div>
      </div>

      <div className="seg source-seg">
        <button className={source === "roster" ? "on" : ""} onClick={() => patchState({ source: "roster" })}>Mi plantel</button>
        <button className={source === "temp" ? "on" : ""} onClick={() => patchState({ source: "temp" })}>Sorteo desde 0</button>
      </div>

      {source === "temp" && (
        <div className="temp-panel">
          <div className="panel-head" style={{ padding: 0, marginBottom: 10 }}>
            <span>Jugadores para este sorteo · {(state.tempRoster || []).length}</span>
            <span className="chip">No se guardan en tu plantel</span>
          </div>
          <div className="temp-controls">
            <input value={tempName} placeholder="Nombre y Enter…" onChange={(event) => setTempName(event.target.value)} onKeyDown={(event) => {
              if (event.key === "Enter") { addTempPlayer(tempName); setTempName(""); }
            }} />
            <button className="btn" onClick={() => { addTempPlayer(tempName); setTempName(""); }}>+ Agregar</button>
            <span className="temp-divider">o</span>
            <input className="temp-count" type="number" min="1" max="40" value={tempCount} onChange={(event) => setTempCount(event.target.value)} />
            <button className="btn" onClick={() => generateTempPlayers(tempCount)}>Generar genéricos</button>
            {!!(state.tempRoster || []).length && <button className="btn ghost" onClick={clearTempRoster}>Vaciar lista</button>}
          </div>
          <div className="pool-chips" style={{ marginTop: 10 }}>
            {(state.tempRoster || []).map((player) => (
              <div key={player.id} className="pool-chip">
                <div className="pool-chip-avatar" style={{ background: window.colorFor(player.name) }}>{window.initials(player.name)}</div>
                <span>{player.name}</span>
                <button className="temp-remove" onClick={() => removeTempPlayer(player.id)} title="Quitar">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`spinner-display ${spinning ? "on" : ""} ${currentPick && !spinning ? "just-picked" : ""}`}>
        {currentPick ? <>
          <div className="spinner-avatar" style={{ background: window.colorFor(currentPick.name) }}>{window.initials(currentPick.name)}</div>
          <div className="spinner-name">{currentPick.name}</div>
          {!spinning && currentPick.team != null && <div className="spinner-to" style={{ color: teamColors[currentPick.team] }}>→ equipo {teamNames[currentPick.team]}</div>}
          {spinning && <div className="spinner-to dim">girando...</div>}
        </> : <div className="spinner-empty">Tocá "Sortear uno" para girar la ruleta</div>}
      </div>

      <div className="draw-grid" style={{ gridTemplateColumns: `repeat(${numTeams}, 1fr)` }}>
        {teams.map((team, teamIndex) => (
          <div key={teamIndex} className={`team-column ${dragOverTeam === teamIndex ? "drag-over" : ""}`} style={{ "--teamcolor": teamColors[teamIndex] }}
            onDragOver={(event) => { event.preventDefault(); setDragOverTeam(teamIndex); }}
            onDragLeave={() => setDragOverTeam((value) => value === teamIndex ? null : value)}
            onDrop={(event) => { event.preventDefault(); setDragOverTeam(null); const id = event.dataTransfer.getData("application/x-draw-player"); if (id) setTeamFor(id, teamIndex); }}>
            <div className="team-col-head">
              <Kit design={teamKits[teamIndex]} primary={teamColors[teamIndex]} secondary="#0f172a" size={44} showNumber={false} />
              <div><div className="team-col-name">{teamNames[teamIndex]}</div><div className="team-col-sub">{team.length} jugadores</div></div>
              <div className="team-col-actions">
                <button className="team-to-editor" onClick={() => sendToEditor(teamIndex)} title="Enviar al editor"><Icon name="editorNav" size={13} /></button>
                <button className="team-to-editor" onClick={() => sendToRival(teamIndex)} title="Enviar a Modo rival"><Icon name="target" size={13} /></button>
              </div>
            </div>
            <div className="team-col-list">
              {team.map((player) => (
                <div key={player.id} className={`draw-card ${player.locked ? "locked" : ""}`} draggable onDragStart={(event) => onDragStart(event, player.id)}>
                  <div className="draw-avatar" style={{ background: window.colorFor(player.name) }}>{window.initials(player.name)}</div>
                  <div className="draw-info"><div className="draw-name">{player.name}</div><div className="draw-sub"><span className="pos-tag">{player.pos}</span> #{player.num}</div></div>
                  <button className="lock-btn" onClick={() => setTeamFor(player.id, player.locked ? null : teamIndex)} title={player.locked ? "Desfijar" : "Fijar"}><Icon name={player.locked ? "lock" : "refresh"} size={13} /></button>
                  <button className="lock-btn" onClick={() => setTeamFor(player.id, null)} title="Sacar del equipo">×</button>
                </div>
              ))}
              {!team.length && <div className="col-empty">vacío · arrastrá jugadores acá</div>}
              <button className="col-add" onClick={() => unassigned[0] && setTeamFor(unassigned[0].id, teamIndex)}>+ fijar jugador</button>
            </div>
          </div>
        ))}
      </div>

      <div className={`pool-card ${dragOverPool ? "drag-over" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragOverPool(true); }}
        onDragLeave={() => setDragOverPool(false)}
        onDrop={(event) => { event.preventDefault(); setDragOverPool(false); const id = event.dataTransfer.getData("application/x-draw-player"); if (id) setTeamFor(id, null); }}>
        <div className="panel-head" style={{ padding: 0, marginBottom: 10 }}><span>Sin asignar · {unassigned.length}</span><span className="chip">Arrastrá, tocá un número o sorteá</span></div>
        <div className="pool-chips">
          {unassigned.map((player) => (
            <div key={player.id} className="pool-chip" draggable onDragStart={(event) => onDragStart(event, player.id)}>
              <div className="pool-chip-avatar" style={{ background: window.colorFor(player.name) }}>{window.initials(player.name)}</div>
              <span>{player.name}</span>
              <div className="pool-chip-assign">
                {Array.from({ length: numTeams }, (_, teamIndex) => <button key={teamIndex} style={{ background: teamColors[teamIndex] }} onClick={() => setTeamFor(player.id, teamIndex)} title={`Fijar en ${teamNames[teamIndex]}`}>{teamIndex + 1}</button>)}
              </div>
            </div>
          ))}
          {!unassigned.length && <div className="col-empty">Todos los jugadores ya están asignados ✓</div>}
        </div>
      </div>
    </div>
  );
}

window.mountPage("page-draw", <DrawPage />);
