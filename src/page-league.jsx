// ---- League ----
function calculateStandings(fixtures) {
  const table = new Map();
  const row = (name) => {
    if (!table.has(name))
      table.set(name, {
        name,
        pj: 0,
        pg: 0,
        pe: 0,
        pp: 0,
        gf: 0,
        gc: 0,
        pts: 0,
        form: [],
      });
    return table.get(name);
  };
  fixtures
    .filter((f) => f.played)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((f) => {
      const home = row(f.home),
        away = row(f.away),
        hs = Number(f.homeScore),
        as = Number(f.awayScore);
      home.pj++;
      away.pj++;
      home.gf += hs;
      home.gc += as;
      away.gf += as;
      away.gc += hs;
      if (hs > as) {
        home.pg++;
        away.pp++;
        home.pts += 3;
        home.form.push("G");
        away.form.push("P");
      } else if (hs < as) {
        away.pg++;
        home.pp++;
        away.pts += 3;
        home.form.push("P");
        away.form.push("G");
      } else {
        home.pe++;
        away.pe++;
        home.pts++;
        away.pts++;
        home.form.push("E");
        away.form.push("E");
      }
    });
  return [...table.values()]
    .sort(
      (a, b) =>
        b.pts - a.pts ||
        b.gf - b.gc - (a.gf - a.gc) ||
        b.gf - a.gf ||
        a.name.localeCompare(b.name),
    )
    .map((t) => ({ ...t, form: t.form.slice(-5) }));
}

const normalizeTeamName = (s) => (s || "").trim().toLowerCase();

function LeaguePage() {
  const [competitions, setCompetitions] = window.useStore(
    "competitions",
    () => {
      const legacy = window.db.load("league", null);
      return [
        legacy
          ? { id: "c1", ...legacy }
          : { id: "c1", name: "Liga amateur", season: "2026", fixtures: [] },
      ];
    },
  );
  const [activeId, setActiveId] = window.useStore(
    "activeCompetitionId",
    () => competitions[0]?.id || "c1",
  );
  const [teamCrests] = window.useStore("teamCrests", {});
  const [savedTeams] = window.useStore("teams", window.DEFAULT_SAVED_TEAMS);
  const [tab, setTab] = React.useState("table");
  const [form, setForm] = React.useState({
    date: new Date().toISOString().slice(0, 10),
    home: "",
    away: "",
    homeScore: "",
    awayScore: "",
  });
  const [scoreDrafts, setScoreDrafts] = React.useState({});
  const [newComp, setNewComp] = React.useState({ name: "", season: "" });
  const [showNewComp, setShowNewComp] = React.useState(false);
  const [dateFilter, setDateFilter] = React.useState({ from: "", to: "" });

  const competition =
    competitions.find((c) => c.id === activeId) || competitions[0];
  const setCompetition = (updater) =>
    setCompetitions((list) =>
      list.map((c) =>
        c.id === competition.id
          ? typeof updater === "function"
            ? updater(c)
            : updater
          : c,
      ),
    );

  const fixtures = competition.fixtures || [],
    standings = calculateStandings(fixtures);
  const teamNameOptions = [
    ...new Set([
      ...savedTeams.map((t) => t.name),
      ...fixtures.flatMap((f) => [f.home, f.away]),
    ]),
  ].sort();

  const teamColorFor = (name) =>
    savedTeams.find((t) => t.name === name) || null;
  // Entradas viejas eran solo un string (dataURL o 'none'); las nuevas son un objeto
  // { photo, hidden, design, primary, secondary } editado desde el editor de escudos.
  const crestEntryFor = (name) => {
    const raw = teamCrests[normalizeTeamName(name)];
    if (!raw) return null;
    if (typeof raw === "string")
      return raw === "none" ? { hidden: true } : { photo: raw };
    return raw;
  };
  const crestFor = (name) => {
    const t = teamColorFor(name);
    const entry = crestEntryFor(name) || {};
    if (entry.hidden) return { name, photo: "none" };
    return {
      name,
      design: entry.design || t?.kit || "solid",
      primary: entry.primary || t?.color || window.colorFor(name || "?"),
      secondary: entry.secondary || t?.secondary || "#0f172a",
      photo: entry.photo || undefined,
      initials: entry.initials || undefined,
    };
  };

  const addCompetition = () => {
    if (!newComp.name.trim())
      return window.__toast?.("Ponele un nombre a la competencia");
    const id = "c" + Date.now();
    setCompetitions((list) => [
      ...list,
      {
        id,
        name: newComp.name.trim(),
        season: newComp.season.trim() || "2026",
        fixtures: [],
      },
    ]);
    setActiveId(id);
    setNewComp({ name: "", season: "" });
    setShowNewComp(false);
  };
  const deleteCompetition = (id) => {
    if (competitions.length <= 1)
      return window.__toast?.("Tiene que quedar al menos una competencia");
    if (
      !confirm(
        "¿Eliminar esta competencia? Se pierde su tabla, fixture y cuadro de copa.",
      )
    )
      return;
    setCompetitions((list) => list.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(competitions.find((c) => c.id !== id)?.id);
  };

  const saveFixture = () => {
    if (!form.home.trim() || !form.away.trim())
      return window.__toast?.("Completá ambos equipos");
    const played = form.homeScore !== "" && form.awayScore !== "";
    setCompetition((l) => ({
      ...l,
      fixtures: [
        ...(l.fixtures || []),
        {
          id: `fx${Date.now()}`,
          ...form,
          home: form.home.trim(),
          away: form.away.trim(),
          played,
          homeScore: Number(form.homeScore) || 0,
          awayScore: Number(form.awayScore) || 0,
        },
      ],
    }));
    setForm((v) => ({
      ...v,
      home: "",
      away: "",
      homeScore: "",
      awayScore: "",
    }));
    window.__toast?.("Partido agregado");
  };
  const deleteFixture = (id) => {
    if (!confirm("¿Eliminar este partido?")) return;
    setCompetition((l) => ({
      ...l,
      fixtures: l.fixtures.filter((x) => x.id !== id),
    }));
  };
  const saveScore = (fx) => {
    const draft = scoreDrafts[fx.id] || {};
    const hs = draft.home ?? fx.homeScore,
      as = draft.away ?? fx.awayScore;
    if (hs === "" || as === "" || hs == null || as == null)
      return window.__toast?.("Completá ambos marcadores");
    setCompetition((l) => ({
      ...l,
      fixtures: l.fixtures.map((x) =>
        x.id === fx.id
          ? { ...x, played: true, homeScore: Number(hs), awayScore: Number(as) }
          : x,
      ),
    }));
    window.__toast?.("Resultado guardado");
  };

  const played = fixtures.filter((f) => f.played);
  const pending = fixtures
    .filter((f) => !f.played)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextFixture = pending[0];
  const teamStanding = (name) => standings.find((t) => t.name === name);
  const fixturesInRange = fixtures.filter(
    (f) =>
      (!dateFilter.from || f.date >= dateFilter.from) &&
      (!dateFilter.to || f.date <= dateFilter.to),
  );
  const byDate = {};
  fixturesInRange
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((f) => {
      (byDate[f.date] = byDate[f.date] || []).push(f);
    });
  const recent = played
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Modo liga</div>
          <input
            className="editor-title-input"
            value={competition.name}
            onChange={(e) =>
              setCompetition((l) => ({ ...l, name: e.target.value }))
            }
          />
          <div className="page-sub">
            {standings.length} equipos · {played.length} de {fixtures.length}{" "}
            fechas jugadas
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="season-input"
            value={competition.season}
            onChange={(e) =>
              setCompetition((l) => ({ ...l, season: e.target.value }))
            }
            aria-label="Temporada"
          />
        </div>
      </div>

      <div className="comp-selector">
        {competitions.map((c) => (
          <div
            key={c.id}
            className={`comp-pill ${c.id === activeId ? "on" : ""}`}
          >
            <button
              className="comp-pill-main"
              onClick={() => setActiveId(c.id)}
            >
              <strong>{c.name}</strong>
              <span>{c.season}</span>
            </button>
            {competitions.length > 1 && (
              <button
                className="comp-pill-del"
                onClick={() => deleteCompetition(c.id)}
                title="Eliminar competencia"
                aria-label={`Eliminar ${c.name}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {showNewComp ? (
          <div className="comp-pill comp-pill-new-form">
            <input
              placeholder="Nombre (ej. Apertura)"
              value={newComp.name}
              onChange={(e) =>
                setNewComp((v) => ({ ...v, name: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && addCompetition()}
            />
            <input
              placeholder="Temporada"
              value={newComp.season}
              onChange={(e) =>
                setNewComp((v) => ({ ...v, season: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && addCompetition()}
            />
            <button className="btn sm primary" onClick={addCompetition}>
              Crear
            </button>
            <button
              className="btn sm ghost"
              onClick={() => setShowNewComp(false)}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            className="comp-pill comp-pill-add"
            onClick={() => setShowNewComp(true)}
          >
            <Icon name="plus" size={13} /> Nueva competencia
          </button>
        )}
      </div>

      <div className="tab-seg-row">
        <div
          className="seg tab-seg"
          role="tablist"
          aria-label="Sección de competencia"
        >
          <button
            role="tab"
            aria-selected={tab === "table"}
            className={tab === "table" ? "on" : ""}
            onClick={() => setTab("table")}
          >
            Tabla
          </button>
          <button
            role="tab"
            aria-selected={tab === "fixture"}
            className={tab === "fixture" ? "on" : ""}
            onClick={() => setTab("fixture")}
          >
            Fixture
          </button>
          <button
            role="tab"
            aria-selected={tab === "cup"}
            className={tab === "cup" ? "on" : ""}
            onClick={() => setTab("cup")}
          >
            Copa
          </button>
        </div>
        <button className="tab-external" onClick={() => window.go("crests")}>
          <Icon name="shield" size={13} /> Gestionar escudos →
        </button>
      </div>

      {tab === "table" && (
        <>
          <div className="hub-row uneven">
            <div className="card">
              <div className="panel-head-row">
                <span>Próxima fecha</span>
                {nextFixture && (
                  <span className="muted-note">{nextFixture.date}</span>
                )}
              </div>
              {nextFixture ? (
                <div className="matchup-row">
                  <div className="matchup-team right">
                    <Crest {...crestFor(nextFixture.home)} size={32} />
                    <div>
                      <strong>{nextFixture.home}</strong>
                      <small>
                        {teamStanding(nextFixture.home)
                          ? `${standings.indexOf(teamStanding(nextFixture.home)) + 1}º · ${teamStanding(nextFixture.home).pts} pts`
                          : "sin datos"}
                      </small>
                    </div>
                  </div>
                  <div className="matchup-vs"></div>
                  <div className="matchup-team">
                    <div>
                      <strong>{nextFixture.away}</strong>
                      <small>
                        {teamStanding(nextFixture.away)
                          ? `${standings.indexOf(teamStanding(nextFixture.away)) + 1}º · ${teamStanding(nextFixture.away).pts} pts`
                          : "sin datos"}
                      </small>
                    </div>
                    <Crest {...crestFor(nextFixture.away)} size={32} />
                  </div>
                </div>
              ) : (
                <div className="empty-state sm">
                  No hay partidos pendientes.
                </div>
              )}
            </div>
            <div className="card">
              <div className="panel-head-row">
                <span>Carga rápida</span>
              </div>
              <datalist id="league-team-names">
                {teamNameOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <div className="form-grid-wide">
                <label className="field span-2">
                  <span>Fecha</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((v) => ({ ...v, date: e.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Local</span>
                  <input
                    list="league-team-names"
                    value={form.home}
                    onChange={(e) =>
                      setForm((v) => ({ ...v, home: e.target.value }))
                    }
                    placeholder="Elegí o escribí un nombre"
                  />
                </label>
                <label className="field">
                  <span>Visitante</span>
                  <input
                    list="league-team-names"
                    value={form.away}
                    onChange={(e) =>
                      setForm((v) => ({ ...v, away: e.target.value }))
                    }
                    placeholder="Elegí o escribí un nombre"
                  />
                </label>
                <label className="field">
                  <span>Goles local</span>
                  <input
                    type="number"
                    min="0"
                    value={form.homeScore}
                    onChange={(e) =>
                      setForm((v) => ({ ...v, homeScore: e.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Goles visitante</span>
                  <input
                    type="number"
                    min="0"
                    value={form.awayScore}
                    onChange={(e) =>
                      setForm((v) => ({ ...v, awayScore: e.target.value }))
                    }
                  />
                </label>
              </div>
              <button className="btn primary" onClick={saveFixture}>
                <Icon name="plus" size={14} /> Guardar partido
              </button>
            </div>
          </div>

          <section className="card">
            <div className="panel-head-row">
              <span>Tabla de posiciones</span>
              <span className="muted-note">
                G victoria · E empate · P derrota
              </span>
            </div>
            {standings.length ? (
              <div className="table-wrap">
                <table className="standings">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th className="left">Equipo</th>
                      <th>PJ</th>
                      <th>PG</th>
                      <th>PE</th>
                      <th>PP</th>
                      <th>GF</th>
                      <th>GC</th>
                      <th>DG</th>
                      <th>Forma</th>
                      <th>PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((t, i) => (
                      <tr key={t.name} className={i < 1 ? "top-row" : ""}>
                        <td>
                          <span
                            className={`pos-badge ${i === 0 ? "first" : ""}`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="left">
                          <div className="standings-team">
                            <Crest {...crestFor(t.name)} size={22} />
                            <strong>{t.name}</strong>
                          </div>
                        </td>
                        <td>{t.pj}</td>
                        <td>{t.pg}</td>
                        <td>{t.pe}</td>
                        <td>{t.pp}</td>
                        <td>{t.gf}</td>
                        <td>{t.gc}</td>
                        <td
                          className={
                            t.gf - t.gc > 0
                              ? "pos-diff"
                              : t.gf - t.gc < 0
                                ? "neg-diff"
                                : ""
                          }
                        >
                          {t.gf - t.gc > 0 ? "+" : ""}
                          {t.gf - t.gc}
                        </td>
                        <td>
                          <span className="form-row">
                            {t.form.map((r, j) => (
                              <i
                                key={j}
                                className={`form-dot ${r.toLowerCase()}`}
                              >
                                {r}
                              </i>
                            ))}
                          </span>
                        </td>
                        <td>
                          <strong>{t.pts}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                Cargá un resultado para generar la tabla.
              </div>
            )}
          </section>

          <section className="card">
            <div className="panel-head-row">
              <span>Últimos resultados</span>
            </div>
            <div className="results-list">
              {recent.map((f) => (
                <div key={f.id} className="results-row">
                  <time>{f.date}</time>
                  <strong className="right">{f.home}</strong>
                  <span className="score-chip">
                    {f.homeScore} — {f.awayScore}
                  </span>
                  <strong>{f.away}</strong>
                  <button
                    className="del-icon"
                    onClick={() => deleteFixture(f.id)}
                    aria-label="Eliminar partido"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              ))}
              {!recent.length && (
                <div className="empty-state sm">
                  Todavía no hay resultados cargados.
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {tab === "fixture" && (
        <div className="fixture-layout">
          <div className="fixture-days">
            <div className="date-filter-row">
              <span>Filtrar por fecha</span>
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) =>
                  setDateFilter((v) => ({ ...v, from: e.target.value }))
                }
              />
              <span>a</span>
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) =>
                  setDateFilter((v) => ({ ...v, to: e.target.value }))
                }
              />
              {(dateFilter.from || dateFilter.to) && (
                <button
                  className="btn sm ghost"
                  onClick={() => setDateFilter({ from: "", to: "" })}
                >
                  Quitar filtro
                </button>
              )}
            </div>
            {Object.keys(byDate)
              .sort()
              .map((date) => (
                <div key={date} className="fixture-day">
                  <div className="fixture-day-label">{date}</div>
                  {byDate[date].map((f) => {
                    const draft = scoreDrafts[f.id] || {};
                    return (
                      <article
                        key={f.id}
                        className={`fixture-card ${!f.played ? "pending" : ""}`}
                      >
                        <div className="fixture-card-top">
                          <span className="muted-note">{f.date}</span>
                          <span
                            className={`badge ${f.played ? "final" : "pending"}`}
                          >
                            {f.played ? "Final" : "Pendiente"}
                          </span>
                        </div>
                        <div className="fixture-teams">
                          <div className="fixture-team right">
                            <strong>{f.home}</strong>
                            <Crest {...crestFor(f.home)} size={24} />
                          </div>
                          {f.played ? (
                            <span className="score-chip">
                              {f.homeScore} – {f.awayScore}
                            </span>
                          ) : (
                            <span className="score-inputs">
                              <input
                                type="number"
                                min="0"
                                value={draft.home ?? ""}
                                onChange={(e) =>
                                  setScoreDrafts((s) => ({
                                    ...s,
                                    [f.id]: {
                                      ...s[f.id],
                                      home: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="–"
                              />
                              <span>–</span>
                              <input
                                type="number"
                                min="0"
                                value={draft.away ?? ""}
                                onChange={(e) =>
                                  setScoreDrafts((s) => ({
                                    ...s,
                                    [f.id]: {
                                      ...s[f.id],
                                      away: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="–"
                              />
                            </span>
                          )}
                          <div className="fixture-team">
                            <Crest {...crestFor(f.away)} size={24} />
                            <strong>{f.away}</strong>
                          </div>
                        </div>
                        <div className="fixture-card-foot">
                          <button
                            className="del-icon"
                            onClick={() => deleteFixture(f.id)}
                            aria-label="Eliminar partido"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                          {!f.played && (
                            <button
                              className="btn primary sm"
                              onClick={() => saveScore(f)}
                            >
                              Guardar
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ))}
            {!fixturesInRange.length && (
              <div className="empty-state">
                {fixtures.length
                  ? "No hay partidos en ese rango de fechas."
                  : "Todavía no hay partidos cargados. Agregá uno desde la pestaña Tabla."}
              </div>
            )}
          </div>
          <div className="fixture-side">
            <section className="card">
              <div className="panel-head-row">
                <span>Tabla</span>
                <button className="link-btn" onClick={() => setTab("table")}>
                  Ver completa →
                </button>
              </div>
              {standings.slice(0, 5).map((t, i) => (
                <div key={t.name} className="mini-standing-row">
                  <span className={`pos-badge sm ${i === 0 ? "first" : ""}`}>
                    {i + 1}
                  </span>
                  <strong>{t.name}</strong>
                  <span
                    className={
                      t.gf - t.gc > 0
                        ? "pos-diff"
                        : t.gf - t.gc < 0
                          ? "neg-diff"
                          : ""
                    }
                  >
                    {t.gf - t.gc > 0 ? "+" : ""}
                    {t.gf - t.gc}
                  </span>
                  <strong>{t.pts}</strong>
                </div>
              ))}
              {!standings.length && (
                <div className="empty-state sm">Sin datos todavía.</div>
              )}
            </section>
          </div>
        </div>
      )}

      {tab === "cup" && (
        <LeagueCup
          league={competition}
          setLeague={setCompetition}
          teamNameOptions={teamNameOptions}
          crestFor={crestFor}
        />
      )}
    </div>
  );
}

// ---- League: Copa / eliminatoria directa ----
function getCupWinner(match) {
  if (!match) return null;
  if (
    match.scoreA === undefined ||
    match.scoreB === undefined ||
    match.scoreA === "" ||
    match.scoreB === ""
  )
    return null;
  const a = Number(match.scoreA),
    b = Number(match.scoreB);
  if (a > b) return "a";
  if (b > a) return "b";
  // Empate en el resultado — se define por penales (solo tiene sentido en copa
  // eliminatoria) o, si no se cargaron, con la elección manual como respaldo.
  if (
    match.penA !== undefined &&
    match.penB !== undefined &&
    match.penA !== "" &&
    match.penB !== ""
  ) {
    const pa = Number(match.penA),
      pb = Number(match.penB);
    if (pa > pb) return "a";
    if (pb > pa) return "b";
  }
  if (match.winnerPick) return match.winnerPick;
  return null;
}

function buildCupRounds(cup) {
  if (!cup?.size) return [];
  const roundCount = Math.log2(cup.size);
  const rounds = [];
  let currentTeams = cup.teams.slice();
  for (let r = 0; r < roundCount; r++) {
    const matches = [];
    for (let i = 0; i < currentTeams.length / 2; i++) {
      const key = `${r}-${i}`;
      const match = cup.matches?.[key] || {};
      matches.push({
        key,
        teamA: currentTeams[i * 2] || null,
        teamB: currentTeams[i * 2 + 1] || null,
        match,
      });
    }
    rounds.push(matches);
    currentTeams = matches.map((m) => {
      const w = getCupWinner(m.match);
      if (w === "a") return m.teamA;
      if (w === "b") return m.teamB;
      return null;
    });
  }
  return rounds;
}

function cupRoundLabel(r, total) {
  const fromEnd = total - r;
  if (fromEnd === 1) return "Final";
  if (fromEnd === 2) return "Semifinal";
  if (fromEnd === 3) return "Cuartos de final";
  if (fromEnd === 4) return "Octavos de final";
  if (fromEnd === 5) return "Dieciseisavos de final";
  return `Ronda ${r + 1}`;
}

function LeagueCup({ league, setLeague, teamNameOptions, crestFor }) {
  const cup = league.cup || null;
  const [setupSize, setSetupSize] = React.useState(8);
  const [setupNames, setSetupNames] = React.useState(Array(32).fill(""));
  const [shuffle, setShuffle] = React.useState(true);

  const generateCup = () => {
    const names = setupNames.slice(0, setupSize).map((n) => n.trim());
    if (names.some((n) => !n))
      return window.__toast?.(`Completá el nombre de los ${setupSize} equipos`);
    const teams = shuffle ? window.fisherYates(names) : names;
    setLeague((l) => ({ ...l, cup: { size: setupSize, teams, matches: {} } }));
    window.__toast?.("Cuadro generado");
  };

  const resetCup = () => {
    if (
      !confirm(
        "¿Reiniciar el cuadro eliminatorio? Se perderán los resultados cargados.",
      )
    )
      return;
    setLeague((l) => ({ ...l, cup: null }));
  };

  const setCupScore = (key, field, value) => {
    setLeague((l) => {
      const prev = l.cup.matches?.[key] || {};
      const { winnerPick, ...rest } = prev;
      return {
        ...l,
        cup: {
          ...l.cup,
          matches: { ...l.cup.matches, [key]: { ...rest, [field]: value } },
        },
      };
    });
  };
  const setCupWinnerPick = (key, side) => {
    setLeague((l) => ({
      ...l,
      cup: {
        ...l.cup,
        matches: {
          ...l.cup.matches,
          [key]: { ...(l.cup.matches?.[key] || {}), winnerPick: side },
        },
      },
    }));
  };
  const setCupPenalty = (key, field, value) => {
    setLeague((l) => {
      const prev = l.cup.matches?.[key] || {};
      const { winnerPick, ...rest } = prev;
      return {
        ...l,
        cup: {
          ...l.cup,
          matches: { ...l.cup.matches, [key]: { ...rest, [field]: value } },
        },
      };
    });
  };
  const stepCupScore = (key, field, current, delta) => {
    const next = Math.max(0, (Number(current) || 0) + delta);
    setCupScore(key, field, String(next));
  };
  const stepCupPenalty = (key, field, current, delta) => {
    const next = Math.max(0, (Number(current) || 0) + delta);
    setCupPenalty(key, field, String(next));
  };

  if (!cup) {
    return (
      <div className="card cup-setup">
        <div className="panel-head-row">
          <span>Nuevo cuadro eliminatorio</span>
        </div>
        <div className="seg" style={{ marginBottom: 14 }}>
          {[4, 8, 16, 32].map((n) => (
            <button
              key={n}
              className={setupSize === n ? "on" : ""}
              onClick={() => setSetupSize(n)}
            >
              {n} equipos
            </button>
          ))}
        </div>
        <datalist id="league-team-names">
          {teamNameOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <div className="cup-setup-grid">
          {Array.from({ length: setupSize }).map((_, i) => (
            <input
              key={i}
              list="league-team-names"
              value={setupNames[i] || ""}
              onChange={(e) =>
                setSetupNames((prev) => {
                  const next = prev.slice();
                  next[i] = e.target.value;
                  return next;
                })
              }
              placeholder={`Equipo ${i + 1}`}
            />
          ))}
        </div>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={shuffle}
            onChange={(e) => setShuffle(e.target.checked)}
          />{" "}
          <span>Sortear posiciones del cuadro</span>
        </label>
        <button className="btn primary" onClick={generateCup}>
          <Icon name="shuffle" size={14} /> Generar cuadro
        </button>
      </div>
    );
  }

  const rounds = buildCupRounds(cup);
  const finalRoundIdx = rounds.length - 1;
  const finalMatch = rounds[finalRoundIdx][0];
  const champion = finalMatch ? getCupWinner(finalMatch.match) : null;
  const championName =
    champion === "a"
      ? finalMatch.teamA
      : champion === "b"
        ? finalMatch.teamB
        : null;
  const sideRounds = rounds.slice(0, finalRoundIdx);

  const renderMatch = (m) => {
    const winner = getCupWinner(m.match);
    const canScore = m.teamA && m.teamB;
    const tiedScore =
      canScore &&
      m.match.scoreA !== "" &&
      m.match.scoreB !== "" &&
      m.match.scoreA !== undefined &&
      m.match.scoreB !== undefined &&
      Number(m.match.scoreA) === Number(m.match.scoreB);
    const stepper = (field, value, onStep, onChange) => (
      <div className="cup-score-stepper">
        <button
          type="button"
          onClick={() => onStep(field, value, -1)}
          aria-label="Restar"
        >
          −
        </button>
        <input
          type="number"
          min="0"
          value={value ?? ""}
          onChange={(e) => onChange(field, e.target.value)}
        />
        <button
          type="button"
          onClick={() => onStep(field, value, 1)}
          aria-label="Sumar"
        >
          +
        </button>
      </div>
    );
    return (
      <div key={m.key} className="cup-match">
        <div className={`cup-team ${winner === "a" ? "winner" : ""}`}>
          {m.teamA && <Crest {...crestFor(m.teamA)} size={18} />}
          <span className="cup-team-name">{m.teamA || "Por definir"}</span>
          {canScore &&
            stepper(
              "scoreA",
              m.match.scoreA,
              (f, v, d) => stepCupScore(m.key, f, v, d),
              (f, v) => setCupScore(m.key, f, v),
            )}
        </div>
        <div className={`cup-team ${winner === "b" ? "winner" : ""}`}>
          {m.teamB && <Crest {...crestFor(m.teamB)} size={18} />}
          <span className="cup-team-name">{m.teamB || "Por definir"}</span>
          {canScore &&
            stepper(
              "scoreB",
              m.match.scoreB,
              (f, v, d) => stepCupScore(m.key, f, v, d),
              (f, v) => setCupScore(m.key, f, v),
            )}
        </div>
        {tiedScore && (
          <div className="cup-tiebreak">
            <span>Empate · penales</span>
            <div className="cup-pen-row">
              {stepper(
                "penA",
                m.match.penA,
                (f, v, d) => stepCupPenalty(m.key, f, v, d),
                (f, v) => setCupPenalty(m.key, f, v),
              )}
              <span className="cup-pen-sep">–</span>
              {stepper(
                "penB",
                m.match.penB,
                (f, v, d) => stepCupPenalty(m.key, f, v, d),
                (f, v) => setCupPenalty(m.key, f, v),
              )}
            </div>
            {!winner && (
              <div className="cup-tiebreak-manual">
                <span>o elegí a mano:</span>
                <button onClick={() => setCupWinnerPick(m.key, "a")}>
                  {m.teamA}
                </button>
                <button onClick={() => setCupWinnerPick(m.key, "b")}>
                  {m.teamB}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="cup-toolbar">
        <span className="muted-note">
          {cup.size} equipos · eliminación directa
        </span>
        <button className="btn sm ghost" onClick={resetCup}>
          <Icon name="refresh" size={12} /> Reiniciar cuadro
        </button>
      </div>
      <div className="cup-bracket">
        <div className="cup-side">
          {sideRounds.map((roundMatches, r) => (
            <div key={r} className="cup-round">
              <div className="cup-round-label">
                {cupRoundLabel(r, rounds.length)}
              </div>
              <div className="cup-round-matches">
                {roundMatches
                  .slice(0, roundMatches.length / 2)
                  .map(renderMatch)}
              </div>
            </div>
          ))}
        </div>

        <div className="cup-round cup-champion-col">
          <div className="cup-round-label">Final</div>
          <div className="cup-round-matches cup-round-matches-final">
            {renderMatch(finalMatch)}
          </div>
          <div className="cup-round-label" style={{ marginTop: 18 }}>
            Campeón
          </div>
          <div
            className={`cup-champion-card ${championName ? "has-winner" : ""}`}
          >
            <Icon name="trophy" size={18} />
            <span>{championName || "Por definir"}</span>
          </div>
        </div>

        <div className="cup-side">
          {sideRounds
            .slice()
            .reverse()
            .map((roundMatches, ri) => {
              const r = sideRounds.length - 1 - ri;
              return (
                <div key={r} className="cup-round">
                  <div className="cup-round-label">
                    {cupRoundLabel(r, rounds.length)}
                  </div>
                  <div className="cup-round-matches">
                    {roundMatches
                      .slice(roundMatches.length / 2)
                      .map(renderMatch)}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
