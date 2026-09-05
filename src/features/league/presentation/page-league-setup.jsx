// League workspace presentation. CSV/team normalization lives in features/league/domain.
const leagueEl = (tag, props, ...children) => React.createElement(tag, props, ...children);
const inferLeagueTeams = (competition) => window.fcLeague.inferTeams(competition);
const mergeLeagueTeamNames = (...groups) => window.fcLeague.normalizeTeamNames(groups.flat());
const parseLeagueCsv = (text) => window.fcLeague.parseLeagueCsv(text, {
  id: (index) => `fx${Date.now()}-${index}`,
});
window.parseLeagueCsv = parseLeagueCsv;

function initialLeagueCompetitions() {
  const stored = window.db.load("competitions", null);
  if (Array.isArray(stored) && stored.length) {
    return stored.map((competition) => ({ ...competition, teams: inferLeagueTeams(competition) }));
  }
  const legacy = window.db.load("league", null);
  return legacy ? [{ id: "c1", ...legacy, teams: inferLeagueTeams(legacy) }] : [];
}

function downloadLeagueCsvExample(type) {
  const fixture = type === "fixture";
  const csv = fixture
    ? "Fecha,Local,Visitante,Goles Local,Goles Visitante\n2026-08-22,Los Pibes,La Banda,2,1\n2026-08-29,La Banda,El Barrio,,\n"
    : "Equipo\nLos Pibes\nLa Banda\nEl Barrio\nDeportivo Centro\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fixture ? "ejemplo-fixture.csv" : "ejemplo-equipos.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function LeagueSetupScreen({ competition, onSave, onCancel }) {
  const editing = !!competition;
  const baseFixtures = competition?.fixtures || [];
  const [name, setName] = React.useState(competition?.name || "");
  const [season, setSeason] = React.useState(competition?.season || String(new Date().getFullYear()));
  const [teams, setTeams] = React.useState(() => inferLeagueTeams(competition));
  const [teamDraft, setTeamDraft] = React.useState("");
  const [importedFixtures, setImportedFixtures] = React.useState([]);
  const [importInfo, setImportInfo] = React.useState(null);
  const [error, setError] = React.useState("");
  const fileInputRef = React.useRef(null);

  const addTeam = () => {
    const clean = teamDraft.trim();
    if (!clean) return;
    setTeams((current) => mergeLeagueTeamNames(current, [clean]));
    setTeamDraft("");
    setError("");
  };

  const removeTeam = (team) => {
    if (baseFixtures.some((fixture) => fixture.home === team || fixture.away === team)) {
      window.__toast?.("Ese equipo tiene partidos cargados; eliminá esos partidos primero.");
      return;
    }
    setTeams((current) => current.filter((nameValue) => nameValue !== team));
  };

  const importCsvFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = parseLeagueCsv(await file.text());
      if (!parsed.teams.length) throw new Error("El CSV no contiene equipos válidos.");
      setTeams((current) => mergeLeagueTeamNames(current, parsed.teams));
      setImportedFixtures(parsed.fixtures);
      setImportInfo({ file: file.name, kind: parsed.kind, teams: parsed.teams.length, fixtures: parsed.fixtures.length, warnings: parsed.warnings });
      setError("");
    } catch (csvError) {
      setImportInfo(null);
      setImportedFixtures([]);
      setError(csvError?.message || "No pude leer ese CSV.");
    }
  };

  const submit = () => {
    const cleanName = name.trim();
    if (!cleanName) return setError("Poné un nombre para la liga.");
    if (teams.length < 2) return setError("Agregá al menos 2 equipos para crear la liga.");
    const fixtureIds = new Set(baseFixtures.map((fixture) => fixture.id));
    const newFixtures = importedFixtures.map((fixture, index) => ({
      ...fixture,
      id: fixtureIds.has(fixture.id) ? `fx${Date.now()}-csv-${index}` : fixture.id,
    }));
    onSave({
      ...(competition || {}),
      id: competition?.id || `c${Date.now()}`,
      name: cleanName,
      season: season.trim() || String(new Date().getFullYear()),
      teams,
      fixtures: editing ? [...baseFixtures, ...newFixtures] : newFixtures,
      cup: competition?.cup || null,
    });
  };

  return leagueEl(
    "div", { className: "league-setup-page" },
    leagueEl("div", { className: "league-setup-head" },
      leagueEl("div", null,
        leagueEl("div", { className: "page-kicker" }, editing ? "Configurar competencia" : "Nueva competencia"),
        leagueEl("h1", null, editing ? "Equipos de la liga" : "Crear liga"),
        leagueEl("p", null, "Definí los participantes una vez. La tabla, el fixture y la copa quedan separados de las demás ligas."),
      ),
      onCancel && leagueEl("button", { className: "btn ghost", type: "button", onClick: onCancel }, "Cancelar"),
    ),
    leagueEl("div", { className: "league-setup-grid" },
      leagueEl("section", { className: "card league-setup-card" },
        leagueEl("div", { className: "league-setup-step" }, "1", leagueEl("span", null, "Datos de la liga")),
        leagueEl("div", { className: "league-setup-fields" },
          leagueEl("label", { className: "field" }, leagueEl("span", null, "Nombre"), leagueEl("input", { value: name, onChange: (event) => setName(event.target.value), placeholder: "Ej. Apertura 2026", autoFocus: !editing })),
          leagueEl("label", { className: "field season" }, leagueEl("span", null, "Temporada"), leagueEl("input", { value: season, onChange: (event) => setSeason(event.target.value), placeholder: "2026" })),
        ),
        leagueEl("div", { className: "league-setup-step second" }, "2", leagueEl("span", null, "Participantes")),
        leagueEl("div", { className: "league-team-add" },
          leagueEl("input", { value: teamDraft, onChange: (event) => setTeamDraft(event.target.value), onKeyDown: (event) => { if (event.key === "Enter") { event.preventDefault(); addTeam(); } }, placeholder: "Nombre del equipo", "aria-label": "Nombre del equipo" }),
          leagueEl("button", { type: "button", className: "btn primary", onClick: addTeam }, "Agregar"),
        ),
        leagueEl("div", { className: "league-team-list" },
          ...teams.map((team, index) => leagueEl("div", { className: "league-team-chip", key: team }, leagueEl("span", { className: "league-team-number" }, index + 1), leagueEl("strong", null, team), leagueEl("button", { type: "button", onClick: () => removeTeam(team), "aria-label": `Quitar ${team}` }, "×"))),
          !teams.length && leagueEl("div", { className: "league-empty-teams" }, "Todavía no agregaste equipos."),
        ),
      ),
      leagueEl("section", { className: "card league-import-card" },
        leagueEl("div", { className: "league-setup-step" }, "CSV", leagueEl("span", null, "Importación rápida")),
        leagueEl("h2", null, "Traé la liga desde una planilla"),
        leagueEl("p", { className: "league-import-copy" }, "Podés importar solo equipos o un fixture completo. Si el CSV trae goles, esos partidos entran como jugados."),
        leagueEl("input", { ref: fileInputRef, className: "league-file-input", type: "file", accept: ".csv,text/csv", onChange: importCsvFile }),
        leagueEl("button", { type: "button", className: "league-dropzone", onClick: () => fileInputRef.current?.click() }, leagueEl("strong", null, "Importar CSV"), leagueEl("span", null, "Equipo · o · Fecha, Local, Visitante, Goles Local, Goles Visitante")),
        leagueEl("div", { className: "league-example-actions" },
          leagueEl("button", { type: "button", className: "link-btn", onClick: () => downloadLeagueCsvExample("teams") }, "Ejemplo de equipos ↓"),
          leagueEl("button", { type: "button", className: "link-btn", onClick: () => downloadLeagueCsvExample("fixture") }, "Ejemplo de fixture ↓"),
        ),
        importInfo && leagueEl("div", { className: "league-import-result" }, leagueEl("strong", null, importInfo.file), leagueEl("span", null, `${importInfo.teams} equipos${importInfo.fixtures ? ` · ${importInfo.fixtures} partidos` : ""}`), importInfo.warnings.length > 0 && leagueEl("small", null, `${importInfo.warnings.length} fila(s) ignoradas.`)),
        leagueEl("div", { className: "league-csv-help" }, leagueEl("strong", null, "Columnas aceptadas"), leagueEl("span", null, "Equipos: Equipo / Team / Nombre / Club"), leagueEl("span", null, "Fixture: Fecha, Local, Visitante, Goles Local, Goles Visitante"), leagueEl("span", null, "También acepta ; o tabulaciones y campos entre comillas.")),
      ),
    ),
    error && leagueEl("div", { className: "league-setup-error", role: "alert" }, error),
    leagueEl("div", { className: "league-setup-footer" },
      leagueEl("div", { className: "league-setup-summary" }, leagueEl("strong", null, teams.length), leagueEl("span", null, teams.length === 1 ? "equipo" : "equipos"), leagueEl("i", null, "·"), leagueEl("strong", null, baseFixtures.length + importedFixtures.length), leagueEl("span", null, "partidos")),
      leagueEl("button", { type: "button", className: "btn primary league-create-btn", onClick: submit }, editing ? "Guardar cambios" : "Crear liga"),
    ),
  );
}

function syncLeagueDatalist(teamNames) {
  document.querySelectorAll("#page-league datalist#league-team-names").forEach((list) => {
    const present = new Set([...list.querySelectorAll("option")].map((option) => option.value.toLocaleLowerCase()));
    teamNames.forEach((name) => {
      if (present.has(name.toLocaleLowerCase())) return;
      const option = document.createElement("option");
      option.value = name;
      option.dataset.leagueTeam = "true";
      list.appendChild(option);
      present.add(name.toLocaleLowerCase());
    });
  });
}

function LeagueWorkspace() {
  const [competitions, setCompetitions] = window.useStore("competitions", initialLeagueCompetitions);
  const [activeId, setActiveId] = window.useStore("activeCompetitionId", () => competitions[0]?.id || "");
  const [setupMode, setSetupMode] = React.useState(() => competitions.length ? null : "create");
  const activeCompetition = competitions.find((competition) => competition.id === activeId) || competitions[0] || null;
  const activeTeams = inferLeagueTeams(activeCompetition);

  React.useEffect(() => {
    if (!competitions.length) return setSetupMode("create");
    if (!competitions.some((competition) => competition.id === activeId)) setActiveId(competitions[0].id);
  }, [competitions, activeId, setActiveId]);

  React.useEffect(() => {
    if (setupMode || !activeCompetition) return undefined;
    const root = document.getElementById("page-league");
    const sync = () => syncLeagueDatalist(activeTeams);
    sync();
    if (!root || !("MutationObserver" in window)) return undefined;
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [setupMode, activeCompetition?.id, activeTeams.join("|")]);

  const saveNewCompetition = (competition) => {
    setCompetitions((current) => [...current, competition]);
    setActiveId(competition.id);
    setSetupMode(null);
    window.__toast?.("Liga creada");
  };
  const saveEditedCompetition = (competition) => {
    setCompetitions((current) => current.map((item) => item.id === competition.id ? competition : item));
    setActiveId(competition.id);
    setSetupMode(null);
    window.__toast?.("Liga actualizada");
  };

  if (setupMode === "create") return React.createElement(LeagueSetupScreen, { onSave: saveNewCompetition, onCancel: competitions.length ? () => setSetupMode(null) : null });
  if (setupMode === "edit" && activeCompetition) return React.createElement(LeagueSetupScreen, { competition: activeCompetition, onSave: saveEditedCompetition, onCancel: () => setSetupMode(null) });

  return leagueEl("div", { className: "league-workspace" },
    leagueEl("div", { className: "league-workspace-actions" },
      leagueEl("div", null, leagueEl("strong", null, activeCompetition?.name || "Liga"), leagueEl("span", null, `${activeTeams.length} participantes propios de esta competencia`)),
      leagueEl("div", { className: "league-workspace-buttons" }, leagueEl("button", { type: "button", className: "btn ghost sm", onClick: () => setSetupMode("edit") }, "Editar equipos"), leagueEl("button", { type: "button", className: "btn primary sm", onClick: () => setSetupMode("create") }, "+ Nueva liga")),
    ),
    React.createElement(LeaguePage, { key: activeCompetition?.id || "league" }),
  );
}
