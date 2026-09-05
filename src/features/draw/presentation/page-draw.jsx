// Sorteo de equipos con animación tipo ruleta — persiste asignaciones
function DrawPage() {
  const [roster] = window.useStore("roster", window.DEFAULT_ROSTER);
  const [, setEditorDraft] = window.useStore("editor", null);
  const [state, setState] = window.useStore("draw", {
    numTeams: 2,
    assignments: {}, // { [playerId]: teamIdx }
    locked: {}, // { [playerId]: true }
    source: "roster", // 'roster' | 'temp'
    tempRoster: [], // jugadores generados solo para este sorteo
  });

  const numTeams = state.numTeams;
  const [spinning, setSpinning] = React.useState(false);
  const [currentPick, setCurrentPick] = React.useState(null);
  const [tempName, setTempName] = React.useState("");
  const [tempCount, setTempCount] = React.useState(10);

  const teamColors = ["#e11d48", "#2563eb", "#f59e0b", "#16a34a"];
  const teamKits = ["solid", "stripes", "sash", "halves"];
  const teamNames = ["Rojos", "Azules", "Amarillos", "Verdes"];

  const source = state.source || "roster";
  const tempRoster = state.tempRoster || [];
  const sourceList = source === "temp" ? tempRoster : roster;

  // Derive the working list
  const pool = sourceList.map((p) => ({
    ...p,
    team: state.assignments[p.id] ?? null,
    locked: !!state.locked[p.id],
  }));

  const setSource = (src) => setState((s) => ({ ...s, source: src }));

  const addTempPlayer = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = `tmp${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    setState((s) => ({
      ...s,
      tempRoster: [
        ...(s.tempRoster || []),
        { id, name: trimmed, pos: "-", num: (s.tempRoster || []).length + 1 },
      ],
    }));
  };

  const generateTempPlayers = (n) => {
    const count = Math.max(1, Math.min(40, Number(n) || 0));
    setState((s) => {
      const base = (s.tempRoster || []).length;
      const added = Array.from({ length: count }, (_, i) => ({
        id: `tmp${Date.now()}${Math.random().toString(36).slice(2, 6)}${i}`,
        name: `Jugador ${base + i + 1}`,
        pos: "-",
        num: base + i + 1,
      }));
      return { ...s, tempRoster: [...(s.tempRoster || []), ...added] };
    });
  };

  const removeTempPlayer = (id) => {
    setState((s) => {
      const assignments = { ...s.assignments };
      delete assignments[id];
      const locked = { ...s.locked };
      delete locked[id];
      return {
        ...s,
        tempRoster: (s.tempRoster || []).filter((p) => p.id !== id),
        assignments,
        locked,
      };
    });
  };

  const clearTempRoster = () => {
    setState((s) => {
      const ids = new Set((s.tempRoster || []).map((p) => p.id));
      const assignments = { ...s.assignments };
      const locked = { ...s.locked };
      ids.forEach((id) => {
        delete assignments[id];
        delete locked[id];
      });
      return { ...s, tempRoster: [], assignments, locked };
    });
  };

  const setTeamFor = (id, team) => {
    setState((s) => {
      const assignments = { ...s.assignments };
      const locked = { ...s.locked };
      if (team === null) {
        delete assignments[id];
        delete locked[id];
      } else {
        assignments[id] = team;
        locked[id] = true;
      }
      return { ...s, assignments, locked };
    });
  };

  const toggleLock = (id, team) => {
    setState((s) => {
      const locked = { ...s.locked };
      const assignments = { ...s.assignments };
      if (team === null) {
        delete locked[id];
        delete assignments[id];
      } else {
        locked[id] = true;
        assignments[id] = team;
      }
      return { ...s, locked, assignments };
    });
  };

  const setNumTeams = (n) => setState((s) => ({ ...s, numTeams: n }));

  const spin = () => {
    const unassigned = pool.filter((p) => p.team === null);
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
      pool.forEach((p) => {
        if (p.team !== null && !p.locked) teamSizes[p.team]++;
      });
      const minTeam = teamSizes.indexOf(Math.min(...teamSizes));
      setState((s) => ({
        ...s,
        assignments: { ...s.assignments, [chosen.id]: minTeam },
      }));
      setCurrentPick({ ...chosen, team: minTeam });
      setSpinning(false);
    }, 1800);
  };

  const drawAll = () => {
    const unassigned = pool.filter((p) => p.team === null);
    const shuffled = window.fisherYates(unassigned);
    const teamSizes = Array(numTeams).fill(0);
    pool.forEach((p) => {
      if (p.team !== null) teamSizes[p.team]++;
    });
    const updates = {};
    shuffled.forEach((p) => {
      const minTeam = teamSizes.indexOf(Math.min(...teamSizes));
      updates[p.id] = minTeam;
      teamSizes[minTeam]++;
    });
    setState((s) => ({ ...s, assignments: { ...s.assignments, ...updates } }));
  };

  const reset = () => {
    setState((s) => {
      const assignments = {};
      for (const id of Object.keys(s.locked)) {
        if (s.locked[id]) assignments[id] = s.assignments[id];
      }
      return { ...s, assignments };
    });
  };

  const teams = Array.from({ length: numTeams }, (_, i) =>
    pool.filter((p) => p.team === i),
  );
  const unassigned = pool.filter((p) => p.team === null);

  const [dragOverTeam, setDragOverTeam] = React.useState(null);
  const [dragOverPool, setDragOverPool] = React.useState(false);
  const onDrawDragStart = (e, id) => {
    e.dataTransfer.setData("application/x-draw-player", String(id));
    e.dataTransfer.effectAllowed = "move";
  };
  const onTeamDrop = (e, ti) => {
    e.preventDefault();
    setDragOverTeam(null);
    const id = e.dataTransfer.getData("application/x-draw-player");
    if (id) toggleLock(id, ti);
  };
  const onPoolDrop = (e) => {
    e.preventDefault();
    setDragOverPool(false);
    const id = e.dataTransfer.getData("application/x-draw-player");
    if (id) setTeamFor(id, null);
  };

  const sendToEditor = (ti) => {
    const teamPlayers = teams[ti];
    if (!teamPlayers.length) return window.__toast?.("Ese equipo está vacío");
    if (source === "temp")
      return window.__toast?.(
        "El envío al editor solo funciona con jugadores de tu plantel",
      );
    const modes = [5, 6, 7, 8, 11];
    const mode =
      modes.find(
        (m) => window.FORMATIONS[m][0].positions.length >= teamPlayers.length,
      ) || 11;
    const assignedIds = teamPlayers
      .slice(0, window.FORMATIONS[mode][0].positions.length)
      .map((p) => p.id);
    setEditorDraft({
      teamId: null,
      name: teamNames[ti],
      mode,
      formIdx: 0,
      freeMode: false,
      kit: {
        design: teamKits[ti],
        primary: teamColors[ti],
        secondary: "#0f172a",
      },
      assignedIds,
      freePositions: {},
    });
    window.__toast?.(`${teamNames[ti]} enviado al editor`);
    window.go("editor");
  };

  const sendToRival = (ti) => {
    const teamPlayers = teams[ti];
    if (!teamPlayers.length) return window.__toast?.("Ese equipo está vacío");
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
    const rivalRoster = teamPlayers.map((p) => ({
      id: `rv_${p.id}_${Date.now()}`,
      name: p.name,
    }));
    window.db.save("rival", {
      ...defaults,
      ...current,
      rivalRoster,
      rivalName: teamNames[ti].toUpperCase(),
    });
    window.__toast?.(`${teamNames[ti]} enviado a Modo rival`);
    window.go("rival");
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Sorteo</div>
          <h1 className="page-title">Repartir los pibes</h1>
          <div className="page-sub">
            Fijá algunos jugadores por equipo y sorteá los demás. O sorteá todo
            de una.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="seg">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                className={numTeams === n ? "on" : ""}
                onClick={() => setNumTeams(n)}
              >
                {n} equipos
              </button>
            ))}
          </div>
          <button className="btn" onClick={reset}>
            <Icon name="refresh" size={13} /> Reset
          </button>
          <button className="btn" onClick={drawAll}>
            Sortear todos
          </button>
          <button
            className="btn primary"
            onClick={spin}
            disabled={spinning || unassigned.length === 0}
          >
            {spinning ? (
              "Sorteando..."
            ) : (
              <>
                <Icon name="shuffle" size={14} /> Sortear uno
              </>
            )}
          </button>
        </div>
      </div>

      <div className="seg source-seg">
        <button
          className={source === "roster" ? "on" : ""}
          onClick={() => setSource("roster")}
        >
          Mi plantel
        </button>
        <button
          className={source === "temp" ? "on" : ""}
          onClick={() => setSource("temp")}
        >
          Sorteo desde 0
        </button>
      </div>

      {source === "temp" && (
        <div className="temp-panel">
          <div className="panel-head" style={{ padding: 0, marginBottom: 10 }}>
            <span>Jugadores para este sorteo · {tempRoster.length}</span>
            <span className="chip">No se guardan en tu plantel</span>
          </div>
          <div className="temp-controls">
            <input
              type="text"
              placeholder="Nombre y Enter…"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addTempPlayer(tempName);
                  setTempName("");
                }
              }}
            />
            <button
              className="btn"
              onClick={() => {
                addTempPlayer(tempName);
                setTempName("");
              }}
            >
              + Agregar
            </button>
            <span className="temp-divider">o</span>
            <input
              type="number"
              min="1"
              max="40"
              value={tempCount}
              onChange={(e) => setTempCount(e.target.value)}
              className="temp-count"
            />
            <button
              className="btn"
              onClick={() => generateTempPlayers(tempCount)}
            >
              Generar genéricos
            </button>
            {tempRoster.length > 0 && (
              <button className="btn ghost" onClick={clearTempRoster}>
                Vaciar lista
              </button>
            )}
          </div>
          {tempRoster.length > 0 && (
            <div className="pool-chips" style={{ marginTop: 10 }}>
              {tempRoster.map((p) => (
                <div key={p.id} className="pool-chip">
                  <div
                    className="pool-chip-avatar"
                    style={{ background: window.colorFor(p.name) }}
                  >
                    {window.initials(p.name)}
                  </div>
                  <span>{p.name}</span>
                  <button
                    className="temp-remove"
                    onClick={() => removeTempPlayer(p.id)}
                    title="Quitar"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className={`spinner-display ${spinning ? "on" : ""} ${currentPick && !spinning ? "just-picked" : ""}`}
      >
        {currentPick ? (
          <>
            <div
              className="spinner-avatar"
              style={{ background: window.colorFor(currentPick.name) }}
            >
              {window.initials(currentPick.name)}
            </div>
            <div className="spinner-name">{currentPick.name}</div>
            {!spinning &&
              currentPick.team !== null &&
              currentPick.team !== undefined && (
                <div
                  className="spinner-to"
                  style={{ color: teamColors[currentPick.team] }}
                >
                  → equipo {teamNames[currentPick.team]}
                </div>
              )}
            {spinning && <div className="spinner-to dim">girando...</div>}
          </>
        ) : (
          <div className="spinner-empty">
            Tocá "Sortear uno" para girar la ruleta
          </div>
        )}
      </div>

      <div
        className="draw-grid"
        style={{ gridTemplateColumns: `repeat(${numTeams}, 1fr)` }}
      >
        {teams.map((team, ti) => (
          <div
            key={ti}
            className={`team-column ${dragOverTeam === ti ? "drag-over" : ""}`}
            style={{ "--teamcolor": teamColors[ti] }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverTeam(ti);
            }}
            onDragLeave={() => setDragOverTeam((t) => (t === ti ? null : t))}
            onDrop={(e) => onTeamDrop(e, ti)}
          >
            <div className="team-col-head">
              <Kit
                design={teamKits[ti]}
                primary={teamColors[ti]}
                secondary="#0f172a"
                size={44}
                showNumber={false}
              />
              <div>
                <div className="team-col-name">{teamNames[ti]}</div>
                <div className="team-col-sub">{team.length} jugadores</div>
              </div>
              <div className="team-col-actions">
                <button
                  className="team-to-editor"
                  onClick={() => sendToEditor(ti)}
                  title="Enviar al editor de alineación"
                >
                  <Icon name="editorNav" size={13} />
                </button>
                <button
                  className="team-to-editor"
                  onClick={() => sendToRival(ti)}
                  title="Enviar a Modo rival"
                >
                  <Icon name="target" size={13} />
                </button>
              </div>
            </div>
            <div className="team-col-list">
              {team.map((p) => (
                <div
                  key={p.id}
                  className={`draw-card ${p.locked ? "locked" : ""}`}
                  draggable
                  onDragStart={(e) => onDrawDragStart(e, p.id)}
                >
                  <div
                    className="draw-avatar"
                    style={{ background: window.colorFor(p.name) }}
                  >
                    {window.initials(p.name)}
                  </div>
                  <div className="draw-info">
                    <div className="draw-name">{p.name}</div>
                    <div className="draw-sub">
                      <span className="pos-tag">{p.pos}</span> #{p.num}
                    </div>
                  </div>
                  <button
                    className="lock-btn"
                    onClick={() => toggleLock(p.id, p.locked ? null : ti)}
                    title={p.locked ? "Desfijar" : "Fijar"}
                  >
                    <Icon name={p.locked ? "lock" : "refresh"} size={13} />
                  </button>
                  <button
                    className="lock-btn"
                    onClick={() => setTeamFor(p.id, null)}
                    title="Sacar del equipo"
                  >
                    ×
                  </button>
                </div>
              ))}
              {team.length === 0 && (
                <div className="col-empty">vacío · arrastrá jugadores acá</div>
              )}
              <button
                className="col-add"
                onClick={() => {
                  if (unassigned.length) toggleLock(unassigned[0].id, ti);
                }}
              >
                + fijar jugador
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`pool-card ${dragOverPool ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverPool(true);
        }}
        onDragLeave={() => setDragOverPool(false)}
        onDrop={onPoolDrop}
      >
        <div className="panel-head" style={{ padding: 0, marginBottom: 10 }}>
          <span>Sin asignar · {unassigned.length}</span>
          <span className="chip">
            Arrastrá a un equipo, tocá un número, o sorteá
          </span>
        </div>
        <div className="pool-chips">
          {unassigned.map((p) => (
            <div
              key={p.id}
              className="pool-chip"
              draggable
              onDragStart={(e) => onDrawDragStart(e, p.id)}
            >
              <div
                className="pool-chip-avatar"
                style={{ background: window.colorFor(p.name) }}
              >
                {window.initials(p.name)}
              </div>
              <span>{p.name}</span>
              <div className="pool-chip-assign">
                {Array.from({ length: numTeams }).map((_, ti) => (
                  <button
                    key={ti}
                    style={{ background: teamColors[ti] }}
                    onClick={() => toggleLock(p.id, ti)}
                    title={`Fijar en ${teamNames[ti]}`}
                  >
                    {ti + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {unassigned.length === 0 && (
            <div className="col-empty">
              Todos los jugadores ya están asignados ✓
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.mountPage("page-draw", <DrawPage />);
