function inLastDays(dateStr, days, from = new Date()) {
  const d = new Date(dateStr);
  const diff = (from - d) / 86400000;
  return diff >= 0 && diff < days;
}
function CoachPage() {
  const [roster, setRoster] = window.useStore("roster", window.DEFAULT_ROSTER);
  const [sessions, setSessions] = window.useStore("trainingSessions", []);
  const [attendance, setAttendance] = window.useStore("attendance", {});
  const [evaluations, setEvaluations] = window.useStore("evaluations", []);
  const [objectives, setObjectives] = window.useStore("objectives", []);
  const [selected, setSelected] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [sessionModal, setSessionModal] = React.useState(false);
  const [trainingTitle, setTrainingTitle] = React.useState("Entrenamiento");
  const [trainingDate, setTrainingDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [showSessions, setShowSessions] = React.useState(false);
  const [newObjective, setNewObjective] = React.useState("");
  const [showEvalForm, setShowEvalForm] = React.useState(false);
  const [form, setForm] = React.useState({
    rating: 7,
    good: "",
    improve: "",
    goal: "",
    context: "training"
  });
  const dossierRef = React.useRef(null);
  const sessionsDialogRef = window.useDialogAccessibility(showSessions, () => setShowSessions(false));
  const newSessionDialogRef = window.useDialogAccessibility(sessionModal, () => setSessionModal(false));
  const exportDossier = async playerName => {
    if (!window.html2canvas || !dossierRef.current) return window.__toast?.("Export no disponible todavía, esperá un segundo");
    window.__toast?.("Generando imagen...");
    try {
      const canvas = await window.html2canvas(dossierRef.current, {
        backgroundColor: "#0e1210",
        scale: 2,
        useCORS: true,
        logging: false
      });
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${playerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-ficha.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        window.__toast?.("Ficha descargada");
      }, "image/png");
    } catch (_) {
      window.__toast?.("Error al exportar la ficha");
    }
  };
  const attendancePct = playerId => sessions.length ? Math.round(sessions.filter(s => (attendance[s.id] || []).includes(playerId)).length / sessions.length * 100) : 0;
  const lastEval = playerId => evaluations.filter(e => e.playerId === playerId).sort((a, b) => b.date.localeCompare(a.date))[0];
  const ratingsTrend = playerId => evaluations.filter(e => e.playerId === playerId).sort((a, b) => a.date.localeCompare(b.date)).map(e => e.rating);
  const addSession = () => {
    const id = `tr${Date.now()}`;
    setSessions(prev => [...prev, {
      id,
      title: trainingTitle.trim() || "Entrenamiento",
      date: trainingDate
    }]);
    setAttendance(prev => ({
      ...prev,
      [id]: []
    }));
    setSessionModal(false);
    window.__toast?.("Entrenamiento creado");
  };
  const toggleAttendance = (sessionId, playerId) => setAttendance(prev => {
    const ids = new Set(prev[sessionId] || []);
    ids.has(playerId) ? ids.delete(playerId) : ids.add(playerId);
    return {
      ...prev,
      [sessionId]: [...ids]
    };
  });
  const saveEvaluation = () => {
    if (!selected) return;
    setEvaluations(prev => [...prev, {
      id: `ev${Date.now()}`,
      playerId: selected,
      date: new Date().toISOString().slice(0, 10),
      ...form,
      rating: Number(form.rating) || 0
    }]);
    setForm({
      rating: 7,
      good: "",
      improve: "",
      goal: "",
      context: "training"
    });
    setShowEvalForm(false);
    window.__toast?.("Evaluación guardada");
  };
  const setAttrs = (playerId, key, value) => setRoster(prev => prev.map(p => p.id === playerId ? {
    ...p,
    attrs: {
      ...(p.attrs || DEFAULT_ATTRS),
      [key]: Number(value)
    }
  } : p));
  const addObjective = playerId => {
    if (!newObjective.trim()) return;
    setObjectives(prev => [...prev, {
      id: `ob${Date.now()}`,
      playerId,
      text: newObjective.trim(),
      done: false
    }]);
    setNewObjective("");
  };
  const toggleObjective = id => setObjectives(prev => prev.map(o => o.id === id ? {
    ...o,
    done: !o.done
  } : o));
  const deleteObjective = id => setObjectives(prev => prev.filter(o => o.id !== id));
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const sessionsThisMonth = sessions.filter(s => s.date.slice(0, 7) === thisMonth).length;
  const evaluationsLast30 = evaluations.filter(e => inLastDays(e.date, 30, now)).length;
  const avgRating = evaluations.length ? (evaluations.reduce((a, e) => a + e.rating, 0) / evaluations.length).toFixed(1) : "—";
  const avgAttendance = sessions.length ? Math.round(roster.reduce((a, p) => a + attendancePct(p.id), 0) / (roster.length || 1)) : 0;
  const nextSession = sessions.slice().sort((a, b) => a.date.localeCompare(b.date)).find(s => s.date >= now.toISOString().slice(0, 10)) || sessions.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  const filtered = roster.filter(p => {
    if (filter === "low") return attendancePct(p.id) < 60;
    if (filter === "unrated") {
      const le = lastEval(p.id);
      return !le || !inLastDays(le.date, 21, now);
    }
    return true;
  });
  const player = roster.find(p => p.id === selected);
  if (player) {
    const attrs = player.attrs || DEFAULT_ATTRS;
    const playerEvaluations = evaluations.filter(e => e.playerId === selected).sort((a, b) => b.date.localeCompare(a.date));
    const evoPoints = evaluations.filter(e => e.playerId === selected).sort((a, b) => a.date.localeCompare(b.date)).slice(-8).map(e => ({
      v: e.rating,
      d: e.date
    }));
    const pct = attendancePct(selected);
    const streak = sessions.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-8);
    const playerObjectives = objectives.filter(o => o.playerId === selected);
    return React.createElement("div", null, React.createElement("div", {
      className: "crumbs"
    }, React.createElement("button", {
      className: "crumb-btn",
      onClick: () => setSelected(null)
    }, "Entrenador"), React.createElement(Icon, {
      name: "chevronR",
      size: 13
    }), React.createElement("button", {
      className: "crumb-btn",
      onClick: () => setSelected(null)
    }, "Plantel"), React.createElement(Icon, {
      name: "chevronR",
      size: 13
    }), React.createElement("span", {
      className: "crumb-current"
    }, player.name)), React.createElement("div", {
      className: "dossier-head"
    }, React.createElement("div", null), React.createElement("button", {
      className: "btn",
      onClick: () => exportDossier(player.name)
    }, React.createElement(Icon, {
      name: "download",
      size: 13
    }), " Exportar ficha"), React.createElement("button", {
      className: "btn primary",
      onClick: () => setShowEvalForm(v => !v)
    }, React.createElement(Icon, {
      name: "plus",
      size: 14
    }), " Nueva evaluaci\xF3n")), React.createElement("div", {
      className: "dossier-grid",
      ref: dossierRef
    }, React.createElement("div", {
      className: "dossier-col"
    }, React.createElement("section", {
      className: "card dossier-hero"
    }, React.createElement("div", {
      className: "dossier-avatar",
      style: {
        background: window.colorFor(player.name)
      }
    }, window.initials(player.name)), React.createElement("h2", null, player.name), React.createElement("div", {
      className: "tag-row"
    }, React.createElement("span", {
      className: "mini-tag"
    }, player.pos), React.createElement("span", {
      className: "mini-tag"
    }, "#", player.num), player.preferredFoot && React.createElement("span", {
      className: "mini-tag"
    }, player.preferredFoot === "left" ? "Zurdo" : player.preferredFoot === "both" ? "Ambas piernas" : "Diestro")), React.createElement("div", {
      className: "dossier-quickstats"
    }, React.createElement("div", null, React.createElement("strong", null, avgRatingOf(playerEvaluations)), React.createElement("span", null, "Nota media")), React.createElement("div", null, React.createElement("strong", null, playerEvaluations.length), React.createElement("span", null, "Evaluaciones")), React.createElement("div", null, React.createElement("strong", null, pct, "%"), React.createElement("span", null, "Asistencia")))), React.createElement("section", {
      className: "card"
    }, React.createElement("div", {
      className: "panel-head-row"
    }, React.createElement("span", null, "Perfil de atributos"), React.createElement("span", {
      className: "lime-note"
    }, "Media ", avgAttrOf(attrs))), React.createElement(RadarChart, {
      values: attrs
    }), React.createElement("div", {
      className: "attrs-edit"
    }, RADAR_AXES.map(axis => React.createElement("label", {
      key: axis.key,
      className: "attr-row"
    }, React.createElement("span", null, axis.label), React.createElement("input", {
      type: "range",
      min: "1",
      max: "10",
      value: attrs[axis.key] ?? 6,
      onChange: e => setAttrs(selected, axis.key, e.target.value)
    }), React.createElement("b", null, attrs[axis.key] ?? 6))))), React.createElement("section", {
      className: "card"
    }, React.createElement("div", {
      className: "panel-head-row"
    }, React.createElement("span", null, "Objetivos activos"), React.createElement("span", {
      className: "muted-note"
    }, playerObjectives.filter(o => o.done).length, " de", " ", playerObjectives.length)), React.createElement("div", {
      className: "objectives-list"
    }, playerObjectives.map(o => React.createElement("div", {
      key: o.id,
      className: `objective-row ${o.done ? "done" : ""}`
    }, React.createElement("button", {
      className: "objective-check",
      onClick: () => toggleObjective(o.id)
    }, o.done && React.createElement(Icon, {
      name: "check",
      size: 12
    })), React.createElement("span", null, o.text), React.createElement("button", {
      className: "objective-del",
      onClick: () => deleteObjective(o.id)
    }, "\xD7"))), !playerObjectives.length && React.createElement("div", {
      className: "empty-state sm"
    }, "Sin objetivos activos.")), React.createElement("div", {
      className: "objective-add"
    }, React.createElement("input", {
      value: newObjective,
      onChange: e => setNewObjective(e.target.value),
      placeholder: "Nuevo objetivo\u2026",
      onKeyDown: e => e.key === "Enter" && addObjective(selected)
    }), React.createElement("button", {
      className: "btn sm",
      onClick: () => addObjective(selected)
    }, React.createElement(Icon, {
      name: "plus",
      size: 12
    }))))), React.createElement("div", {
      className: "dossier-col"
    }, React.createElement("section", {
      className: "dossier-pair"
    }, React.createElement("div", {
      className: "card attendance-card"
    }, React.createElement(Donut, {
      pct: pct
    }), React.createElement("div", null, React.createElement("div", {
      className: "panel-head-row",
      style: {
        marginBottom: 2
      }
    }, React.createElement("span", null, "Asistencia")), React.createElement("div", {
      className: "muted"
    }, sessions.filter(s => (attendance[s.id] || []).includes(selected)).length, " ", "de ", sessions.length, " sesiones"))), React.createElement("div", {
      className: "card"
    }, React.createElement("div", {
      className: "panel-head-row"
    }, React.createElement("span", null, "Racha \xB7 \xFAltimas ", streak.length, " sesiones")), React.createElement("div", {
      className: "streak-row"
    }, streak.map(s => React.createElement("span", {
      key: s.id,
      className: `streak-dot ${(attendance[s.id] || []).includes(selected) ? "on" : ""}`,
      title: s.date
    }))), React.createElement("div", {
      className: "muted-note"
    }, "Presente en", " ", streak.filter(s => (attendance[s.id] || []).includes(selected)).length, " ", "\xB7 falt\xF3", " ", streak.filter(s => !(attendance[s.id] || []).includes(selected)).length))), React.createElement("section", {
      className: "card"
    }, React.createElement("div", {
      className: "panel-head-row"
    }, React.createElement("span", null, "Evoluci\xF3n de notas")), React.createElement(EvolutionChart, {
      points: evoPoints
    }), evoPoints.length > 0 && React.createElement("div", {
      className: "evo-dates"
    }, evoPoints.map((p, i) => React.createElement("span", {
      key: i
    }, p.d.slice(5))))), showEvalForm && React.createElement("section", {
      className: "card eval-form-card"
    }, React.createElement("div", {
      className: "panel-head-row"
    }, React.createElement("span", null, "Nueva evaluaci\xF3n"), React.createElement("button", {
      className: "btn sm ghost",
      onClick: () => setShowEvalForm(false)
    }, "Cancelar")), React.createElement("div", {
      className: "form-grid-wide"
    }, React.createElement("label", {
      className: "field"
    }, React.createElement("span", null, "Contexto"), React.createElement("select", {
      value: form.context,
      onChange: e => setForm(v => ({
        ...v,
        context: e.target.value
      }))
    }, React.createElement("option", {
      value: "training"
    }, "Entrenamiento"), React.createElement("option", {
      value: "match"
    }, "Partido"))), React.createElement("label", {
      className: "field"
    }, React.createElement("span", null, "Nota"), React.createElement("input", {
      type: "number",
      min: "1",
      max: "10",
      value: form.rating,
      onChange: e => setForm(v => ({
        ...v,
        rating: e.target.value
      }))
    })), React.createElement("label", {
      className: "field span-2"
    }, React.createElement("span", null, "Qu\xE9 hizo bien"), React.createElement("textarea", {
      value: form.good,
      onChange: e => setForm(v => ({
        ...v,
        good: e.target.value
      }))
    })), React.createElement("label", {
      className: "field span-2"
    }, React.createElement("span", null, "Qu\xE9 debe mejorar"), React.createElement("textarea", {
      value: form.improve,
      onChange: e => setForm(v => ({
        ...v,
        improve: e.target.value
      }))
    })), React.createElement("label", {
      className: "field span-2"
    }, React.createElement("span", null, "Pr\xF3ximo objetivo"), React.createElement("input", {
      value: form.goal,
      onChange: e => setForm(v => ({
        ...v,
        goal: e.target.value
      }))
    }))), React.createElement("button", {
      className: "btn primary",
      onClick: saveEvaluation
    }, "Guardar evaluaci\xF3n")), React.createElement("section", {
      className: "card"
    }, React.createElement("div", {
      className: "panel-head-row"
    }, React.createElement("span", null, "Historial de evaluaciones"), React.createElement("span", {
      className: "muted-note"
    }, playerEvaluations.length, " en total")), playerEvaluations.length ? React.createElement("div", {
      className: "eval-timeline"
    }, playerEvaluations.map(ev => React.createElement("article", {
      key: ev.id
    }, React.createElement("span", {
      className: "timeline-dot"
    }), React.createElement("div", {
      className: "timeline-head"
    }, React.createElement("strong", null, ev.date, " \xB7", " ", ev.context === "match" ? "Partido" : "Entrenamiento"), React.createElement("span", {
      className: "chip lime"
    }, ev.rating, "/10")), ev.good && React.createElement("p", null, React.createElement("b", null, "Bien:"), " ", ev.good), ev.improve && React.createElement("p", null, React.createElement("b", null, "A mejorar:"), " ", ev.improve), ev.goal && React.createElement("p", null, React.createElement("b", null, "Objetivo:"), " ", ev.goal)))) : React.createElement("div", {
      className: "empty-state"
    }, "Todav\xEDa no hay evaluaciones para este jugador.")))));
  }
  return React.createElement("div", null, React.createElement("div", {
    className: "page-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Modo entrenador"), React.createElement("h1", {
    className: "page-title"
  }, "Tu plantel"), React.createElement("div", {
    className: "page-sub"
  }, "Asistencia, evoluci\xF3n y objetivos de un vistazo.")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement("button", {
    className: "btn",
    onClick: () => setSessionModal(true)
  }, React.createElement(Icon, {
    name: "session",
    size: 14
  }), " Nueva sesi\xF3n"), React.createElement("button", {
    className: "btn",
    onClick: () => window.go("settings")
  }, "Configurar perfil"))), React.createElement("div", {
    className: "stat-strip"
  }, React.createElement("div", {
    className: "stat-card"
  }, React.createElement("div", {
    className: "stat-n"
  }, avgAttendance, "%"), React.createElement("div", {
    className: "stat-l"
  }, "Asistencia promedio")), React.createElement("div", {
    className: "stat-card"
  }, React.createElement("div", {
    className: "stat-n"
  }, sessionsThisMonth), React.createElement("div", {
    className: "stat-l"
  }, "Sesiones este mes")), React.createElement("div", {
    className: "stat-card"
  }, React.createElement("div", {
    className: "stat-n"
  }, evaluationsLast30), React.createElement("div", {
    className: "stat-l"
  }, "Evaluaciones \xB7 30 d\xEDas")), React.createElement("div", {
    className: "stat-card"
  }, React.createElement("div", {
    className: "stat-n"
  }, avgRating), React.createElement("div", {
    className: "stat-l"
  }, "Nota media"))), nextSession && React.createElement("div", {
    className: "card next-session-banner"
  }, React.createElement("span", {
    className: "banner-icon"
  }, React.createElement(Icon, {
    name: "session",
    size: 18
  })), React.createElement("div", {
    className: "banner-body"
  }, React.createElement("strong", null, nextSession.title, " \xB7 ", nextSession.date), React.createElement("div", {
    className: "muted"
  }, (attendance[nextSession.id] || []).length, " de ", roster.length, " ", "confirmados")), React.createElement("div", {
    className: "avatar-stack"
  }, roster.slice(0, 4).map(p => React.createElement("span", {
    key: p.id,
    className: "stack-avatar",
    style: {
      background: window.colorFor(p.name)
    }
  }, window.initials(p.name))), roster.length > 4 && React.createElement("span", {
    className: "stack-more"
  }, "+", roster.length - 4)), React.createElement("button", {
    className: "btn primary sm",
    onClick: () => setShowSessions(true)
  }, "Pasar asistencia")), React.createElement("div", {
    className: "panel-head-row",
    style: {
      margin: "22px 0 12px"
    }
  }, React.createElement("span", null, "Jugadores \xB7 ", roster.length), React.createElement("div", {
    className: "seg"
  }, React.createElement("button", {
    className: filter === "all" ? "on" : "",
    onClick: () => setFilter("all")
  }, "Todos"), React.createElement("button", {
    className: filter === "low" ? "on" : "",
    onClick: () => setFilter("low")
  }, "Baja asistencia"), React.createElement("button", {
    className: filter === "unrated" ? "on" : "",
    onClick: () => setFilter("unrated")
  }, "Sin evaluar"))), React.createElement("div", {
    className: "roster-grid"
  }, filtered.map(p => {
    const le = lastEval(p.id);
    const trend = ratingsTrend(p.id);
    const pct = attendancePct(p.id);
    const stale = !le || !inLastDays(le.date, 21, now);
    return React.createElement("button", {
      key: p.id,
      className: "roster-overview-card",
      onClick: () => setSelected(p.id)
    }, React.createElement("div", {
      className: "roc-top"
    }, React.createElement("span", {
      className: "mini-avatar",
      style: {
        background: window.colorFor(p.name)
      }
    }, window.initials(p.name)), React.createElement("div", {
      className: "roc-name"
    }, React.createElement("strong", null, p.name), React.createElement("small", null, p.pos, " \xB7 #", p.num)), le ? React.createElement("span", {
      className: "chip lime"
    }, le.rating, "/10") : React.createElement("span", {
      className: "chip"
    }, "s/e")), React.createElement("div", {
      className: "roc-bar-row"
    }, React.createElement("span", null, "ASISTENCIA"), React.createElement("span", null, pct, "%")), React.createElement("div", {
      className: "roc-bar"
    }, React.createElement("div", {
      className: "roc-bar-fill",
      style: {
        width: `${pct}%`,
        background: pct < 60 ? "var(--accent-2)" : "var(--accent)"
      }
    })), React.createElement("div", {
      className: "roc-foot"
    }, trend.length > 1 ? React.createElement(Sparkline, {
      values: trend,
      color: pct < 60 ? "var(--accent-2)" : "var(--accent)"
    }) : React.createElement("span", null), stale ? React.createElement("span", {
      className: "stale-note"
    }, "Sin evaluar hace tiempo") : React.createElement("span", {
      className: "roc-link"
    }, "Ver ficha \u2192")));
  }), !filtered.length && React.createElement("div", {
    className: "empty-state"
  }, "No hay jugadores en este filtro.")), showSessions && React.createElement("div", {
    className: "modal-back",
    onClick: () => setShowSessions(false)
  }, React.createElement("div", {
    className: "modal",
    ref: sessionsDialogRef,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Pasar asistencia",
    tabIndex: "-1",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "modal-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Entrenamientos"), React.createElement("div", {
    className: "modal-title"
  }, "Pasar asistencia")), React.createElement("button", {
    className: "btn sm ghost",
    "aria-label": "Cerrar",
    onClick: () => setShowSessions(false)
  }, "\u2715")), React.createElement("div", {
    className: "modal-body session-modal-body"
  }, sessions.slice().reverse().map(session => React.createElement("details", {
    key: session.id,
    open: session.id === nextSession?.id
  }, React.createElement("summary", null, React.createElement("strong", null, session.title), React.createElement("small", null, session.date, " \xB7 ", (attendance[session.id] || []).length, "/", roster.length)), roster.map(p => React.createElement("label", {
    key: p.id,
    className: "check-row"
  }, React.createElement("input", {
    type: "checkbox",
    checked: (attendance[session.id] || []).includes(p.id),
    onChange: () => toggleAttendance(session.id, p.id)
  }), React.createElement("span", null, p.name))))), !sessions.length && React.createElement("div", {
    className: "empty-state"
  }, "Todav\xEDa no hay entrenamientos creados.")))), sessionModal && React.createElement("div", {
    className: "modal-back",
    onClick: () => setSessionModal(false)
  }, React.createElement("div", {
    className: "modal",
    ref: newSessionDialogRef,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Nueva sesi\xF3n",
    tabIndex: "-1",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "modal-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Entrenador"), React.createElement("div", {
    className: "modal-title"
  }, "Nueva sesi\xF3n")), React.createElement("button", {
    className: "btn sm ghost",
    "aria-label": "Cerrar",
    onClick: () => setSessionModal(false)
  }, "\u2715")), React.createElement("div", {
    className: "modal-body"
  }, React.createElement("label", {
    className: "field"
  }, React.createElement("span", null, "Nombre"), React.createElement("input", {
    value: trainingTitle,
    onChange: e => setTrainingTitle(e.target.value)
  })), React.createElement("label", {
    className: "field"
  }, React.createElement("span", null, "Fecha"), React.createElement("input", {
    type: "date",
    value: trainingDate,
    onChange: e => setTrainingDate(e.target.value)
  }))), React.createElement("div", {
    className: "modal-foot"
  }, React.createElement("button", {
    className: "btn ghost",
    onClick: () => setSessionModal(false)
  }, "Cancelar"), React.createElement("button", {
    className: "btn primary",
    onClick: addSession
  }, "Crear sesi\xF3n")))));
}
function avgRatingOf(list) {
  if (!list.length) return "—";
  return (list.reduce((a, e) => a + e.rating, 0) / list.length).toFixed(1);
}
function avgAttrOf(attrs) {
  const vals = Object.values(attrs);
  return (vals.reduce((a, v) => a + v, 0) / vals.length).toFixed(1);
}
//# sourceURL=src/page-coach.jsx
