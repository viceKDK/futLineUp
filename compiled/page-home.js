function HomePage() {
  const [teams, setTeams] = window.useStore("teams", window.DEFAULT_SAVED_TEAMS);
  const [profile] = window.useStore("profile", window.DEFAULT_PROFILE);
  const [roster] = window.useStore("roster", window.DEFAULT_ROSTER);
  const [matches, setMatches] = window.useStore("matches", []);
  const [matchInfo] = window.useStore("matchInfo", null);
  const [, setDraft] = window.useStore("editor", null);
  const [filter, setFilter] = React.useState("all");
  const [modal, setModal] = React.useState(null);
  const loadTeam = t => {
    const fIdx = (window.FORMATIONS[t.mode] || []).findIndex(f => f.name === t.formation);
    setDraft({
      teamId: t.id,
      name: t.name,
      mode: t.mode,
      formIdx: Math.max(0, fIdx),
      freeMode: !!t.freeMode,
      kit: {
        design: t.kit,
        primary: t.color,
        secondary: t.secondary || "#0f172a"
      },
      assignedIds: (t.assignedIds || []).slice(),
      freePositions: {
        ...(t.freePositions || {})
      },
      captainId: t.captainId || null,
      substituteIds: (t.substituteIds || []).slice()
    });
    window.go("editor");
  };
  const deleteTeam = t => {
    if (!confirm(`¿Borrar "${t.name}"?`)) return;
    setTeams(prev => prev.filter(x => x.id !== t.id));
  };
  const duplicateTeam = team => {
    const copy = {
      ...team,
      id: `t${Date.now()}`,
      name: `${team.name} (copia)`,
      assignedIds: (team.assignedIds || []).slice(),
      freePositions: structuredClone(team.freePositions || {}),
      substituteIds: (team.substituteIds || []).slice(),
      updatedAt: new Date().toISOString()
    };
    setTeams(prev => [...prev, copy]);
    window.__toast?.("Equipo duplicado");
  };
  const filtered = teams.filter(t => filter === "all" ? true : t.mode === parseInt(filter, 10));
  const lastMatch = matches.length ? matches[matches.length - 1] : null;
  const lastResult = lastMatch ? `${lastMatch.us}–${lastMatch.them}` : "—";
  const topScorers = React.useMemo(() => {
    const totals = {};
    matches.forEach(m => (m.scorers || []).forEach(s => {
      if (!s.playerId || !s.goals) return;
      totals[s.playerId] = (totals[s.playerId] || 0) + Number(s.goals);
    }));
    return Object.entries(totals).map(([playerId, goals]) => ({
      player: roster.find(p => p.id === Number(playerId) || p.id === playerId),
      goals
    })).filter(x => x.player).sort((a, b) => b.goals - a.goals).slice(0, 5);
  }, [matches, roster]);
  return React.createElement("div", null, React.createElement(GuestModeBanner, null), React.createElement(NextMatchBanner, {
    matchInfo: matchInfo
  }), React.createElement("div", {
    className: "page-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, profile.season || (profile.experience === "coach" ? "Modo entrenador" : profile.experience === "league" ? "Modo liga" : "Tu fútbol, a tu manera")), React.createElement("h1", {
    className: "page-title"
  }, "Mis equipos"), React.createElement("div", {
    className: "page-sub"
  }, "Arm\xE1 la alineaci\xF3n, sorte\xE1 pibes, eleg\xED la camiseta. Todo en un solo lado.")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, React.createElement("button", {
    className: "btn",
    onClick: () => setModal({
      type: "match"
    })
  }, "+ Resultado"), React.createElement("button", {
    className: "btn",
    onClick: () => window.go("draw")
  }, "Sortear ahora"), React.createElement("button", {
    className: "btn primary",
    onClick: () => window.go("mode")
  }, "+ Nuevo equipo"))), React.createElement("div", {
    className: "hero-strip"
  }, React.createElement("div", {
    className: "hero-stat"
  }, React.createElement("div", {
    className: "hero-stat-n"
  }, String(teams.length).padStart(2, "0")), React.createElement("div", {
    className: "hero-stat-l"
  }, "equipos")), React.createElement("div", {
    className: "hero-stat"
  }, React.createElement("div", {
    className: "hero-stat-n"
  }, roster.length), React.createElement("div", {
    className: "hero-stat-l"
  }, "jugadores en plantel")), React.createElement("div", {
    className: "hero-stat"
  }, React.createElement("div", {
    className: "hero-stat-n"
  }, String(matches.length).padStart(2, "0")), React.createElement("div", {
    className: "hero-stat-l"
  }, "partidos jugados")), React.createElement("div", {
    className: "hero-stat"
  }, React.createElement("div", {
    className: "hero-stat-n"
  }, lastResult), React.createElement("div", {
    className: "hero-stat-l"
  }, lastMatch ? `vs ${lastMatch.opponent}` : "último resultado"))), matches.length > 0 && React.createElement("div", {
    className: "recent-matches"
  }, React.createElement("div", {
    className: "section-head"
  }, React.createElement("h2", null, "\xDAltimos partidos"), React.createElement("span", {
    className: "chip"
  }, matches.length)), React.createElement("div", {
    className: "matches-row"
  }, matches.slice(-6).reverse().map(m => {
    const team = teams.find(t => t.id === m.teamId);
    const won = m.us > m.them,
      tied = m.us === m.them;
    return React.createElement("div", {
      key: m.id,
      className: "match-chip"
    }, React.createElement("div", {
      className: `match-result ${won ? "win" : tied ? "tie" : "loss"}`
    }, m.us, "\u2013", m.them), React.createElement("div", {
      className: "match-info"
    }, React.createElement("div", {
      className: "match-team"
    }, team?.name || "Mi equipo"), React.createElement("div", {
      className: "match-opp"
    }, "vs ", m.opponent)), React.createElement("button", {
      className: "match-edit",
      onClick: () => setModal({
        type: "match",
        match: m
      }),
      title: "Editar"
    }, "\u270E"), React.createElement("button", {
      className: "match-del",
      onClick: () => {
        if (!confirm("¿Eliminar este resultado?")) return;
        setMatches(prev => prev.filter(x => x.id !== m.id));
      },
      title: "Borrar",
      "aria-label": `Eliminar resultado contra ${m.opponent}`
    }, "\xD7"));
  }))), topScorers.length > 0 && React.createElement("div", {
    className: "scorers-card"
  }, React.createElement("div", {
    className: "panel-head-row"
  }, React.createElement("span", null, "Goleadores"), React.createElement("span", {
    className: "chip"
  }, "Basado en tus partidos cargados")), React.createElement("div", {
    className: "scorers-list"
  }, topScorers.map((s, i) => React.createElement("div", {
    key: s.player.id,
    className: "scorer-row"
  }, React.createElement("span", {
    className: "scorer-pos"
  }, i + 1), React.createElement("div", {
    className: "mini-avatar",
    style: {
      background: window.colorFor(s.player.name)
    }
  }, window.initials(s.player.name)), React.createElement("span", {
    className: "scorer-name"
  }, s.player.name), React.createElement("span", {
    className: "scorer-goals"
  }, s.goals, " gol", s.goals === 1 ? "" : "es"))))), React.createElement("div", {
    className: "section-head"
  }, React.createElement("h2", null, "Equipos guardados"), React.createElement("div", {
    className: "filters"
  }, React.createElement("button", {
    className: `chip ${filter === "all" ? "lime" : ""}`,
    onClick: () => setFilter("all")
  }, "Todos"), React.createElement("button", {
    className: `chip ${filter === "5" ? "lime" : ""}`,
    onClick: () => setFilter("5")
  }, "Fut 5"), React.createElement("button", {
    className: `chip ${filter === "7" ? "lime" : ""}`,
    onClick: () => setFilter("7")
  }, "Fut 7"), React.createElement("button", {
    className: `chip ${filter === "11" ? "lime" : ""}`,
    onClick: () => setFilter("11")
  }, "Fut 11"))), React.createElement("div", {
    className: "teams-grid"
  }, filtered.map(t => React.createElement(TeamCard, {
    key: t.id,
    team: t,
    onOpen: () => loadTeam(t),
    onDuplicate: () => duplicateTeam(t),
    onDelete: () => deleteTeam(t)
  })), React.createElement("button", {
    className: "team-card new",
    onClick: () => window.go("mode")
  }, React.createElement("div", {
    className: "new-plus"
  }, "+"), React.createElement("div", {
    className: "new-label"
  }, "Nuevo equipo"), React.createElement("div", {
    className: "new-sub"
  }, "Eleg\xED modo y empez\xE1"))), React.createElement("div", {
    className: "section-head",
    style: {
      marginTop: 40
    }
  }, React.createElement("h2", null, "Accesos r\xE1pidos")), React.createElement("div", {
    className: "quick-grid"
  }, React.createElement(QuickCard, {
    title: "Editor de alineaci\xF3n",
    sub: "Arrastr\xE1 jugadores a la cancha",
    icon: "editorNav",
    action: () => window.go("editor")
  }), React.createElement(QuickCard, {
    title: "Sorteo de equipos",
    sub: "Con ruleta + jugadores fijos",
    icon: "shuffle",
    action: () => window.go("draw")
  }), React.createElement(QuickCard, {
    title: "Modo rival",
    sub: "Enfrent\xE1 dos alineaciones",
    icon: "target",
    action: () => window.go("rival")
  }), React.createElement(QuickCard, {
    title: "Camisetas",
    sub: "4 dise\xF1os + personalizaci\xF3n",
    icon: "jersey",
    action: () => window.go("kits")
  })), modal?.type === "match" && React.createElement(MatchModal, {
    teams: teams,
    roster: roster,
    initial: modal.match || null,
    onClose: () => setModal(null),
    onSave: m => {
      if (modal.match) {
        setMatches(prev => prev.map(x => x.id === modal.match.id ? {
          ...x,
          ...m
        } : x));
        window.__toast?.("Resultado actualizado");
      } else {
        setMatches(prev => [...prev, {
          ...m,
          id: "m" + Date.now()
        }]);
        window.__toast?.("Resultado guardado");
      }
      setModal(null);
    }
  }));
}
function GuestModeBanner() {
  const [session, setSession] = React.useState(undefined);
  React.useEffect(() => {
    window.fcAuth?.session().then(value => setSession(value || null)).catch(() => setSession(null));
    const subscription = window.fcSupabase?.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription?.data?.subscription?.unsubscribe?.();
  }, []);
  if (session === undefined || session) return null;
  return React.createElement("aside", {
    className: "guest-banner",
    "aria-label": "Modo sin cuenta"
  }, React.createElement("div", {
    className: "guest-banner-icon",
    "aria-hidden": "true"
  }, "\u2713"), React.createElement("div", null, React.createElement("strong", null, "Est\xE1s usando futbolClub sin cuenta"), React.createElement("span", null, "Pod\xE9s crear, guardar y compartir alineaciones. Tus datos quedan en este dispositivo.")), React.createElement("button", {
    className: "btn sm ghost",
    onClick: () => window.go("settings")
  }, "Backup y sincronizaci\xF3n"));
}
function NextMatchBanner({
  matchInfo
}) {
  if (!matchInfo?.date) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (matchInfo.date < today) return null;
  const isToday = matchInfo.date === today;
  const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  let label = matchInfo.date;
  try {
    label = days[new Date(matchInfo.date + "T00:00").getDay()];
  } catch (_) {}
  return React.createElement("aside", {
    className: "next-match-banner",
    "aria-label": "Pr\xF3ximo partido"
  }, React.createElement("div", {
    className: "next-match-icon",
    "aria-hidden": "true"
  }, React.createElement(Icon, {
    name: "session",
    size: 18
  })), React.createElement("div", null, React.createElement("strong", null, isToday ? "¡Partido hoy!" : `Próximo partido · ${label}`, " ", matchInfo.time && `· ${matchInfo.time}`), React.createElement("span", null, matchInfo.venue ? `${matchInfo.venue} · ` : "", "vs", " ", matchInfo.opponent || "rival")), React.createElement("button", {
    className: "btn sm",
    onClick: () => window.go("share")
  }, "Ver detalles"));
}
function MatchModal({
  teams,
  roster,
  initial,
  onClose,
  onSave
}) {
  const dialogRef = window.useDialogAccessibility(true, onClose);
  const [teamId, setTeamId] = React.useState(initial?.teamId || teams[0]?.id || "");
  const [us, setUs] = React.useState(initial?.us ?? 0);
  const [them, setThem] = React.useState(initial?.them ?? 0);
  const [opponent, setOpponent] = React.useState(initial?.opponent || "");
  const [date, setDate] = React.useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [scorers, setScorers] = React.useState(initial?.scorers || []);
  const [scorerPick, setScorerPick] = React.useState(roster[0]?.id ?? "");
  const [scorerGoals, setScorerGoals] = React.useState(1);
  const addScorer = () => {
    if (scorerPick === "") return;
    setScorers(prev => {
      const existing = prev.find(s => s.playerId === scorerPick);
      const goals = Number(scorerGoals) || 1;
      if (existing) return prev.map(s => s.playerId === scorerPick ? {
        ...s,
        goals: s.goals + goals
      } : s);
      return [...prev, {
        playerId: scorerPick,
        goals
      }];
    });
  };
  const removeScorer = playerId => setScorers(prev => prev.filter(s => s.playerId !== playerId));
  const submit = () => {
    if (!teamId) return;
    onSave({
      teamId,
      us: parseInt(us, 10) || 0,
      them: parseInt(them, 10) || 0,
      opponent: opponent.trim() || "Rival",
      date,
      scorers
    });
  };
  return React.createElement("div", {
    className: "modal-back",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal",
    ref: dialogRef,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": initial ? "Editar partido" : "Registrar partido",
    tabIndex: "-1",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "modal-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, initial ? "Editar partido" : "Registrar partido"), React.createElement("div", {
    className: "modal-title"
  }, initial ? "Corregí el resultado" : "Cargá el resultado")), React.createElement("button", {
    className: "btn sm ghost",
    onClick: onClose,
    "aria-label": "Cerrar"
  }, "\u2715")), React.createElement("div", {
    className: "modal-body"
  }, React.createElement("div", {
    className: "form-grid match-form"
  }, React.createElement("label", {
    style: {
      gridColumn: "span 2"
    }
  }, React.createElement("span", null, "Equipo"), React.createElement("select", {
    value: teamId,
    onChange: e => setTeamId(e.target.value)
  }, teams.map(t => React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name)))), React.createElement("label", null, React.createElement("span", null, "Nosotros"), React.createElement("input", {
    type: "number",
    min: "0",
    value: us,
    onChange: e => setUs(e.target.value)
  })), React.createElement("label", null, React.createElement("span", null, "Ellos"), React.createElement("input", {
    type: "number",
    min: "0",
    value: them,
    onChange: e => setThem(e.target.value)
  })), React.createElement("label", {
    style: {
      gridColumn: "span 2"
    }
  }, React.createElement("span", null, "Rival"), React.createElement("input", {
    type: "text",
    value: opponent,
    onChange: e => setOpponent(e.target.value),
    placeholder: "Los del Jueves"
  })), React.createElement("label", {
    style: {
      gridColumn: "span 2"
    }
  }, React.createElement("span", null, "Fecha"), React.createElement("input", {
    type: "date",
    value: date,
    onChange: e => setDate(e.target.value)
  }))), React.createElement("div", {
    className: "scorers-field"
  }, React.createElement("span", {
    className: "scorers-field-label"
  }, "Goleadores (opcional)"), React.createElement("div", {
    className: "scorers-add-row"
  }, React.createElement("select", {
    value: scorerPick,
    onChange: e => setScorerPick(Number(e.target.value) || e.target.value)
  }, roster.map(p => React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.name))), React.createElement("input", {
    type: "number",
    min: "1",
    value: scorerGoals,
    onChange: e => setScorerGoals(e.target.value)
  }), React.createElement("button", {
    className: "btn sm",
    type: "button",
    onClick: addScorer
  }, "+ Agregar")), scorers.length > 0 && React.createElement("div", {
    className: "scorers-chip-row"
  }, scorers.map(s => {
    const p = roster.find(r => r.id === s.playerId);
    if (!p) return null;
    return React.createElement("span", {
      key: s.playerId,
      className: "chip"
    }, p.name, " \xB7 ", s.goals, React.createElement("button", {
      className: "scorer-chip-del",
      onClick: () => removeScorer(s.playerId)
    }, "\xD7"));
  })))), React.createElement("div", {
    className: "modal-foot"
  }, React.createElement("button", {
    className: "btn ghost",
    onClick: onClose
  }, "Cancelar"), React.createElement("button", {
    className: "btn primary",
    onClick: submit
  }, "Guardar"))));
}
function TeamCard({
  team,
  onOpen,
  onDelete,
  onDuplicate
}) {
  return React.createElement("div", {
    className: "team-card-wrap"
  }, React.createElement("button", {
    className: "team-card",
    onClick: onOpen
  }, React.createElement("div", {
    className: "team-card-top"
  }, React.createElement("div", {
    className: "team-kit-thumb"
  }, React.createElement(Kit, {
    design: team.kit,
    primary: team.color,
    secondary: team.secondary || "#0f172a",
    number: team.mode === 11 ? 10 : 7,
    size: 68,
    showNumber: true
  })), React.createElement("div", {
    className: "team-meta-tags"
  }, React.createElement("span", {
    className: "chip lime"
  }, "Fut ", team.mode), React.createElement("span", {
    className: "chip"
  }, team.formation))), React.createElement("div", {
    className: "team-name"
  }, team.name), React.createElement("div", {
    className: "team-foot"
  }, React.createElement("span", null, team.players, " jugadores"), React.createElement("span", {
    className: "dot"
  }, "\xB7"), React.createElement("span", null, team.lastPlayed))), React.createElement("button", {
    className: "team-duplicate",
    onClick: onDuplicate,
    title: "Duplicar equipo",
    "aria-label": `Duplicar ${team.name}`
  }, "\u29C9"), React.createElement("button", {
    className: "team-del",
    onClick: onDelete,
    title: "Borrar equipo",
    "aria-label": `Borrar ${team.name}`
  }, "\xD7"));
}
function QuickCard({
  title,
  sub,
  icon,
  action
}) {
  return React.createElement("button", {
    className: "quick-card",
    onClick: action
  }, React.createElement("div", {
    className: "quick-icon"
  }, React.createElement(Icon, {
    name: icon,
    size: 18
  })), React.createElement("div", {
    className: "quick-body"
  }, React.createElement("div", {
    className: "quick-title"
  }, title), React.createElement("div", {
    className: "quick-sub"
  }, sub)), React.createElement("div", {
    className: "quick-arrow"
  }, "\u2192"));
}
window.mountPage("page-home", React.createElement(HomePage, null));
//# sourceURL=src/page-home.jsx
