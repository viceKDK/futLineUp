// ---- Coach ----
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
  const [trainingDate, setTrainingDate] = React.useState(
    new Date().toISOString().slice(0, 10),
  );
  const [showSessions, setShowSessions] = React.useState(false);
  const [newObjective, setNewObjective] = React.useState("");
  const [showEvalForm, setShowEvalForm] = React.useState(false);
  const [form, setForm] = React.useState({
    rating: 7,
    good: "",
    improve: "",
    goal: "",
    context: "training",
  });
  const dossierRef = React.useRef(null);
  const sessionsDialogRef = window.useDialogAccessibility(showSessions, () =>
    setShowSessions(false),
  );
  const newSessionDialogRef = window.useDialogAccessibility(sessionModal, () =>
    setSessionModal(false),
  );

  const exportDossier = async (playerName) => {
    if (!window.html2canvas || !dossierRef.current)
      return window.__toast?.(
        "Export no disponible todavía, esperá un segundo",
      );
    window.__toast?.("Generando imagen...");
    try {
      const canvas = await window.html2canvas(dossierRef.current, {
        backgroundColor: "#0e1210",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob((blob) => {
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

  const attendancePct = (playerId) =>
    sessions.length
      ? Math.round(
          (sessions.filter((s) => (attendance[s.id] || []).includes(playerId))
            .length /
            sessions.length) *
            100,
        )
      : 0;
  const lastEval = (playerId) =>
    evaluations
      .filter((e) => e.playerId === playerId)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  const ratingsTrend = (playerId) =>
    evaluations
      .filter((e) => e.playerId === playerId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => e.rating);

  const addSession = () => {
    const id = `tr${Date.now()}`;
    setSessions((prev) => [
      ...prev,
      {
        id,
        title: trainingTitle.trim() || "Entrenamiento",
        date: trainingDate,
      },
    ]);
    setAttendance((prev) => ({ ...prev, [id]: [] }));
    setSessionModal(false);
    window.__toast?.("Entrenamiento creado");
  };
  const toggleAttendance = (sessionId, playerId) =>
    setAttendance((prev) => {
      const ids = new Set(prev[sessionId] || []);
      ids.has(playerId) ? ids.delete(playerId) : ids.add(playerId);
      return { ...prev, [sessionId]: [...ids] };
    });
  const saveEvaluation = () => {
    if (!selected) return;
    setEvaluations((prev) => [
      ...prev,
      {
        id: `ev${Date.now()}`,
        playerId: selected,
        date: new Date().toISOString().slice(0, 10),
        ...form,
        rating: Number(form.rating) || 0,
      },
    ]);
    setForm({
      rating: 7,
      good: "",
      improve: "",
      goal: "",
      context: "training",
    });
    setShowEvalForm(false);
    window.__toast?.("Evaluación guardada");
  };
  const setAttrs = (playerId, key, value) =>
    setRoster((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? {
              ...p,
              attrs: { ...(p.attrs || DEFAULT_ATTRS), [key]: Number(value) },
            }
          : p,
      ),
    );
  const addObjective = (playerId) => {
    if (!newObjective.trim()) return;
    setObjectives((prev) => [
      ...prev,
      {
        id: `ob${Date.now()}`,
        playerId,
        text: newObjective.trim(),
        done: false,
      },
    ]);
    setNewObjective("");
  };
  const toggleObjective = (id) =>
    setObjectives((prev) =>
      prev.map((o) => (o.id === id ? { ...o, done: !o.done } : o)),
    );
  const deleteObjective = (id) =>
    setObjectives((prev) => prev.filter((o) => o.id !== id));

  // --- Stats de overview ---
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const sessionsThisMonth = sessions.filter(
    (s) => s.date.slice(0, 7) === thisMonth,
  ).length;
  const evaluationsLast30 = evaluations.filter((e) =>
    inLastDays(e.date, 30, now),
  ).length;
  const avgRating = evaluations.length
    ? (
        evaluations.reduce((a, e) => a + e.rating, 0) / evaluations.length
      ).toFixed(1)
    : "—";
  const avgAttendance = sessions.length
    ? Math.round(
        roster.reduce((a, p) => a + attendancePct(p.id), 0) /
          (roster.length || 1),
      )
    : 0;

  const nextSession =
    sessions
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .find((s) => s.date >= now.toISOString().slice(0, 10)) ||
    sessions.slice().sort((a, b) => b.date.localeCompare(a.date))[0];

  const filtered = roster.filter((p) => {
    if (filter === "low") return attendancePct(p.id) < 60;
    if (filter === "unrated") {
      const le = lastEval(p.id);
      return !le || !inLastDays(le.date, 21, now);
    }
    return true;
  });

  const player = roster.find((p) => p.id === selected);

  if (player) {
    const attrs = player.attrs || DEFAULT_ATTRS;
    const playerEvaluations = evaluations
      .filter((e) => e.playerId === selected)
      .sort((a, b) => b.date.localeCompare(a.date));
    const evoPoints = evaluations
      .filter((e) => e.playerId === selected)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8)
      .map((e) => ({ v: e.rating, d: e.date }));
    const pct = attendancePct(selected);
    const streak = sessions
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8);
    const playerObjectives = objectives.filter((o) => o.playerId === selected);

    return (
      <div>
        <div className="crumbs">
          <button className="crumb-btn" onClick={() => setSelected(null)}>
            Entrenador
          </button>
          <Icon name="chevronR" size={13} />
          <button className="crumb-btn" onClick={() => setSelected(null)}>
            Plantel
          </button>
          <Icon name="chevronR" size={13} />
          <span className="crumb-current">{player.name}</span>
        </div>
        <div className="dossier-head">
          <div />
          <button className="btn" onClick={() => exportDossier(player.name)}>
            <Icon name="download" size={13} /> Exportar ficha
          </button>
          <button
            className="btn primary"
            onClick={() => setShowEvalForm((v) => !v)}
          >
            <Icon name="plus" size={14} /> Nueva evaluación
          </button>
        </div>
        <div className="dossier-grid" ref={dossierRef}>
          <div className="dossier-col">
            <section className="card dossier-hero">
              <div
                className="dossier-avatar"
                style={{ background: window.colorFor(player.name) }}
              >
                {window.initials(player.name)}
              </div>
              <h2>{player.name}</h2>
              <div className="tag-row">
                <span className="mini-tag">{player.pos}</span>
                <span className="mini-tag">#{player.num}</span>
                {player.preferredFoot && (
                  <span className="mini-tag">
                    {player.preferredFoot === "left"
                      ? "Zurdo"
                      : player.preferredFoot === "both"
                        ? "Ambas piernas"
                        : "Diestro"}
                  </span>
                )}
              </div>
              <div className="dossier-quickstats">
                <div>
                  <strong>{avgRatingOf(playerEvaluations)}</strong>
                  <span>Nota media</span>
                </div>
                <div>
                  <strong>{playerEvaluations.length}</strong>
                  <span>Evaluaciones</span>
                </div>
                <div>
                  <strong>{pct}%</strong>
                  <span>Asistencia</span>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="panel-head-row">
                <span>Perfil de atributos</span>
                <span className="lime-note">Media {avgAttrOf(attrs)}</span>
              </div>
              <RadarChart values={attrs} />
              <div className="attrs-edit">
                {RADAR_AXES.map((axis) => (
                  <label key={axis.key} className="attr-row">
                    <span>{axis.label}</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={attrs[axis.key] ?? 6}
                      onChange={(e) =>
                        setAttrs(selected, axis.key, e.target.value)
                      }
                    />
                    <b>{attrs[axis.key] ?? 6}</b>
                  </label>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="panel-head-row">
                <span>Objetivos activos</span>
                <span className="muted-note">
                  {playerObjectives.filter((o) => o.done).length} de{" "}
                  {playerObjectives.length}
                </span>
              </div>
              <div className="objectives-list">
                {playerObjectives.map((o) => (
                  <div
                    key={o.id}
                    className={`objective-row ${o.done ? "done" : ""}`}
                  >
                    <button
                      className="objective-check"
                      onClick={() => toggleObjective(o.id)}
                    >
                      {o.done && <Icon name="check" size={12} />}
                    </button>
                    <span>{o.text}</span>
                    <button
                      className="objective-del"
                      onClick={() => deleteObjective(o.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {!playerObjectives.length && (
                  <div className="empty-state sm">Sin objetivos activos.</div>
                )}
              </div>
              <div className="objective-add">
                <input
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Nuevo objetivo…"
                  onKeyDown={(e) => e.key === "Enter" && addObjective(selected)}
                />
                <button
                  className="btn sm"
                  onClick={() => addObjective(selected)}
                >
                  <Icon name="plus" size={12} />
                </button>
              </div>
            </section>
          </div>

          <div className="dossier-col">
            <section className="dossier-pair">
              <div className="card attendance-card">
                <Donut pct={pct} />
                <div>
                  <div className="panel-head-row" style={{ marginBottom: 2 }}>
                    <span>Asistencia</span>
                  </div>
                  <div className="muted">
                    {
                      sessions.filter((s) =>
                        (attendance[s.id] || []).includes(selected),
                      ).length
                    }{" "}
                    de {sessions.length} sesiones
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="panel-head-row">
                  <span>Racha · últimas {streak.length} sesiones</span>
                </div>
                <div className="streak-row">
                  {streak.map((s) => (
                    <span
                      key={s.id}
                      className={`streak-dot ${(attendance[s.id] || []).includes(selected) ? "on" : ""}`}
                      title={s.date}
                    ></span>
                  ))}
                </div>
                <div className="muted-note">
                  Presente en{" "}
                  {
                    streak.filter((s) =>
                      (attendance[s.id] || []).includes(selected),
                    ).length
                  }{" "}
                  · faltó{" "}
                  {
                    streak.filter(
                      (s) => !(attendance[s.id] || []).includes(selected),
                    ).length
                  }
                </div>
              </div>
            </section>

            <section className="card">
              <div className="panel-head-row">
                <span>Evolución de notas</span>
              </div>
              <EvolutionChart points={evoPoints} />
              {evoPoints.length > 0 && (
                <div className="evo-dates">
                  {evoPoints.map((p, i) => (
                    <span key={i}>{p.d.slice(5)}</span>
                  ))}
                </div>
              )}
            </section>

            {showEvalForm && (
              <section className="card eval-form-card">
                <div className="panel-head-row">
                  <span>Nueva evaluación</span>
                  <button
                    className="btn sm ghost"
                    onClick={() => setShowEvalForm(false)}
                  >
                    Cancelar
                  </button>
                </div>
                <div className="form-grid-wide">
                  <label className="field">
                    <span>Contexto</span>
                    <select
                      value={form.context}
                      onChange={(e) =>
                        setForm((v) => ({ ...v, context: e.target.value }))
                      }
                    >
                      <option value="training">Entrenamiento</option>
                      <option value="match">Partido</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Nota</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={form.rating}
                      onChange={(e) =>
                        setForm((v) => ({ ...v, rating: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field span-2">
                    <span>Qué hizo bien</span>
                    <textarea
                      value={form.good}
                      onChange={(e) =>
                        setForm((v) => ({ ...v, good: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field span-2">
                    <span>Qué debe mejorar</span>
                    <textarea
                      value={form.improve}
                      onChange={(e) =>
                        setForm((v) => ({ ...v, improve: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field span-2">
                    <span>Próximo objetivo</span>
                    <input
                      value={form.goal}
                      onChange={(e) =>
                        setForm((v) => ({ ...v, goal: e.target.value }))
                      }
                    />
                  </label>
                </div>
                <button className="btn primary" onClick={saveEvaluation}>
                  Guardar evaluación
                </button>
              </section>
            )}

            <section className="card">
              <div className="panel-head-row">
                <span>Historial de evaluaciones</span>
                <span className="muted-note">
                  {playerEvaluations.length} en total
                </span>
              </div>
              {playerEvaluations.length ? (
                <div className="eval-timeline">
                  {playerEvaluations.map((ev) => (
                    <article key={ev.id}>
                      <span className="timeline-dot"></span>
                      <div className="timeline-head">
                        <strong>
                          {ev.date} ·{" "}
                          {ev.context === "match" ? "Partido" : "Entrenamiento"}
                        </strong>
                        <span className="chip lime">{ev.rating}/10</span>
                      </div>
                      {ev.good && (
                        <p>
                          <b>Bien:</b> {ev.good}
                        </p>
                      )}
                      {ev.improve && (
                        <p>
                          <b>A mejorar:</b> {ev.improve}
                        </p>
                      )}
                      {ev.goal && (
                        <p>
                          <b>Objetivo:</b> {ev.goal}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  Todavía no hay evaluaciones para este jugador.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Modo entrenador</div>
          <h1 className="page-title">Tu plantel</h1>
          <div className="page-sub">
            Asistencia, evolución y objetivos de un vistazo.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setSessionModal(true)}>
            <Icon name="session" size={14} /> Nueva sesión
          </button>
          <button className="btn" onClick={() => window.go("settings")}>
            Configurar perfil
          </button>
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat-card">
          <div className="stat-n">{avgAttendance}%</div>
          <div className="stat-l">Asistencia promedio</div>
        </div>
        <div className="stat-card">
          <div className="stat-n">{sessionsThisMonth}</div>
          <div className="stat-l">Sesiones este mes</div>
        </div>
        <div className="stat-card">
          <div className="stat-n">{evaluationsLast30}</div>
          <div className="stat-l">Evaluaciones · 30 días</div>
        </div>
        <div className="stat-card">
          <div className="stat-n">{avgRating}</div>
          <div className="stat-l">Nota media</div>
        </div>
      </div>

      {nextSession && (
        <div className="card next-session-banner">
          <span className="banner-icon">
            <Icon name="session" size={18} />
          </span>
          <div className="banner-body">
            <strong>
              {nextSession.title} · {nextSession.date}
            </strong>
            <div className="muted">
              {(attendance[nextSession.id] || []).length} de {roster.length}{" "}
              confirmados
            </div>
          </div>
          <div className="avatar-stack">
            {roster.slice(0, 4).map((p) => (
              <span
                key={p.id}
                className="stack-avatar"
                style={{ background: window.colorFor(p.name) }}
              >
                {window.initials(p.name)}
              </span>
            ))}
            {roster.length > 4 && (
              <span className="stack-more">+{roster.length - 4}</span>
            )}
          </div>
          <button
            className="btn primary sm"
            onClick={() => setShowSessions(true)}
          >
            Pasar asistencia
          </button>
        </div>
      )}

      <div className="panel-head-row" style={{ margin: "22px 0 12px" }}>
        <span>Jugadores · {roster.length}</span>
        <div className="seg">
          <button
            className={filter === "all" ? "on" : ""}
            onClick={() => setFilter("all")}
          >
            Todos
          </button>
          <button
            className={filter === "low" ? "on" : ""}
            onClick={() => setFilter("low")}
          >
            Baja asistencia
          </button>
          <button
            className={filter === "unrated" ? "on" : ""}
            onClick={() => setFilter("unrated")}
          >
            Sin evaluar
          </button>
        </div>
      </div>

      <div className="roster-grid">
        {filtered.map((p) => {
          const le = lastEval(p.id);
          const trend = ratingsTrend(p.id);
          const pct = attendancePct(p.id);
          const stale = !le || !inLastDays(le.date, 21, now);
          return (
            <button
              key={p.id}
              className="roster-overview-card"
              onClick={() => setSelected(p.id)}
            >
              <div className="roc-top">
                <span
                  className="mini-avatar"
                  style={{ background: window.colorFor(p.name) }}
                >
                  {window.initials(p.name)}
                </span>
                <div className="roc-name">
                  <strong>{p.name}</strong>
                  <small>
                    {p.pos} · #{p.num}
                  </small>
                </div>
                {le ? (
                  <span className="chip lime">{le.rating}/10</span>
                ) : (
                  <span className="chip">s/e</span>
                )}
              </div>
              <div className="roc-bar-row">
                <span>ASISTENCIA</span>
                <span>{pct}%</span>
              </div>
              <div className="roc-bar">
                <div
                  className="roc-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: pct < 60 ? "var(--accent-2)" : "var(--accent)",
                  }}
                ></div>
              </div>
              <div className="roc-foot">
                {trend.length > 1 ? (
                  <Sparkline
                    values={trend}
                    color={pct < 60 ? "var(--accent-2)" : "var(--accent)"}
                  />
                ) : (
                  <span />
                )}
                {stale ? (
                  <span className="stale-note">Sin evaluar hace tiempo</span>
                ) : (
                  <span className="roc-link">Ver ficha →</span>
                )}
              </div>
            </button>
          );
        })}
        {!filtered.length && (
          <div className="empty-state">No hay jugadores en este filtro.</div>
        )}
      </div>

      {showSessions && (
        <div className="modal-back" onClick={() => setShowSessions(false)}>
          <div
            className="modal"
            ref={sessionsDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Pasar asistencia"
            tabIndex="-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <div className="page-kicker">Entrenamientos</div>
                <div className="modal-title">Pasar asistencia</div>
              </div>
              <button
                className="btn sm ghost"
                aria-label="Cerrar"
                onClick={() => setShowSessions(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body session-modal-body">
              {sessions
                .slice()
                .reverse()
                .map((session) => (
                  <details
                    key={session.id}
                    open={session.id === nextSession?.id}
                  >
                    <summary>
                      <strong>{session.title}</strong>
                      <small>
                        {session.date} · {(attendance[session.id] || []).length}
                        /{roster.length}
                      </small>
                    </summary>
                    {roster.map((p) => (
                      <label key={p.id} className="check-row">
                        <input
                          type="checkbox"
                          checked={(attendance[session.id] || []).includes(
                            p.id,
                          )}
                          onChange={() => toggleAttendance(session.id, p.id)}
                        />
                        <span>{p.name}</span>
                      </label>
                    ))}
                  </details>
                ))}
              {!sessions.length && (
                <div className="empty-state">
                  Todavía no hay entrenamientos creados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {sessionModal && (
        <div className="modal-back" onClick={() => setSessionModal(false)}>
          <div
            className="modal"
            ref={newSessionDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Nueva sesión"
            tabIndex="-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <div className="page-kicker">Entrenador</div>
                <div className="modal-title">Nueva sesión</div>
              </div>
              <button
                className="btn sm ghost"
                aria-label="Cerrar"
                onClick={() => setSessionModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <label className="field">
                <span>Nombre</span>
                <input
                  value={trainingTitle}
                  onChange={(e) => setTrainingTitle(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Fecha</span>
                <input
                  type="date"
                  value={trainingDate}
                  onChange={(e) => setTrainingDate(e.target.value)}
                />
              </label>
            </div>
            <div className="modal-foot">
              <button
                className="btn ghost"
                onClick={() => setSessionModal(false)}
              >
                Cancelar
              </button>
              <button className="btn primary" onClick={addSession}>
                Crear sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function avgRatingOf(list) {
  if (!list.length) return "—";
  return (list.reduce((a, e) => a + e.rating, 0) / list.length).toFixed(1);
}
function avgAttrOf(attrs) {
  const vals = Object.values(attrs);
  return (vals.reduce((a, v) => a + v, 0) / vals.length).toFixed(1);
}
