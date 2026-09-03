(function () {
  const root = document.getElementById("page-league");
  if (!root) return;
  const normalize = value => String(value || "").trim().toLocaleLowerCase();
  const scopedListId = "league-active-team-names";
  let scopedList = document.getElementById(scopedListId);
  if (!scopedList) {
    scopedList = document.createElement("datalist");
    scopedList.id = scopedListId;
    document.body.appendChild(scopedList);
  }
  function activeCompetition() {
    const competitions = window.db?.load?.("competitions", []) || [];
    const activeId = window.db?.load?.("activeCompetitionId", "") || "";
    return competitions.find(competition => competition.id === activeId) || competitions[0] || null;
  }
  function participantNames() {
    const competition = activeCompetition();
    const names = [];
    const seen = new Set();
    const add = value => {
      const name = String(typeof value === "string" ? value : value?.name || "").trim();
      const key = normalize(name);
      if (!name || seen.has(key)) return;
      seen.add(key);
      names.push(name);
    };
    const explicit = Array.isArray(competition?.teams) ? competition.teams : [];
    if (explicit.length) explicit.forEach(add);else {
      const saved = window.db?.load?.("teams", window.DEFAULT_SAVED_TEAMS || []) || [];
      saved.forEach(add);
    }
    (competition?.fixtures || []).forEach(fixture => {
      add(fixture?.home);
      add(fixture?.away);
    });
    return names;
  }
  function syncTeamPicker() {
    const names = participantNames();
    const current = [...scopedList.querySelectorAll("option")].map(option => option.value);
    if (current.length !== names.length || !current.every((value, index) => value === names[index])) {
      scopedList.replaceChildren(...names.map(name => {
        const option = document.createElement("option");
        option.value = name;
        return option;
      }));
    }
    root.querySelectorAll(`input[list="league-team-names"], input[list="${scopedListId}"]`).forEach(input => input.setAttribute("list", scopedListId));
  }
  function fieldValue(label) {
    const wanted = normalize(label);
    const field = [...root.querySelectorAll("label.field")].find(item => normalize(item.querySelector("span")?.textContent) === wanted);
    return field?.querySelector("input")?.value?.trim() || "";
  }
  function block(event, message) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    window.__toast?.(message);
  }
  root.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    const label = button.textContent?.trim() || "";
    const allowed = new Set(participantNames().map(normalize));
    if (/Guardar partido/i.test(label)) {
      const home = fieldValue("Local");
      const away = fieldValue("Visitante");
      if (!home || !away) return;
      if (normalize(home) === normalize(away)) {
        block(event, "Local y visitante tienen que ser equipos distintos");
        return;
      }
      if (!allowed.has(normalize(home)) || !allowed.has(normalize(away))) {
        block(event, "Elegí equipos que pertenezcan a esta liga");
      }
    }
    if (/Generar cuadro/i.test(label)) {
      const entered = [...root.querySelectorAll(".cup-setup-grid input")].map(input => input.value.trim()).filter(Boolean);
      if (entered.some(name => !allowed.has(normalize(name)))) {
        block(event, "La copa solo puede usar participantes de esta liga");
      }
    }
  }, true);
  if ("MutationObserver" in window) {
    new MutationObserver(syncTeamPicker).observe(root, {
      childList: true,
      subtree: true
    });
  }
  window.addEventListener("fc:data-changed", event => {
    if (["competitions", "activeCompetitionId", "teams"].includes(event.detail?.key)) syncTeamPicker();
  });
  syncTeamPicker();
})();
const leagueFixtureEl = (tag, props, ...children) => React.createElement(tag, props, ...children);
function leagueLocalDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function leagueAddDays(dateValue, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue || ""))) return "";
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}
function leagueUniqueNames(values) {
  const names = [];
  const seen = new Set();
  (values || []).forEach(value => {
    const name = String(typeof value === "string" ? value : value?.name || "").trim();
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) return;
    seen.add(key);
    names.push(name);
  });
  return names;
}
function generateLeagueRoundRobin(teamValues, {
  doubleRound = false,
  startDate = leagueLocalDate(),
  daysBetween = 7
} = {}) {
  const teams = leagueUniqueNames(teamValues);
  if (teams.length < 2) return [];
  const gap = Math.max(1, Math.min(365, Number(daysBetween) || 7));
  const pool = teams.slice();
  if (pool.length % 2) pool.push(null);
  const teamCount = pool.length;
  const roundsPerLeg = teamCount - 1;
  const firstLeg = [];
  let rotating = pool.slice();
  const stamp = Date.now();
  for (let roundIndex = 0; roundIndex < roundsPerLeg; roundIndex += 1) {
    const matches = [];
    for (let pairIndex = 0; pairIndex < teamCount / 2; pairIndex += 1) {
      const left = rotating[pairIndex];
      const right = rotating[teamCount - 1 - pairIndex];
      if (!left || !right) continue;
      const swap = (roundIndex + pairIndex) % 2 === 1;
      const home = swap ? right : left;
      const away = swap ? left : right;
      matches.push({
        id: `fxgen-${stamp}-1-${roundIndex + 1}-${pairIndex + 1}`,
        round: roundIndex + 1,
        leg: 1,
        date: leagueAddDays(startDate, roundIndex * gap),
        home,
        away,
        homeScore: 0,
        awayScore: 0,
        played: false,
        generated: true
      });
    }
    firstLeg.push(matches);
    rotating = [rotating[0], rotating.at(-1), ...rotating.slice(1, -1)];
  }
  const fixtures = firstLeg.flat();
  if (doubleRound) {
    firstLeg.forEach((matches, roundIndex) => {
      matches.forEach((match, pairIndex) => {
        fixtures.push({
          id: `fxgen-${stamp}-2-${roundIndex + 1}-${pairIndex + 1}`,
          round: roundsPerLeg + roundIndex + 1,
          leg: 2,
          date: leagueAddDays(startDate, (roundsPerLeg + roundIndex) * gap),
          home: match.away,
          away: match.home,
          homeScore: 0,
          awayScore: 0,
          played: false,
          generated: true
        });
      });
    });
  }
  return fixtures;
}
function leagueCsvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function leagueTeamsCsv(competition) {
  const teams = inferLeagueTeams(competition);
  return ["Equipo", ...teams.map(leagueCsvEscape)].join("\n") + "\n";
}
function leagueFixtureCsv(competition) {
  const rows = [["Ronda", "Ida/Vuelta", "Fecha", "Local", "Visitante", "Goles Local", "Goles Visitante"].join(",")];
  (competition?.fixtures || []).forEach(fixture => {
    rows.push([fixture.round || "", fixture.leg === 2 ? "Vuelta" : fixture.leg === 1 ? "Ida" : "", fixture.date || "", fixture.home || "", fixture.away || "", fixture.played ? fixture.homeScore : "", fixture.played ? fixture.awayScore : ""].map(leagueCsvEscape).join(","));
  });
  return rows.join("\n") + "\n";
}
function leagueFileSlug(value) {
  return String(value || "liga").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "liga";
}
function downloadLeagueCsv(filename, csv) {
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
function exportLeagueTeamsCsv(competition) {
  const slug = leagueFileSlug(competition?.name);
  downloadLeagueCsv(`${slug}-equipos.csv`, leagueTeamsCsv(competition));
}
function exportLeagueFixtureCsv(competition) {
  const slug = leagueFileSlug(competition?.name);
  downloadLeagueCsv(`${slug}-fixture.csv`, leagueFixtureCsv(competition));
}
window.generateLeagueRoundRobin = generateLeagueRoundRobin;
window.leagueTeamsCsv = leagueTeamsCsv;
window.leagueFixtureCsv = leagueFixtureCsv;
window.exportLeagueTeamsCsv = exportLeagueTeamsCsv;
window.exportLeagueFixtureCsv = exportLeagueFixtureCsv;
function LeagueFixtureGenerator({
  competition,
  onSave,
  onCancel
}) {
  const teams = inferLeagueTeams(competition);
  const existing = competition?.fixtures || [];
  const [doubleRound, setDoubleRound] = React.useState(false);
  const [startDate, setStartDate] = React.useState(leagueLocalDate());
  const [daysBetween, setDaysBetween] = React.useState("7");
  const [mergeMode, setMergeMode] = React.useState(existing.length ? "append" : "replace");
  const [error, setError] = React.useState("");
  const preview = generateLeagueRoundRobin(teams, {
    doubleRound,
    startDate,
    daysBetween
  });
  const roundCount = preview.reduce((max, fixture) => Math.max(max, Number(fixture.round) || 0), 0);
  const submit = () => {
    if (teams.length < 2) {
      setError("La liga necesita al menos 2 equipos para generar el fixture.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      setError("Elegí una fecha inicial válida.");
      return;
    }
    const gap = Number(daysBetween);
    if (!Number.isFinite(gap) || gap < 1 || gap > 365) {
      setError("El intervalo entre fechas debe ser de 1 a 365 días.");
      return;
    }
    if (!preview.length) {
      setError("No se pudo generar el fixture con esos participantes.");
      return;
    }
    if (mergeMode === "replace" && existing.some(fixture => fixture.played) && !confirm("Hay resultados cargados. ¿Reemplazar igualmente todo el fixture?")) {
      return;
    }
    onSave({
      ...competition,
      fixtures: mergeMode === "append" ? [...existing, ...preview] : preview
    });
  };
  return leagueFixtureEl("div", {
    className: "league-setup-page"
  }, leagueFixtureEl("div", {
    className: "league-setup-head"
  }, leagueFixtureEl("div", null, leagueFixtureEl("div", {
    className: "page-kicker"
  }, "Calendario automático"), leagueFixtureEl("h1", null, "Generar fixture"), leagueFixtureEl("p", null, `Armá automáticamente el calendario de ${teams.length} equipos. Podés usar una rueda de ida o ida y vuelta.`)), leagueFixtureEl("button", {
    className: "btn ghost",
    type: "button",
    onClick: onCancel
  }, "Cancelar")), leagueFixtureEl("div", {
    className: "league-setup-grid"
  }, leagueFixtureEl("section", {
    className: "card league-setup-card"
  }, leagueFixtureEl("div", {
    className: "league-setup-step"
  }, "1", leagueFixtureEl("span", null, "Formato")), leagueFixtureEl("div", {
    className: "seg",
    role: "group",
    "aria-label": "Formato del fixture"
  }, leagueFixtureEl("button", {
    type: "button",
    className: !doubleRound ? "on" : "",
    "aria-pressed": String(!doubleRound),
    onClick: () => setDoubleRound(false)
  }, "Solo ida"), leagueFixtureEl("button", {
    type: "button",
    className: doubleRound ? "on" : "",
    "aria-pressed": String(doubleRound),
    onClick: () => setDoubleRound(true)
  }, "Ida y vuelta")), leagueFixtureEl("div", {
    className: "league-setup-step second"
  }, "2", leagueFixtureEl("span", null, "Fechas")), leagueFixtureEl("div", {
    className: "league-setup-fields"
  }, leagueFixtureEl("label", {
    className: "field"
  }, leagueFixtureEl("span", null, "Primera fecha"), leagueFixtureEl("input", {
    type: "date",
    value: startDate,
    onChange: event => setStartDate(event.target.value)
  })), leagueFixtureEl("label", {
    className: "field season"
  }, leagueFixtureEl("span", null, "Días entre fechas"), leagueFixtureEl("input", {
    type: "number",
    min: "1",
    max: "365",
    value: daysBetween,
    onChange: event => setDaysBetween(event.target.value)
  }))), existing.length > 0 && leagueFixtureEl(React.Fragment, null, leagueFixtureEl("div", {
    className: "league-setup-step second"
  }, "3", leagueFixtureEl("span", null, "Qué hacer con el fixture actual")), leagueFixtureEl("div", {
    className: "seg",
    role: "group",
    "aria-label": "Destino del fixture generado"
  }, leagueFixtureEl("button", {
    type: "button",
    className: mergeMode === "append" ? "on" : "",
    "aria-pressed": String(mergeMode === "append"),
    onClick: () => setMergeMode("append")
  }, "Agregar"), leagueFixtureEl("button", {
    type: "button",
    className: mergeMode === "replace" ? "on" : "",
    "aria-pressed": String(mergeMode === "replace"),
    onClick: () => setMergeMode("replace")
  }, "Reemplazar")))), leagueFixtureEl("section", {
    className: "card league-import-card"
  }, leagueFixtureEl("div", {
    className: "league-setup-step"
  }, "PREVIEW", leagueFixtureEl("span", null, "Calendario resultante")), leagueFixtureEl("h2", null, `${preview.length} partidos`), leagueFixtureEl("p", {
    className: "league-import-copy"
  }, `${roundCount} fechas · ${doubleRound ? "ida y vuelta" : "una rueda"} · cada ${Math.max(1, Number(daysBetween) || 7)} días.`), leagueFixtureEl("div", {
    className: "league-import-result"
  }, leagueFixtureEl("strong", null, teams.join(" · ")), preview.length > 0 && leagueFixtureEl("span", null, `${preview[0].date || "sin fecha"} → ${preview.at(-1)?.date || "sin fecha"}`)), leagueFixtureEl("div", {
    className: "league-csv-help"
  }, leagueFixtureEl("strong", null, "Después podés editarlo"), leagueFixtureEl("span", null, "El fixture generado queda en la pestaña Fixture como cualquier partido normal."), leagueFixtureEl("span", null, "Podés cargar resultados, eliminar partidos y exportarlo a CSV."), teams.length % 2 === 1 && leagueFixtureEl("span", null, "Hay un número impar de equipos: en cada fecha uno queda libre.")))), error && leagueFixtureEl("div", {
    className: "league-setup-error",
    role: "alert"
  }, error), leagueFixtureEl("div", {
    className: "league-setup-footer"
  }, leagueFixtureEl("div", {
    className: "league-setup-summary"
  }, leagueFixtureEl("strong", null, preview.length), leagueFixtureEl("span", null, "partidos"), leagueFixtureEl("i", null, "·"), leagueFixtureEl("strong", null, roundCount), leagueFixtureEl("span", null, "fechas")), leagueFixtureEl("button", {
    type: "button",
    className: "btn primary league-create-btn",
    onClick: submit
  }, `Generar ${preview.length} partidos`)));
}
LeagueWorkspace = function LeagueWorkspaceWithFixtureTools() {
  const [competitions, setCompetitions] = window.useStore("competitions", initialLeagueCompetitions);
  const [activeId, setActiveId] = window.useStore("activeCompetitionId", () => competitions[0]?.id || "");
  const [setupMode, setSetupMode] = React.useState(() => competitions.length ? null : "create");
  const activeCompetition = competitions.find(competition => competition.id === activeId) || competitions[0] || null;
  const activeTeams = inferLeagueTeams(activeCompetition);
  React.useEffect(() => {
    if (!competitions.length) {
      setSetupMode("create");
      return;
    }
    if (!competitions.some(competition => competition.id === activeId)) {
      setActiveId(competitions[0].id);
    }
  }, [competitions, activeId, setActiveId]);
  const saveNewCompetition = competition => {
    setCompetitions(current => [...current, competition]);
    setActiveId(competition.id);
    setSetupMode(null);
    window.__toast?.("Liga creada");
  };
  const saveEditedCompetition = competition => {
    setCompetitions(current => current.map(item => item.id === competition.id ? competition : item));
    setActiveId(competition.id);
    setSetupMode(null);
    window.__toast?.("Liga actualizada");
  };
  const saveGeneratedFixture = competition => {
    setCompetitions(current => current.map(item => item.id === competition.id ? competition : item));
    setActiveId(competition.id);
    setSetupMode(null);
    window.__toast?.("Fixture generado");
  };
  if (setupMode === "create") {
    return React.createElement(LeagueSetupScreen, {
      onSave: saveNewCompetition,
      onCancel: competitions.length ? () => setSetupMode(null) : null
    });
  }
  if (setupMode === "edit" && activeCompetition) {
    return React.createElement(LeagueSetupScreen, {
      competition: activeCompetition,
      onSave: saveEditedCompetition,
      onCancel: () => setSetupMode(null)
    });
  }
  if (setupMode === "fixture" && activeCompetition) {
    return React.createElement(LeagueFixtureGenerator, {
      competition: activeCompetition,
      onSave: saveGeneratedFixture,
      onCancel: () => setSetupMode(null)
    });
  }
  return leagueFixtureEl("div", {
    className: "league-workspace"
  }, leagueFixtureEl("div", {
    className: "league-workspace-actions"
  }, leagueFixtureEl("div", null, leagueFixtureEl("strong", null, activeCompetition?.name || "Liga"), leagueFixtureEl("span", null, `${activeTeams.length} participantes · ${activeCompetition?.fixtures?.length || 0} partidos`)), leagueFixtureEl("div", {
    className: "league-workspace-buttons"
  }, leagueFixtureEl("button", {
    type: "button",
    className: "btn primary sm",
    onClick: () => setSetupMode("fixture")
  }, "Generar fixture"), leagueFixtureEl("button", {
    type: "button",
    className: "btn ghost sm",
    onClick: () => setSetupMode("edit")
  }, "Importar / editar"), leagueFixtureEl("button", {
    type: "button",
    className: "btn ghost sm",
    onClick: () => exportLeagueTeamsCsv(activeCompetition)
  }, "Equipos CSV ↓"), leagueFixtureEl("button", {
    type: "button",
    className: "btn ghost sm",
    onClick: () => exportLeagueFixtureCsv(activeCompetition)
  }, "Fixture CSV ↓"), leagueFixtureEl("button", {
    type: "button",
    className: "btn ghost sm",
    onClick: () => setSetupMode("create")
  }, "+ Nueva liga"))), React.createElement(LeaguePage, {
    key: activeCompetition?.id || "league"
  }));
};
//# sourceURL=src/league-participant-guard.jsx
