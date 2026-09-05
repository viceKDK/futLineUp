// League workspace: create competitions with their own participants and optional CSV fixture import.
const leagueEl = (tag, props, ...children) => React.createElement(tag, props, ...children);

function leagueTeamName(value) {
  return (typeof value === "string" ? value : value?.name || "").trim();
}

function inferLeagueTeams(competition) {
  const names = [];
  const seen = new Set();
  const add = (value) => {
    const name = leagueTeamName(value);
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) return;
    seen.add(key);
    names.push(name);
  };
  (competition?.teams || []).forEach(add);
  (competition?.fixtures || []).forEach((fixture) => {
    add(fixture?.home);
    add(fixture?.away);
  });
  return names;
}

function initialLeagueCompetitions() {
  const stored = window.db.load("competitions", null);
  if (Array.isArray(stored) && stored.length) {
    return stored.map((competition) => ({
      ...competition,
      teams: inferLeagueTeams(competition),
    }));
  }
  const legacy = window.db.load("league", null);
  if (legacy) {
    return [{ id: "c1", ...legacy, teams: inferLeagueTeams(legacy) }];
  }
  return [];
}

function normalizeLeagueCsvHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function detectLeagueCsvDelimiter(text) {
  const firstLine = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).find((line) => line.trim()) || "";
  const candidates = [",", ";", "\t"];
  const counts = new Map(candidates.map((candidate) => [candidate, 0]));
  let quoted = false;
  for (let i = 0; i < firstLine.length; i += 1) {
    const char = firstLine[i];
    if (char === '"') {
      if (quoted && firstLine[i + 1] === '"') i += 1;
      else quoted = !quoted;
      continue;
    }
    if (!quoted && counts.has(char)) counts.set(char, counts.get(char) + 1);
  }
  return candidates.sort((a, b) => counts.get(b) - counts.get(a))[0];
}

function parseLeagueCsvRows(text) {
  const clean = String(text || "").replace(/^\uFEFF/, "");
  const delimiter = detectLeagueCsvDelimiter(clean);
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (char === '"') {
      if (quoted && clean[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (!quoted && char === delimiter) {
      row.push(value.trim());
      value = "";
      continue;
    }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && clean[i + 1] === "\n") i += 1;
      row.push(value.trim());
      value = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      continue;
    }
    value += char;
  }
  row.push(value.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

function leagueCsvIndex(headers, aliases) {
  for (const alias of aliases) {
    const index = headers.indexOf(alias);
    if (index >= 0) return index;
  }
  return -1;
}

function mergeLeagueTeamNames(...groups) {
  const result = [];
  const seen = new Set();
  groups.flat().forEach((value) => {
    const name = leagueTeamName(value);
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) return;
    seen.add(key);
    result.push(name);
  });
  return result;
}

function parseLeagueCsv(text) {
  const rows = parseLeagueCsvRows(text);
  if (!rows.length) throw new Error("El CSV está vacío.");
  const headers = rows[0].map(normalizeLeagueCsvHeader);
  const body = rows.slice(1);
  const teamIndex = leagueCsvIndex(headers, ["equipo", "team", "nombre", "name", "club"]);
  const homeIndex = leagueCsvIndex(headers, ["local", "home", "equipo_local", "home_team"]);
  const awayIndex = leagueCsvIndex(headers, ["visitante", "away", "equipo_visitante", "away_team"]);
  const dateIndex = leagueCsvIndex(headers, ["fecha", "date", "dia", "day"]);
  const homeScoreIndex = leagueCsvIndex(headers, ["goles_local", "gol_local", "home_score", "score_home", "resultado_local"]);
  const awayScoreIndex = leagueCsvIndex(headers, ["goles_visitante", "gol_visitante", "away_score", "score_away", "resultado_visitante"]);

  const teams = [];
  const fixtures = [];
  const warnings = [];

  if (homeIndex >= 0 && awayIndex >= 0) {
    body.forEach((cells, index) => {
      const home = (cells[homeIndex] || "").trim();
      const away = (cells[awayIndex] || "").trim();
      if (!home && !away) return;
      if (!home || !away) {
        warnings.push(`Fila ${index + 2}: falta local o visitante.`);
        return;
      }
      if (home.toLocaleLowerCase() === away.toLocaleLowerCase()) {
        warnings.push(`Fila ${index + 2}: un equipo no puede jugar contra sí mismo.`);
        return;
      }
      teams.push(home, away);
      const rawHomeScore = homeScoreIndex >= 0 ? (cells[homeScoreIndex] || "").trim() : "";
      const rawAwayScore = awayScoreIndex >= 0 ? (cells[awayScoreIndex] || "").trim() : "";
      const played = rawHomeScore !== "" && rawAwayScore !== "";
      const homeScore = played ? Number(rawHomeScore) : 0;
      const awayScore = played ? Number(rawAwayScore) : 0;
      if (played && (!Number.isFinite(homeScore) || !Number.isFinite(awayScore) || homeScore < 0 || awayScore < 0)) {
        warnings.push(`Fila ${index + 2}: resultado inválido.`);
        return;
      }
      fixtures.push({
        id: `fx${Date.now()}-${index}`,
        date: dateIndex >= 0 ? (cells[dateIndex] || "").trim() : "",
        home,
        away,
        homeScore,
        awayScore,
        played,
      });
    });
    return {
      kind: "fixture",
      teams: mergeLeagueTeamNames(teams),
      fixtures,
      warnings,
    };
  }

  const fallbackTeamIndex = teamIndex >= 0 ? teamIndex : headers.length === 1 ? 0 : -1;
  if (fallbackTeamIndex < 0) {
    throw new Error("No encontré columnas de equipos. Usá 'Equipo' o las columnas 'Local' y 'Visitante'.");
  }
  body.forEach((cells) => {
    const name = (cells[fallbackTeamIndex] || "").trim();
    if (name) teams.push(name);
  });
  return {
    kind: "teams",
    teams: mergeLeagueTeamNames(teams),
    fixtures: [],
    warnings,
  };
}

window.parseLeagueCsv = parseLeagueCsv;

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
    const used = baseFixtures.some(
      (fixture) => fixture.home === team || fixture.away === team,
    );
    if (used) {
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
      setImportInfo({
        file: file.name,
        kind: parsed.kind,
        teams: parsed.teams.length,
        fixtures: parsed.fixtures.length,
        warnings: parsed.warnings,
      });
      setError("");
    } catch (csvError) {
      setImportInfo(null);
      setImportedFixtures([]);
      setError(csvError?.message || "No pude leer ese CSV.");
    }
  };

  const submit = () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Poné un nombre para la liga.");
      return;
    }
    if (teams.length < 2) {
      setError("Agregá al menos 2 equipos para crear la liga.");
      return;
    }
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
    "div",
    { className: "league-setup-page" },
    leagueEl(
      "div",
      { className: "league-setup-head" },
      leagueEl("div", null,
        leagueEl("div", { className: "page-kicker" }, editing ? "Configurar competencia" : "Nueva competencia"),
        leagueEl("h1", null, editing ? "Equipos de la liga" : "Crear liga"),
        leagueEl("p", null, "Definí los participantes una vez. La tabla, el fixture y la copa quedan separados de las demás ligas."),
      ),
      onCancel && leagueEl("button", { className: "btn ghost", type: "button", onClick: onCancel }, "Cancelar"),
    ),
    leagueEl(
      "div",
      { className: "league-setup-grid" },
      leagueEl(
        "section",
        { className: "card league-setup-card" },
        leagueEl("div", { className: "league-setup-step" }, "1", leagueEl("span", null, "Datos de la liga")),
        leagueEl(
          "div",
          { className: "league-setup-fields" },
          leagueEl("label", { className: "field" },
            leagueEl("span", null, "Nombre"),
            leagueEl("input", { value: name, onChange: (event) => setName(event.target.value), placeholder: "Ej. Apertura 2026", autoFocus: !editing }),
          ),
          leagueEl("label", { className: "field season" },
            leagueEl("span", null, "Temporada"),
            leagueEl("input", { value: season, onChange: (event) => setSeason(event.target.value), placeholder: "2026" }),
          ),
        ),
        leagueEl("div", { className: "league-setup-step second" }, "2", leagueEl("span", null, "Participantes")),
        leagueEl(
          "div",
          { className: "league-team-add" },
          leagueEl("input", {
            value: teamDraft,
            onChange: (event) => setTeamDraft(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTeam();
              }
            },
            placeholder: "Nombre del equipo",
            "aria-label": "Nombre del equipo",
          }),
          leagueEl("button", { type: "button", className: "btn primary", onClick: addTeam }, "Agregar"),
        ),
        leagueEl(
          "div",
          { className: "league-team-list" },
          ...teams.map((team, index) => leagueEl(
            "div",
            { className: "league-team-chip", key: team },
            leagueEl("span", { className: "league-team-number" }, index + 1),
            leagueEl("strong", null, team),
            leagueEl("button", { type: "button", onClick: () => removeTeam(team), "aria-label": `Quitar ${team}` }, "×"),
          )),
          !teams.length && leagueEl("div", { className: "league-empty-teams" }, "Todavía no agregaste equipos."),
        ),
      ),
      leagueEl(
        "section",
        { className: "card league-import-card" },
        leagueEl("div", { className: "league-setup-step" }, "CSV", leagueEl("span", null, "Importación rápida")),
        leagueEl("h2", null, "Traé la liga desde una planilla"),
        leagueEl("p", { className: "league-import-copy" }, "Podés importar solo equipos o un fixture completo. Si el CSV trae goles, esos partidos entran como jugados y la tabla se calcula al crear la liga."),
        leagueEl("input", { ref: fileInputRef, className: "league-file-input", type: "file", accept: ".csv,text/csv", onChange: importCsvFile }),
        leagueEl("button", { type: "button", className: "league-dropzone", onClick: () => fileInputRef.current?.click() },
          leagueEl("strong", null, "Importar CSV"),
          leagueEl("span", null, "Equipo  ·  o  ·  Fecha, Local, Visitante, Goles Local, Goles Visitante"),
        ),
        leagueEl("div", { className: "league-example-actions" },
          leagueEl("button", { type: "button", className: "link-btn", onClick: () => downloadLeagueCsvExample("teams") }, "Ejemplo de equipos ↓"),
          leagueEl("button", { type: "button", className: "link-btn", onClick: () => downloadLeagueCsvExample("fixture") }, "Ejemplo de fixture ↓"),
        ),
        importInfo && leagueEl(
          "div",
          { className: "league-import-result" },
          leagueEl("strong", null, importInfo.file),
          leagueEl("span", null, `${importInfo.teams} equipos${importInfo.fixtures ? ` · ${importInfo.fixtures} partidos` : ""}`),
          importInfo.warnings.length > 0 && leagueEl("small", null, `${importInfo.warnings.length} fila(s) ignoradas por datos incompletos o inválidos.`),
        ),
        leagueEl("div", { className: "league-csv-help" },
          leagueEl("strong", null, "Columnas aceptadas"),
          leagueEl("span", null, "Equipos: Equipo / Team / Nombre / Club"),
          leagueEl("span", null, "Fixture: Fecha, Local, Visitante, Goles Local, Goles Visitante"),
          leagueEl("span", null, "También acepta ; o tabulaciones y campos entre comillas."),
        ),
      ),
    ),
    error && leagueEl("div", { className: "league-setup-error", role: "alert" }, error),
    leagueEl(
      "div",
      { className: "league-setup-footer" },
      leagueEl("div", { className: "league-setup-summary" },
        leagueEl("strong", null, teams.length),
        leagueEl("span", null, teams.length === 1 ? "equipo" : "equipos"),
        leagueEl("i", null, "·"),
        leagueEl("strong", null, baseFixtures.length + importedFixtures.length),
        leagueEl("span", null, "partidos"),
      ),
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
  const [setupMode, setSetupMode] = React.useState(() => (competitions.length ? null : "create"));

  const activeCompetition = competitions.find((competition) => competition.id === activeId) || competitions[0] || null;
  const activeTeams = inferLeagueTeams(activeCompetition);

  React.useEffect(() => {
    if (!competitions.length) {
      setSetupMode("create");
      return;
    }
    if (!competitions.some((competition) => competition.id === activeId)) {
      setActiveId(competitions[0].id);
    }
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
    setCompetitions((current) => current.map((item) => (item.id === competition.id ? competition : item)));
    setActiveId(competition.id);
    setSetupMode(null);
    window.__toast?.("Liga actualizada");
  };

  if (setupMode === "create") {
    return React.createElement(LeagueSetupScreen, {
      onSave: saveNewCompetition,
      onCancel: competitions.length ? () => setSetupMode(null) : null,
    });
  }

  if (setupMode === "edit" && activeCompetition) {
    return React.createElement(LeagueSetupScreen, {
      competition: activeCompetition,
      onSave: saveEditedCompetition,
      onCancel: () => setSetupMode(null),
    });
  }

  return leagueEl(
    "div",
    { className: "league-workspace" },
    leagueEl(
      "div",
      { className: "league-workspace-actions" },
      leagueEl("div", null,
        leagueEl("strong", null, activeCompetition?.name || "Liga"),
        leagueEl("span", null, `${activeTeams.length} participantes propios de esta competencia`),
      ),
      leagueEl("div", { className: "league-workspace-buttons" },
        leagueEl("button", { type: "button", className: "btn ghost sm", onClick: () => setSetupMode("edit") }, "Editar equipos"),
        leagueEl("button", { type: "button", className: "btn primary sm", onClick: () => setSetupMode("create") }, "+ Nueva liga"),
      ),
    ),
    React.createElement(LeaguePage, { key: activeCompetition?.id || "league" }),
  );
}
