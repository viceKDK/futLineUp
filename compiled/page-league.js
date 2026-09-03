function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function calculateStandings(fixtures) {
  const table = new Map();
  const row = name => {
    if (!table.has(name)) table.set(name, {
      name,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      pts: 0,
      form: []
    });
    return table.get(name);
  };
  fixtures.filter(f => f.played).slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(f => {
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
  return [...table.values()].sort((a, b) => b.pts - a.pts || b.gf - b.gc - (a.gf - a.gc) || b.gf - a.gf || a.name.localeCompare(b.name)).map(t => ({
    ...t,
    form: t.form.slice(-5)
  }));
}
const normalizeTeamName = s => (s || "").trim().toLowerCase();
function LeaguePage() {
  const [competitions, setCompetitions] = window.useStore("competitions", () => {
    const legacy = window.db.load("league", null);
    return [legacy ? {
      id: "c1",
      ...legacy
    } : {
      id: "c1",
      name: "Liga amateur",
      season: "2026",
      fixtures: []
    }];
  });
  const [activeId, setActiveId] = window.useStore("activeCompetitionId", () => competitions[0]?.id || "c1");
  const [teamCrests] = window.useStore("teamCrests", {});
  const [savedTeams] = window.useStore("teams", window.DEFAULT_SAVED_TEAMS);
  const [tab, setTab] = React.useState("table");
  const [form, setForm] = React.useState({
    date: new Date().toISOString().slice(0, 10),
    home: "",
    away: "",
    homeScore: "",
    awayScore: ""
  });
  const [scoreDrafts, setScoreDrafts] = React.useState({});
  const [newComp, setNewComp] = React.useState({
    name: "",
    season: ""
  });
  const [showNewComp, setShowNewComp] = React.useState(false);
  const [dateFilter, setDateFilter] = React.useState({
    from: "",
    to: ""
  });
  const competition = competitions.find(c => c.id === activeId) || competitions[0];
  const setCompetition = updater => setCompetitions(list => list.map(c => c.id === competition.id ? typeof updater === "function" ? updater(c) : updater : c));
  const fixtures = competition.fixtures || [],
    standings = calculateStandings(fixtures);
  const teamNameOptions = [...new Set([...savedTeams.map(t => t.name), ...fixtures.flatMap(f => [f.home, f.away])])].sort();
  const teamColorFor = name => savedTeams.find(t => t.name === name) || null;
  const crestEntryFor = name => {
    const raw = teamCrests[normalizeTeamName(name)];
    if (!raw) return null;
    if (typeof raw === "string") return raw === "none" ? {
      hidden: true
    } : {
      photo: raw
    };
    return raw;
  };
  const crestFor = name => {
    const t = teamColorFor(name);
    const entry = crestEntryFor(name) || {};
    if (entry.hidden) return {
      name,
      photo: "none"
    };
    return {
      name,
      design: entry.design || t?.kit || "solid",
      primary: entry.primary || t?.color || window.colorFor(name || "?"),
      secondary: entry.secondary || t?.secondary || "#0f172a",
      photo: entry.photo || undefined,
      initials: entry.initials || undefined
    };
  };
  const addCompetition = () => {
    if (!newComp.name.trim()) return window.__toast?.("Ponele un nombre a la competencia");
    const id = "c" + Date.now();
    setCompetitions(list => [...list, {
      id,
      name: newComp.name.trim(),
      season: newComp.season.trim() || "2026",
      fixtures: []
    }]);
    setActiveId(id);
    setNewComp({
      name: "",
      season: ""
    });
    setShowNewComp(false);
  };
  const deleteCompetition = id => {
    if (competitions.length <= 1) return window.__toast?.("Tiene que quedar al menos una competencia");
    if (!confirm("¿Eliminar esta competencia? Se pierde su tabla, fixture y cuadro de copa.")) return;
    setCompetitions(list => list.filter(c => c.id !== id));
    if (activeId === id) setActiveId(competitions.find(c => c.id !== id)?.id);
  };
  const saveFixture = () => {
    if (!form.home.trim() || !form.away.trim()) return window.__toast?.("Completá ambos equipos");
    const played = form.homeScore !== "" && form.awayScore !== "";
    setCompetition(l => ({
      ...l,
      fixtures: [...(l.fixtures || []), {
        id: `fx${Date.now()}`,
        ...form,
        home: form.home.trim(),
        away: form.away.trim(),
        played,
        homeScore: Number(form.homeScore) || 0,
        awayScore: Number(form.awayScore) || 0
      }]
    }));
    setForm(v => ({
      ...v,
      home: "",
      away: "",
      homeScore: "",
      awayScore: ""
    }));
    window.__toast?.("Partido agregado");
  };
  const deleteFixture = id => {
    if (!confirm("¿Eliminar este partido?")) return;
    setCompetition(l => ({
      ...l,
      fixtures: l.fixtures.filter(x => x.id !== id)
    }));
  };
  const saveScore = fx => {
    const draft = scoreDrafts[fx.id] || {};
    const hs = draft.home ?? fx.homeScore,
      as = draft.away ?? fx.awayScore;
    if (hs === "" || as === "" || hs == null || as == null) return window.__toast?.("Completá ambos marcadores");
    setCompetition(l => ({
      ...l,
      fixtures: l.fixtures.map(x => x.id === fx.id ? {
        ...x,
        played: true,
        homeScore: Number(hs),
        awayScore: Number(as)
      } : x)
    }));
    window.__toast?.("Resultado guardado");
  };
  const played = fixtures.filter(f => f.played);
  const pending = fixtures.filter(f => !f.played).slice().sort((a, b) => a.date.localeCompare(b.date));
  const nextFixture = pending[0];
  const teamStanding = name => standings.find(t => t.name === name);
  const fixturesInRange = fixtures.filter(f => (!dateFilter.from || f.date >= dateFilter.from) && (!dateFilter.to || f.date <= dateFilter.to));
  const byDate = {};
  fixturesInRange.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(f => {
    (byDate[f.date] = byDate[f.date] || []).push(f);
  });
  const recent = played.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return React.createElement("div", null, React.createElement("div", {
    className: "page-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Modo liga"), React.createElement("input", {
    className: "editor-title-input",
    value: competition.name,
    onChange: e => setCompetition(l => ({
      ...l,
      name: e.target.value
    }))
  }), React.createElement("div", {
    className: "page-sub"
  }, standings.length, " equipos \xB7 ", played.length, " de ", fixtures.length, " ", "fechas jugadas")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "season-input",
    value: competition.season,
    onChange: e => setCompetition(l => ({
      ...l,
      season: e.target.value
    })),
    "aria-label": "Temporada"
  }))), React.createElement("div", {
    className: "comp-selector"
  }, competitions.map(c => React.createElement("div", {
    key: c.id,
    className: `comp-pill ${c.id === activeId ? "on" : ""}`
  }, React.createElement("button", {
    className: "comp-pill-main",
    onClick: () => setActiveId(c.id)
  }, React.createElement("strong", null, c.name), React.createElement("span", null, c.season)), competitions.length > 1 && React.createElement("button", {
    className: "comp-pill-del",
    onClick: () => deleteCompetition(c.id),
    title: "Eliminar competencia",
    "aria-label": `Eliminar ${c.name}`
  }, "\xD7"))), showNewComp ? React.createElement("div", {
    className: "comp-pill comp-pill-new-form"
  }, React.createElement("input", {
    placeholder: "Nombre (ej. Apertura)",
    value: newComp.name,
    onChange: e => setNewComp(v => ({
      ...v,
      name: e.target.value
    })),
    onKeyDown: e => e.key === "Enter" && addCompetition()
  }), React.createElement("input", {
    placeholder: "Temporada",
    value: newComp.season,
    onChange: e => setNewComp(v => ({
      ...v,
      season: e.target.value
    })),
    onKeyDown: e => e.key === "Enter" && addCompetition()
  }), React.createElement("button", {
    className: "btn sm primary",
    onClick: addCompetition
  }, "Crear"), React.createElement("button", {
    className: "btn sm ghost",
    onClick: () => setShowNewComp(false)
  }, "\u2715")) : React.createElement("button", {
    className: "comp-pill comp-pill-add",
    onClick: () => setShowNewComp(true)
  }, React.createElement(Icon, {
    name: "plus",
    size: 13
  }), " Nueva competencia")), React.createElement("div", {
    className: "tab-seg-row"
  }, React.createElement("div", {
    className: "seg tab-seg",
    role: "tablist",
    "aria-label": "Secci\xF3n de competencia"
  }, React.createElement("button", {
    role: "tab",
    "aria-selected": tab === "table",
    className: tab === "table" ? "on" : "",
    onClick: () => setTab("table")
  }, "Tabla"), React.createElement("button", {
    role: "tab",
    "aria-selected": tab === "fixture",
    className: tab === "fixture" ? "on" : "",
    onClick: () => setTab("fixture")
  }, "Fixture"), React.createElement("button", {
    role: "tab",
    "aria-selected": tab === "cup",
    className: tab === "cup" ? "on" : "",
    onClick: () => setTab("cup")
  }, "Copa")), React.createElement("button", {
    className: "tab-external",
    onClick: () => window.go("crests")
  }, React.createElement(Icon, {
    name: "shield",
    size: 13
  }), " Gestionar escudos \u2192")), tab === "table" && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "hub-row uneven"
  }, React.createElement("div", {
    className: "card"
  }, React.createElement("div", {
    className: "panel-head-row"
  }, React.createElement("span", null, "Pr\xF3xima fecha"), nextFixture && React.createElement("span", {
    className: "muted-note"
  }, nextFixture.date)), nextFixture ? React.createElement("div", {
    className: "matchup-row"
  }, React.createElement("div", {
    className: "matchup-team right"
  }, React.createElement(Crest, _extends({}, crestFor(nextFixture.home), {
    size: 32
  })), React.createElement("div", null, React.createElement("strong", null, nextFixture.home), React.createElement("small", null, teamStanding(nextFixture.home) ? `${standings.indexOf(teamStanding(nextFixture.home)) + 1}º · ${teamStanding(nextFixture.home).pts} pts` : "sin datos"))), React.createElement("div", {
    className: "matchup-vs"
  }), React.createElement("div", {
    className: "matchup-team"
  }, React.createElement("div", null, React.createElement("strong", null, nextFixture.away), React.createElement("small", null, teamStanding(nextFixture.away) ? `${standings.indexOf(teamStanding(nextFixture.away)) + 1}º · ${teamStanding(nextFixture.away).pts} pts` : "sin datos")), React.createElement(Crest, _extends({}, crestFor(nextFixture.away), {
    size: 32
  })))) : React.createElement("div", {
    className: "empty-state sm"
  }, "No hay partidos pendientes.")), React.createElement("div", {
    className: "card"
  }, React.createElement("div", {
    className: "panel-head-row"
  }, React.createElement("span", null, "Carga r\xE1pida")), React.createElement("datalist", {
    id: "league-team-names"
  }, teamNameOptions.map(name => React.createElement("option", {
    key: name,
    value: name
  }))), React.createElement("div", {
    className: "form-grid-wide"
  }, React.createElement("label", {
    className: "field span-2"
  }, React.createElement("span", null, "Fecha"), React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => setForm(v => ({
      ...v,
      date: e.target.value
    }))
  })), React.createElement("label", {
    className: "field"
  }, React.createElement("span", null, "Local"), React.createElement("input", {
    list: "league-team-names",
    value: form.home,
    onChange: e => setForm(v => ({
      ...v,
      home: e.target.value
    })),
    placeholder: "Eleg\xED o escrib\xED un nombre"
  })), React.createElement("label", {
    className: "field"
  }, React.createElement("span", null, "Visitante"), React.createElement("input", {
    list: "league-team-names",
    value: form.away,
    onChange: e => setForm(v => ({
      ...v,
      away: e.target.value
    })),
    placeholder: "Eleg\xED o escrib\xED un nombre"
  })), React.createElement("label", {
    className: "field"
  }, React.createElement("span", null, "Goles local"), React.createElement("input", {
    type: "number",
    min: "0",
    value: form.homeScore,
    onChange: e => setForm(v => ({
      ...v,
      homeScore: e.target.value
    }))
  })), React.createElement("label", {
    className: "field"
  }, React.createElement("span", null, "Goles visitante"), React.createElement("input", {
    type: "number",
    min: "0",
    value: form.awayScore,
    onChange: e => setForm(v => ({
      ...v,
      awayScore: e.target.value
    }))
  }))), React.createElement("button", {
    className: "btn primary",
    onClick: saveFixture
  }, React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " Guardar partido"))), React.createElement("section", {
    className: "card"
  }, React.createElement("div", {
    className: "panel-head-row"
  }, React.createElement("span", null, "Tabla de posiciones"), React.createElement("span", {
    className: "muted-note"
  }, "G victoria \xB7 E empate \xB7 P derrota")), standings.length ? React.createElement("div", {
    className: "table-wrap"
  }, React.createElement("table", {
    className: "standings"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "#"), React.createElement("th", {
    className: "left"
  }, "Equipo"), React.createElement("th", null, "PJ"), React.createElement("th", null, "PG"), React.createElement("th", null, "PE"), React.createElement("th", null, "PP"), React.createElement("th", null, "GF"), React.createElement("th", null, "GC"), React.createElement("th", null, "DG"), React.createElement("th", null, "Forma"), React.createElement("th", null, "PTS"))), React.createElement("tbody", null, standings.map((t, i) => React.createElement("tr", {
    key: t.name,
    className: i < 1 ? "top-row" : ""
  }, React.createElement("td", null, React.createElement("span", {
    className: `pos-badge ${i === 0 ? "first" : ""}`
  }, i + 1)), React.createElement("td", {
    className: "left"
  }, React.createElement("div", {
    className: "standings-team"
  }, React.createElement(Crest, _extends({}, crestFor(t.name), {
    size: 22
  })), React.createElement("strong", null, t.name))), React.createElement("td", null, t.pj), React.createElement("td", null, t.pg), React.createElement("td", null, t.pe), React.createElement("td", null, t.pp), React.createElement("td", null, t.gf), React.createElement("td", null, t.gc), React.createElement("td", {
    className: t.gf - t.gc > 0 ? "pos-diff" : t.gf - t.gc < 0 ? "neg-diff" : ""
  }, t.gf - t.gc > 0 ? "+" : "", t.gf - t.gc), React.createElement("td", null, React.createElement("span", {
    className: "form-row"
  }, t.form.map((r, j) => React.createElement("i", {
    key: j,
    className: `form-dot ${r.toLowerCase()}`
  }, r)))), React.createElement("td", null, React.createElement("strong", null, t.pts))))))) : React.createElement("div", {
    className: "empty-state"
  }, "Carg\xE1 un resultado para generar la tabla.")), React.createElement("section", {
    className: "card"
  }, React.createElement("div", {
    className: "panel-head-row"
  }, React.createElement("span", null, "\xDAltimos resultados")), React.createElement("div", {
    className: "results-list"
  }, recent.map(f => React.createElement("div", {
    key: f.id,
    className: "results-row"
  }, React.createElement("time", null, f.date), React.createElement("strong", {
    className: "right"
  }, f.home), React.createElement("span", {
    className: "score-chip"
  }, f.homeScore, " \u2014 ", f.awayScore), React.createElement("strong", null, f.away), React.createElement("button", {
    className: "del-icon",
    onClick: () => deleteFixture(f.id),
    "aria-label": "Eliminar partido"
  }, React.createElement(Icon, {
    name: "trash",
    size: 13
  })))), !recent.length && React.createElement("div", {
    className: "empty-state sm"
  }, "Todav\xEDa no hay resultados cargados.")))), tab === "fixture" && React.createElement("div", {
    className: "fixture-layout"
  }, React.createElement("div", {
    className: "fixture-days"
  }, React.createElement("div", {
    className: "date-filter-row"
  }, React.createElement("span", null, "Filtrar por fecha"), React.createElement("input", {
    type: "date",
    value: dateFilter.from,
    onChange: e => setDateFilter(v => ({
      ...v,
      from: e.target.value
    }))
  }), React.createElement("span", null, "a"), React.createElement("input", {
    type: "date",
    value: dateFilter.to,
    onChange: e => setDateFilter(v => ({
      ...v,
      to: e.target.value
    }))
  }), (dateFilter.from || dateFilter.to) && React.createElement("button", {
    className: "btn sm ghost",
    onClick: () => setDateFilter({
      from: "",
      to: ""
    })
  }, "Quitar filtro")), Object.keys(byDate).sort().map(date => React.createElement("div", {
    key: date,
    className: "fixture-day"
  }, React.createElement("div", {
    className: "fixture-day-label"
  }, date), byDate[date].map(f => {
    const draft = scoreDrafts[f.id] || {};
    return React.createElement("article", {
      key: f.id,
      className: `fixture-card ${!f.played ? "pending" : ""}`
    }, React.createElement("div", {
      className: "fixture-card-top"
    }, React.createElement("span", {
      className: "muted-note"
    }, f.date), React.createElement("span", {
      className: `badge ${f.played ? "final" : "pending"}`
    }, f.played ? "Final" : "Pendiente")), React.createElement("div", {
      className: "fixture-teams"
    }, React.createElement("div", {
      className: "fixture-team right"
    }, React.createElement("strong", null, f.home), React.createElement(Crest, _extends({}, crestFor(f.home), {
      size: 24
    }))), f.played ? React.createElement("span", {
      className: "score-chip"
    }, f.homeScore, " \u2013 ", f.awayScore) : React.createElement("span", {
      className: "score-inputs"
    }, React.createElement("input", {
      type: "number",
      min: "0",
      value: draft.home ?? "",
      onChange: e => setScoreDrafts(s => ({
        ...s,
        [f.id]: {
          ...s[f.id],
          home: e.target.value
        }
      })),
      placeholder: "\u2013"
    }), React.createElement("span", null, "\u2013"), React.createElement("input", {
      type: "number",
      min: "0",
      value: draft.away ?? "",
      onChange: e => setScoreDrafts(s => ({
        ...s,
        [f.id]: {
          ...s[f.id],
          away: e.target.value
        }
      })),
      placeholder: "\u2013"
    })), React.createElement("div", {
      className: "fixture-team"
    }, React.createElement(Crest, _extends({}, crestFor(f.away), {
      size: 24
    })), React.createElement("strong", null, f.away))), React.createElement("div", {
      className: "fixture-card-foot"
    }, React.createElement("button", {
      className: "del-icon",
      onClick: () => deleteFixture(f.id),
      "aria-label": "Eliminar partido"
    }, React.createElement(Icon, {
      name: "trash",
      size: 13
    })), !f.played && React.createElement("button", {
      className: "btn primary sm",
      onClick: () => saveScore(f)
    }, "Guardar")));
  }))), !fixturesInRange.length && React.createElement("div", {
    className: "empty-state"
  }, fixtures.length ? "No hay partidos en ese rango de fechas." : "Todavía no hay partidos cargados. Agregá uno desde la pestaña Tabla.")), React.createElement("div", {
    className: "fixture-side"
  }, React.createElement("section", {
    className: "card"
  }, React.createElement("div", {
    className: "panel-head-row"
  }, React.createElement("span", null, "Tabla"), React.createElement("button", {
    className: "link-btn",
    onClick: () => setTab("table")
  }, "Ver completa \u2192")), standings.slice(0, 5).map((t, i) => React.createElement("div", {
    key: t.name,
    className: "mini-standing-row"
  }, React.createElement("span", {
    className: `pos-badge sm ${i === 0 ? "first" : ""}`
  }, i + 1), React.createElement("strong", null, t.name), React.createElement("span", {
    className: t.gf - t.gc > 0 ? "pos-diff" : t.gf - t.gc < 0 ? "neg-diff" : ""
  }, t.gf - t.gc > 0 ? "+" : "", t.gf - t.gc), React.createElement("strong", null, t.pts))), !standings.length && React.createElement("div", {
    className: "empty-state sm"
  }, "Sin datos todav\xEDa.")))), tab === "cup" && React.createElement(LeagueCup, {
    league: competition,
    setLeague: setCompetition,
    teamNameOptions: teamNameOptions,
    crestFor: crestFor
  }));
}
function getCupWinner(match) {
  if (!match) return null;
  if (match.scoreA === undefined || match.scoreB === undefined || match.scoreA === "" || match.scoreB === "") return null;
  const a = Number(match.scoreA),
    b = Number(match.scoreB);
  if (a > b) return "a";
  if (b > a) return "b";
  if (match.penA !== undefined && match.penB !== undefined && match.penA !== "" && match.penB !== "") {
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
        match
      });
    }
    rounds.push(matches);
    currentTeams = matches.map(m => {
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
function LeagueCup({
  league,
  setLeague,
  teamNameOptions,
  crestFor
}) {
  const cup = league.cup || null;
  const [setupSize, setSetupSize] = React.useState(8);
  const [setupNames, setSetupNames] = React.useState(Array(32).fill(""));
  const [shuffle, setShuffle] = React.useState(true);
  const generateCup = () => {
    const names = setupNames.slice(0, setupSize).map(n => n.trim());
    if (names.some(n => !n)) return window.__toast?.(`Completá el nombre de los ${setupSize} equipos`);
    const teams = shuffle ? window.fisherYates(names) : names;
    setLeague(l => ({
      ...l,
      cup: {
        size: setupSize,
        teams,
        matches: {}
      }
    }));
    window.__toast?.("Cuadro generado");
  };
  const resetCup = () => {
    if (!confirm("¿Reiniciar el cuadro eliminatorio? Se perderán los resultados cargados.")) return;
    setLeague(l => ({
      ...l,
      cup: null
    }));
  };
  const setCupScore = (key, field, value) => {
    setLeague(l => {
      const prev = l.cup.matches?.[key] || {};
      const {
        winnerPick,
        ...rest
      } = prev;
      return {
        ...l,
        cup: {
          ...l.cup,
          matches: {
            ...l.cup.matches,
            [key]: {
              ...rest,
              [field]: value
            }
          }
        }
      };
    });
  };
  const setCupWinnerPick = (key, side) => {
    setLeague(l => ({
      ...l,
      cup: {
        ...l.cup,
        matches: {
          ...l.cup.matches,
          [key]: {
            ...(l.cup.matches?.[key] || {}),
            winnerPick: side
          }
        }
      }
    }));
  };
  const setCupPenalty = (key, field, value) => {
    setLeague(l => {
      const prev = l.cup.matches?.[key] || {};
      const {
        winnerPick,
        ...rest
      } = prev;
      return {
        ...l,
        cup: {
          ...l.cup,
          matches: {
            ...l.cup.matches,
            [key]: {
              ...rest,
              [field]: value
            }
          }
        }
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
    return React.createElement("div", {
      className: "card cup-setup"
    }, React.createElement("div", {
      className: "panel-head-row"
    }, React.createElement("span", null, "Nuevo cuadro eliminatorio")), React.createElement("div", {
      className: "seg",
      style: {
        marginBottom: 14
      }
    }, [4, 8, 16, 32].map(n => React.createElement("button", {
      key: n,
      className: setupSize === n ? "on" : "",
      onClick: () => setSetupSize(n)
    }, n, " equipos"))), React.createElement("datalist", {
      id: "league-team-names"
    }, teamNameOptions.map(name => React.createElement("option", {
      key: name,
      value: name
    }))), React.createElement("div", {
      className: "cup-setup-grid"
    }, Array.from({
      length: setupSize
    }).map((_, i) => React.createElement("input", {
      key: i,
      list: "league-team-names",
      value: setupNames[i] || "",
      onChange: e => setSetupNames(prev => {
        const next = prev.slice();
        next[i] = e.target.value;
        return next;
      }),
      placeholder: `Equipo ${i + 1}`
    }))), React.createElement("label", {
      className: "toggle-row"
    }, React.createElement("input", {
      type: "checkbox",
      checked: shuffle,
      onChange: e => setShuffle(e.target.checked)
    }), " ", React.createElement("span", null, "Sortear posiciones del cuadro")), React.createElement("button", {
      className: "btn primary",
      onClick: generateCup
    }, React.createElement(Icon, {
      name: "shuffle",
      size: 14
    }), " Generar cuadro"));
  }
  const rounds = buildCupRounds(cup);
  const finalRoundIdx = rounds.length - 1;
  const finalMatch = rounds[finalRoundIdx][0];
  const champion = finalMatch ? getCupWinner(finalMatch.match) : null;
  const championName = champion === "a" ? finalMatch.teamA : champion === "b" ? finalMatch.teamB : null;
  const sideRounds = rounds.slice(0, finalRoundIdx);
  const renderMatch = m => {
    const winner = getCupWinner(m.match);
    const canScore = m.teamA && m.teamB;
    const tiedScore = canScore && m.match.scoreA !== "" && m.match.scoreB !== "" && m.match.scoreA !== undefined && m.match.scoreB !== undefined && Number(m.match.scoreA) === Number(m.match.scoreB);
    const stepper = (field, value, onStep, onChange) => React.createElement("div", {
      className: "cup-score-stepper"
    }, React.createElement("button", {
      type: "button",
      onClick: () => onStep(field, value, -1),
      "aria-label": "Restar"
    }, "\u2212"), React.createElement("input", {
      type: "number",
      min: "0",
      value: value ?? "",
      onChange: e => onChange(field, e.target.value)
    }), React.createElement("button", {
      type: "button",
      onClick: () => onStep(field, value, 1),
      "aria-label": "Sumar"
    }, "+"));
    return React.createElement("div", {
      key: m.key,
      className: "cup-match"
    }, React.createElement("div", {
      className: `cup-team ${winner === "a" ? "winner" : ""}`
    }, m.teamA && React.createElement(Crest, _extends({}, crestFor(m.teamA), {
      size: 18
    })), React.createElement("span", {
      className: "cup-team-name"
    }, m.teamA || "Por definir"), canScore && stepper("scoreA", m.match.scoreA, (f, v, d) => stepCupScore(m.key, f, v, d), (f, v) => setCupScore(m.key, f, v))), React.createElement("div", {
      className: `cup-team ${winner === "b" ? "winner" : ""}`
    }, m.teamB && React.createElement(Crest, _extends({}, crestFor(m.teamB), {
      size: 18
    })), React.createElement("span", {
      className: "cup-team-name"
    }, m.teamB || "Por definir"), canScore && stepper("scoreB", m.match.scoreB, (f, v, d) => stepCupScore(m.key, f, v, d), (f, v) => setCupScore(m.key, f, v))), tiedScore && React.createElement("div", {
      className: "cup-tiebreak"
    }, React.createElement("span", null, "Empate \xB7 penales"), React.createElement("div", {
      className: "cup-pen-row"
    }, stepper("penA", m.match.penA, (f, v, d) => stepCupPenalty(m.key, f, v, d), (f, v) => setCupPenalty(m.key, f, v)), React.createElement("span", {
      className: "cup-pen-sep"
    }, "\u2013"), stepper("penB", m.match.penB, (f, v, d) => stepCupPenalty(m.key, f, v, d), (f, v) => setCupPenalty(m.key, f, v))), !winner && React.createElement("div", {
      className: "cup-tiebreak-manual"
    }, React.createElement("span", null, "o eleg\xED a mano:"), React.createElement("button", {
      onClick: () => setCupWinnerPick(m.key, "a")
    }, m.teamA), React.createElement("button", {
      onClick: () => setCupWinnerPick(m.key, "b")
    }, m.teamB))));
  };
  return React.createElement("div", null, React.createElement("div", {
    className: "cup-toolbar"
  }, React.createElement("span", {
    className: "muted-note"
  }, cup.size, " equipos \xB7 eliminaci\xF3n directa"), React.createElement("button", {
    className: "btn sm ghost",
    onClick: resetCup
  }, React.createElement(Icon, {
    name: "refresh",
    size: 12
  }), " Reiniciar cuadro")), React.createElement("div", {
    className: "cup-bracket"
  }, React.createElement("div", {
    className: "cup-side"
  }, sideRounds.map((roundMatches, r) => React.createElement("div", {
    key: r,
    className: "cup-round"
  }, React.createElement("div", {
    className: "cup-round-label"
  }, cupRoundLabel(r, rounds.length)), React.createElement("div", {
    className: "cup-round-matches"
  }, roundMatches.slice(0, roundMatches.length / 2).map(renderMatch))))), React.createElement("div", {
    className: "cup-round cup-champion-col"
  }, React.createElement("div", {
    className: "cup-round-label"
  }, "Final"), React.createElement("div", {
    className: "cup-round-matches cup-round-matches-final"
  }, renderMatch(finalMatch)), React.createElement("div", {
    className: "cup-round-label",
    style: {
      marginTop: 18
    }
  }, "Campe\xF3n"), React.createElement("div", {
    className: `cup-champion-card ${championName ? "has-winner" : ""}`
  }, React.createElement(Icon, {
    name: "trophy",
    size: 18
  }), React.createElement("span", null, championName || "Por definir"))), React.createElement("div", {
    className: "cup-side"
  }, sideRounds.slice().reverse().map((roundMatches, ri) => {
    const r = sideRounds.length - 1 - ri;
    return React.createElement("div", {
      key: r,
      className: "cup-round"
    }, React.createElement("div", {
      className: "cup-round-label"
    }, cupRoundLabel(r, rounds.length)), React.createElement("div", {
      className: "cup-round-matches"
    }, roundMatches.slice(roundMatches.length / 2).map(renderMatch)));
  }))));
}
//# sourceURL=src/page-league.jsx
