// Home / Mis equipos — stats derivadas de partidos reales
function HomePage() {
  const [teams, setTeams] = window.useStore(
    "teams",
    window.DEFAULT_SAVED_TEAMS,
  );
  const [profile] = window.useStore("profile", window.DEFAULT_PROFILE);
  const [roster] = window.useStore("roster", window.DEFAULT_ROSTER);
  const [matches, setMatches] = window.useStore("matches", []);
  const [matchInfo] = window.useStore("matchInfo", null);
  const [, setDraft] = window.useStore("editor", null);
  const [filter, setFilter] = React.useState("all");
  const [modal, setModal] = React.useState(null);

  const loadTeam = (t) => {
    const fIdx = (window.FORMATIONS[t.mode] || []).findIndex(
      (f) => f.name === t.formation,
    );
    setDraft({
      teamId: t.id,
      name: t.name,
      mode: t.mode,
      formIdx: Math.max(0, fIdx),
      freeMode: !!t.freeMode,
      kit: {
        design: t.kit,
        primary: t.color,
        secondary: t.secondary || "#0f172a",
      },
      assignedIds: (t.assignedIds || []).slice(),
      freePositions: { ...(t.freePositions || {}) },
      captainId: t.captainId || null,
      substituteIds: (t.substituteIds || []).slice(),
    });
    window.go("editor");
  };

  const deleteTeam = (t) => {
    if (!confirm(`¿Borrar "${t.name}"?`)) return;
    setTeams((prev) => prev.filter((x) => x.id !== t.id));
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
    setTeams((prev) => [...prev, copy]);
    window.__toast?.("Equipo duplicado");
  };
  const filtered = teams.filter((t) =>
    filter === "all" ? true : t.mode === parseInt(filter, 10),
  );

  // Stats derivadas
  const lastMatch = matches.length ? matches[matches.length - 1] : null;
  const lastResult = lastMatch ? `${lastMatch.us}–${lastMatch.them}` : "—";

  const topScorers = React.useMemo(() => {
    const totals = {};
    matches.forEach((m) =>
      (m.scorers || []).forEach((s) => {
        if (!s.playerId || !s.goals) return;
        totals[s.playerId] = (totals[s.playerId] || 0) + Number(s.goals);
      }),
    );
    return Object.entries(totals)
      .map(([playerId, goals]) => ({
        player: roster.find(
          (p) => p.id === Number(playerId) || p.id === playerId,
        ),
        goals,
      }))
      .filter((x) => x.player)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 5);
  }, [matches, roster]);

  return (
    <div>
      <GuestModeBanner />
      <NextMatchBanner matchInfo={matchInfo} />
      <div className="page-head">
        <div>
          <div className="page-kicker">
            {profile.season ||
              (profile.experience === "coach"
                ? "Modo entrenador"
                : profile.experience === "league"
                  ? "Modo liga"
                  : "Tu fútbol, a tu manera")}
          </div>
          <h1 className="page-title">Mis equipos</h1>
          <div className="page-sub">
            Armá la alineación, sorteá pibes, elegí la camiseta. Todo en un solo
            lado.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => setModal({ type: "match" })}>
            + Resultado
          </button>
          <button className="btn" onClick={() => window.go("draw")}>
            Sortear ahora
          </button>
          <button className="btn primary" onClick={() => window.go("mode")}>
            + Nuevo equipo
          </button>
        </div>
      </div>

      <div className="hero-strip">
        <div className="hero-stat">
          <div className="hero-stat-n">
            {String(teams.length).padStart(2, "0")}
          </div>
          <div className="hero-stat-l">equipos</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-n">{roster.length}</div>
          <div className="hero-stat-l">jugadores en plantel</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-n">
            {String(matches.length).padStart(2, "0")}
          </div>
          <div className="hero-stat-l">partidos jugados</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-n">{lastResult}</div>
          <div className="hero-stat-l">
            {lastMatch ? `vs ${lastMatch.opponent}` : "último resultado"}
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
            {matches
              .slice(-6)
              .reverse()
              .map((m) => {
                const team = teams.find((t) => t.id === m.teamId);
                const won = m.us > m.them,
                  tied = m.us === m.them;
                return (
                  <div key={m.id} className="match-chip">
                    <div
                      className={`match-result ${won ? "win" : tied ? "tie" : "loss"}`}
                    >
                      {m.us}–{m.them}
                    </div>
                    <div className="match-info">
                      <div className="match-team">
                        {team?.name || "Mi equipo"}
                      </div>
                      <div className="match-opp">vs {m.opponent}</div>
                    </div>
                    <button
                      className="match-edit"
                      onClick={() => setModal({ type: "match", match: m })}
                      title="Editar"
                    >
                      ✎
                    </button>
                    <button
                      className="match-del"
                      onClick={() => {
                        if (!confirm("¿Eliminar este resultado?")) return;
                        setMatches((prev) => prev.filter((x) => x.id !== m.id));
                      }}
                      title="Borrar"
                      aria-label={`Eliminar resultado contra ${m.opponent}`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {topScorers.length > 0 && (
        <div className="scorers-card">
          <div className="panel-head-row">
            <span>Goleadores</span>
            <span className="chip">Basado en tus partidos cargados</span>
          </div>
          <div className="scorers-list">
            {topScorers.map((s, i) => (
              <div key={s.player.id} className="scorer-row">
                <span className="scorer-pos">{i + 1}</span>
                <div
                  className="mini-avatar"
                  style={{ background: window.colorFor(s.player.name) }}
                >
                  {window.initials(s.player.name)}
                </div>
                <span className="scorer-name">{s.player.name}</span>
                <span className="scorer-goals">
                  {s.goals} gol{s.goals === 1 ? "" : "es"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-head">
        <h2>Equipos guardados</h2>
        <div className="filters">
          <button
            className={`chip ${filter === "all" ? "lime" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todos
          </button>
          <button
            className={`chip ${filter === "5" ? "lime" : ""}`}
            onClick={() => setFilter("5")}
          >
            Fut 5
          </button>
          <button
            className={`chip ${filter === "7" ? "lime" : ""}`}
            onClick={() => setFilter("7")}
          >
            Fut 7
          </button>
          <button
            className={`chip ${filter === "11" ? "lime" : ""}`}
            onClick={() => setFilter("11")}
          >
            Fut 11
          </button>
        </div>
      </div>

      <div className="teams-grid">
        {filtered.map((t) => (
          <TeamCard
            key={t.id}
            team={t}
            onOpen={() => loadTeam(t)}
            onDuplicate={() => duplicateTeam(t)}
            onDelete={() => deleteTeam(t)}
          />
        ))}
        <button className="team-card new" onClick={() => window.go("mode")}>
          <div className="new-plus">+</div>
          <div className="new-label">Nuevo equipo</div>
          <div className="new-sub">Elegí modo y empezá</div>
        </button>
      </div>

      <div className="section-head" style={{ marginTop: 40 }}>
        <h2>Accesos rápidos</h2>
      </div>
      <div className="quick-grid">
        <QuickCard
          title="Editor de alineación"
          sub="Arrastrá jugadores a la cancha"
          icon="editorNav"
          action={() => window.go("editor")}
        />
        <QuickCard
          title="Sorteo de equipos"
          sub="Con ruleta + jugadores fijos"
          icon="shuffle"
          action={() => window.go("draw")}
        />
        <QuickCard
          title="Modo rival"
          sub="Enfrentá dos alineaciones"
          icon="target"
          action={() => window.go("rival")}
        />
        <QuickCard
          title="Camisetas"
          sub="4 diseños + personalización"
          icon="jersey"
          action={() => window.go("kits")}
        />
      </div>

      {modal?.type === "match" && (
        <MatchModal
          teams={teams}
          roster={roster}
          initial={modal.match || null}
          onClose={() => setModal(null)}
          onSave={(m) => {
            if (modal.match) {
              setMatches((prev) =>
                prev.map((x) => (x.id === modal.match.id ? { ...x, ...m } : x)),
              );
              window.__toast?.("Resultado actualizado");
            } else {
              setMatches((prev) => [...prev, { ...m, id: "m" + Date.now() }]);
              window.__toast?.("Resultado guardado");
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
    window.fcAuth
      ?.session()
      .then((value) => setSession(value || null))
      .catch(() => setSession(null));
    const subscription = window.fcSupabase?.auth.onAuthStateChange(
      (_event, next) => setSession(next),
    );
    return () => subscription?.data?.subscription?.unsubscribe?.();
  }, []);

  if (session === undefined || session) return null;
  return (
    <aside className="guest-banner" aria-label="Modo sin cuenta">
      <div className="guest-banner-icon" aria-hidden="true">
        ✓
      </div>
      <div>
        <strong>Estás usando futbolClub sin cuenta</strong>
        <span>
          Podés crear, guardar y compartir alineaciones. Tus datos quedan en
          este dispositivo.
        </span>
      </div>
      <button className="btn sm ghost" onClick={() => window.go("settings")}>
        Backup y sincronización
      </button>
    </aside>
  );
}

function NextMatchBanner({ matchInfo }) {
  if (!matchInfo?.date) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (matchInfo.date < today) return null;
  const isToday = matchInfo.date === today;
  const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  let label = matchInfo.date;
  try {
    label = days[new Date(matchInfo.date + "T00:00").getDay()];
  } catch (_) {}
  return (
    <aside className="next-match-banner" aria-label="Próximo partido">
      <div className="next-match-icon" aria-hidden="true">
        <Icon name="session" size={18} />
      </div>
      <div>
        <strong>
          {isToday ? "¡Partido hoy!" : `Próximo partido · ${label}`}{" "}
          {matchInfo.time && `· ${matchInfo.time}`}
        </strong>
        <span>
          {matchInfo.venue ? `${matchInfo.venue} · ` : ""}vs{" "}
          {matchInfo.opponent || "rival"}
        </span>
      </div>
      <button className="btn sm" onClick={() => window.go("share")}>
        Ver detalles
      </button>
    </aside>
  );
}

function MatchModal({ teams, roster, initial, onClose, onSave }) {
  const dialogRef = window.useDialogAccessibility(true, onClose);
  const [teamId, setTeamId] = React.useState(
    initial?.teamId || teams[0]?.id || "",
  );
  const [us, setUs] = React.useState(initial?.us ?? 0);
  const [them, setThem] = React.useState(initial?.them ?? 0);
  const [opponent, setOpponent] = React.useState(initial?.opponent || "");
  const [date, setDate] = React.useState(
    initial?.date || new Date().toISOString().slice(0, 10),
  );
  const [scorers, setScorers] = React.useState(initial?.scorers || []);
  const [scorerPick, setScorerPick] = React.useState(roster[0]?.id ?? "");
  const [scorerGoals, setScorerGoals] = React.useState(1);

  const addScorer = () => {
    if (scorerPick === "") return;
    setScorers((prev) => {
      const existing = prev.find((s) => s.playerId === scorerPick);
      const goals = Number(scorerGoals) || 1;
      if (existing)
        return prev.map((s) =>
          s.playerId === scorerPick ? { ...s, goals: s.goals + goals } : s,
        );
      return [...prev, { playerId: scorerPick, goals }];
    });
  };
  const removeScorer = (playerId) =>
    setScorers((prev) => prev.filter((s) => s.playerId !== playerId));

  const submit = () => {
    if (!teamId) return;
    onSave({
      teamId,
      us: parseInt(us, 10) || 0,
      them: parseInt(them, 10) || 0,
      opponent: opponent.trim() || "Rival",
      date,
      scorers,
    });
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={initial ? "Editar partido" : "Registrar partido"}
        tabIndex="-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <div className="page-kicker">
              {initial ? "Editar partido" : "Registrar partido"}
            </div>
            <div className="modal-title">
              {initial ? "Corregí el resultado" : "Cargá el resultado"}
            </div>
          </div>
          <button
            className="btn sm ghost"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid match-form">
            <label style={{ gridColumn: "span 2" }}>
              <span>Equipo</span>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Nosotros</span>
              <input
                type="number"
                min="0"
                value={us}
                onChange={(e) => setUs(e.target.value)}
              />
            </label>
            <label>
              <span>Ellos</span>
              <input
                type="number"
                min="0"
                value={them}
                onChange={(e) => setThem(e.target.value)}
              />
            </label>
            <label style={{ gridColumn: "span 2" }}>
              <span>Rival</span>
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Los del Jueves"
              />
            </label>
            <label style={{ gridColumn: "span 2" }}>
              <span>Fecha</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          </div>

          <div className="scorers-field">
            <span className="scorers-field-label">Goleadores (opcional)</span>
            <div className="scorers-add-row">
              <select
                value={scorerPick}
                onChange={(e) =>
                  setScorerPick(Number(e.target.value) || e.target.value)
                }
              >
                {roster.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={scorerGoals}
                onChange={(e) => setScorerGoals(e.target.value)}
              />
              <button className="btn sm" type="button" onClick={addScorer}>
                + Agregar
              </button>
            </div>
            {scorers.length > 0 && (
              <div className="scorers-chip-row">
                {scorers.map((s) => {
                  const p = roster.find((r) => r.id === s.playerId);
                  if (!p) return null;
                  return (
                    <span key={s.playerId} className="chip">
                      {p.name} · {s.goals}
                      <button
                        className="scorer-chip-del"
                        onClick={() => removeScorer(s.playerId)}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn primary" onClick={submit}>
            Guardar
          </button>
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
            <Kit
              design={team.kit}
              primary={team.color}
              secondary={team.secondary || "#0f172a"}
              number={team.mode === 11 ? 10 : 7}
              size={68}
              showNumber={true}
            />
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
      <button
        className="team-duplicate"
        onClick={onDuplicate}
        title="Duplicar equipo"
        aria-label={`Duplicar ${team.name}`}
      >
        ⧉
      </button>
      <button
        className="team-del"
        onClick={onDelete}
        title="Borrar equipo"
        aria-label={`Borrar ${team.name}`}
      >
        ×
      </button>
    </div>
  );
}

function QuickCard({ title, sub, icon, action }) {
  return (
    <button className="quick-card" onClick={action}>
      <div className="quick-icon">
        <Icon name={icon} size={18} />
      </div>
      <div className="quick-body">
        <div className="quick-title">{title}</div>
        <div className="quick-sub">{sub}</div>
      </div>
      <div className="quick-arrow">→</div>
    </button>
  );
}

window.mountPage("page-home", <HomePage />);
