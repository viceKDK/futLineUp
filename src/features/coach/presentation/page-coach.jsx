function CoachPage() {
  const D = window.fcCoachDomain;
  const [roster, setRoster] = window.useStore("roster", window.DEFAULT_ROSTER);
  const [sessions, setSessions] = window.useStore("trainingSessions", []);
  const [attendance, setAttendance] = window.useStore("attendance", {});
  const [evaluations, setEvaluations] = window.useStore("evaluations", []);
  const [objectives, setObjectives] = window.useStore("objectives", []);
  const [selected, setSelected] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [sessionModal, setSessionModal] = React.useState(false);
  const [attendanceModal, setAttendanceModal] = React.useState(false);
  const [evalOpen, setEvalOpen] = React.useState(false);
  const [sessionDraft, setSessionDraft] = React.useState({ title: "Entrenamiento", date: new Date().toISOString().slice(0, 10) });
  const [objectiveDraft, setObjectiveDraft] = React.useState("");
  const [evaluationDraft, setEvaluationDraft] = React.useState({ rating: 7, good: "", improve: "", goal: "", context: "training" });
  const now = new Date();
  const overview = D.coachOverview({ roster, sessions, attendance, evaluations, now });
  const attendancePct = (id) => D.attendancePct(id, sessions, attendance);
  const lastEvaluation = (id) => D.lastEvaluation(id, evaluations);

  const createSession = () => {
    try {
      const session = D.createSession(sessionDraft, () => `tr${Date.now()}`);
      setSessions((current) => [...current, session]);
      setAttendance((current) => ({ ...current, [session.id]: [] }));
      setSessionModal(false);
      window.__toast?.("Entrenamiento creado");
    } catch (error) { window.__toast?.(error.message); }
  };
  const saveEvaluation = () => {
    try {
      const evaluation = D.createEvaluation({ playerId: selected, form: evaluationDraft, date: new Date().toISOString().slice(0, 10) }, () => `ev${Date.now()}`);
      setEvaluations((current) => [...current, evaluation]);
      setEvaluationDraft({ rating: 7, good: "", improve: "", goal: "", context: "training" });
      setEvalOpen(false);
    } catch (error) { window.__toast?.(error.message); }
  };
  const addObjective = () => {
    setObjectives((current) => D.addObjective(current, selected, objectiveDraft, () => `ob${Date.now()}`));
    if (objectiveDraft.trim()) setObjectiveDraft("");
  };

  const player = roster.find((item) => item.id === selected);
  if (player) {
    const attrs = player.attrs || DEFAULT_ATTRS;
    const playerEvaluations = evaluations.filter((item) => item.playerId === selected).sort((a, b) => b.date.localeCompare(a.date));
    const playerObjectives = objectives.filter((item) => item.playerId === selected);
    return <div>
      <div className="crumbs"><button className="crumb-btn" onClick={() => setSelected(null)}>Entrenador</button><Icon name="chevronR" size={13}/><span className="crumb-current">{player.name}</span></div>
      <div className="dossier-head"><div/><button className="btn primary" onClick={() => setEvalOpen((value) => !value)}><Icon name="plus" size={14}/> Nueva evaluación</button></div>
      <div className="dossier-grid">
        <div className="dossier-col">
          <section className="card dossier-hero"><div className="dossier-avatar" style={{background:window.colorFor(player.name)}}>{window.initials(player.name)}</div><h2>{player.name}</h2><div className="tag-row"><span className="mini-tag">{player.pos}</span><span className="mini-tag">#{player.num}</span></div><div className="dossier-quickstats"><div><strong>{playerEvaluations.length ? (playerEvaluations.reduce((sum,item)=>sum+Number(item.rating),0)/playerEvaluations.length).toFixed(1) : "—"}</strong><span>Nota media</span></div><div><strong>{playerEvaluations.length}</strong><span>Evaluaciones</span></div><div><strong>{attendancePct(selected)}%</strong><span>Asistencia</span></div></div></section>
          <section className="card"><div className="panel-head-row"><span>Perfil de atributos</span></div><RadarChart values={attrs}/><div className="attrs-edit">{RADAR_AXES.map((axis)=><label key={axis.key} className="attr-row"><span>{axis.label}</span><input type="range" min="1" max="10" value={attrs[axis.key]??6} onChange={(event)=>{ try { setRoster((current)=>D.setPlayerAttribute(current,selected,axis.key,event.target.value,DEFAULT_ATTRS)); } catch(error){ window.__toast?.(error.message); } }}/><b>{attrs[axis.key]??6}</b></label>)}</div></section>
          <section className="card"><div className="panel-head-row"><span>Objetivos</span></div><div className="objectives-list">{playerObjectives.map((item)=><div key={item.id} className={`objective-row ${item.done?"done":""}`}><button className="objective-check" onClick={()=>setObjectives((current)=>D.toggleObjective(current,item.id))}>{item.done&&<Icon name="check" size={12}/>}</button><span>{item.text}</span><button className="objective-del" onClick={()=>setObjectives((current)=>D.deleteObjective(current,item.id))}>×</button></div>)}</div><div className="objective-add"><input value={objectiveDraft} onChange={(event)=>setObjectiveDraft(event.target.value)} onKeyDown={(event)=>event.key==="Enter"&&addObjective()} placeholder="Nuevo objetivo…"/><button className="btn sm" onClick={addObjective}>+</button></div></section>
        </div>
        <div className="dossier-col">
          <section className="card"><div className="panel-head-row"><span>Evolución de notas</span></div><EvolutionChart points={playerEvaluations.slice().reverse().slice(-8).map((item)=>({v:item.rating,d:item.date}))}/></section>
          {evalOpen&&<section className="card eval-form-card"><div className="panel-head-row"><span>Nueva evaluación</span></div><div className="form-grid-wide"><label className="field"><span>Contexto</span><select value={evaluationDraft.context} onChange={(event)=>setEvaluationDraft((value)=>({...value,context:event.target.value}))}><option value="training">Entrenamiento</option><option value="match">Partido</option></select></label><label className="field"><span>Nota</span><input type="number" min="1" max="10" value={evaluationDraft.rating} onChange={(event)=>setEvaluationDraft((value)=>({...value,rating:event.target.value}))}/></label><label className="field span-2"><span>Qué hizo bien</span><textarea value={evaluationDraft.good} onChange={(event)=>setEvaluationDraft((value)=>({...value,good:event.target.value}))}/></label><label className="field span-2"><span>A mejorar</span><textarea value={evaluationDraft.improve} onChange={(event)=>setEvaluationDraft((value)=>({...value,improve:event.target.value}))}/></label><label className="field span-2"><span>Próximo objetivo</span><input value={evaluationDraft.goal} onChange={(event)=>setEvaluationDraft((value)=>({...value,goal:event.target.value}))}/></label></div><button className="btn primary" onClick={saveEvaluation}>Guardar evaluación</button></section>}
          <section className="card"><div className="panel-head-row"><span>Historial</span><span className="muted-note">{playerEvaluations.length}</span></div>{playerEvaluations.length?<div className="eval-timeline">{playerEvaluations.map((item)=><article key={item.id}><div className="timeline-head"><strong>{item.date} · {item.context==="match"?"Partido":"Entrenamiento"}</strong><span className="chip lime">{item.rating}/10</span></div>{item.good&&<p><b>Bien:</b> {item.good}</p>}{item.improve&&<p><b>A mejorar:</b> {item.improve}</p>}{item.goal&&<p><b>Objetivo:</b> {item.goal}</p>}</article>)}</div>:<div className="empty-state">Todavía no hay evaluaciones.</div>}</section>
        </div>
      </div>
    </div>;
  }

  const filtered = roster.filter((item)=>{
    if(filter==="low") return attendancePct(item.id)<60;
    if(filter==="unrated"){ const evaluation=lastEvaluation(item.id); return !evaluation||!D.inLastDays(evaluation.date,21,now); }
    return true;
  });
  return <div>
    <div className="page-head"><div><div className="page-kicker">Modo entrenador</div><h1 className="page-title">Tu plantel</h1><div className="page-sub">Asistencia, evolución y objetivos.</div></div><button className="btn primary" onClick={()=>setSessionModal(true)}><Icon name="session" size={14}/> Nueva sesión</button></div>
    <div className="stat-strip"><div className="stat-card"><div className="stat-n">{overview.avgAttendance}%</div><div className="stat-l">Asistencia promedio</div></div><div className="stat-card"><div className="stat-n">{overview.sessionsThisMonth}</div><div className="stat-l">Sesiones este mes</div></div><div className="stat-card"><div className="stat-n">{overview.evaluationsLast30}</div><div className="stat-l">Evaluaciones · 30 días</div></div><div className="stat-card"><div className="stat-n">{overview.avgRating==null?"—":overview.avgRating.toFixed(1)}</div><div className="stat-l">Nota media</div></div></div>
    {overview.nextSession&&<div className="card next-session-banner"><span className="banner-icon"><Icon name="session" size={18}/></span><div className="banner-body"><strong>{overview.nextSession.title} · {overview.nextSession.date}</strong><div className="muted">{(attendance[overview.nextSession.id]||[]).length} de {roster.length} confirmados</div></div><button className="btn primary sm" onClick={()=>setAttendanceModal(true)}>Pasar asistencia</button></div>}
    <div className="panel-head-row" style={{margin:"22px 0 12px"}}><span>Jugadores · {roster.length}</span><div className="seg">{[["all","Todos"],["low","Baja asistencia"],["unrated","Sin evaluar"]].map(([id,label])=><button key={id} className={filter===id?"on":""} onClick={()=>setFilter(id)}>{label}</button>)}</div></div>
    <div className="roster-grid">{filtered.map((item)=>{ const evaluation=lastEvaluation(item.id), value=attendancePct(item.id), values=D.ratingsTrend(item.id,evaluations); return <button key={item.id} className="roster-overview-card" onClick={()=>setSelected(item.id)}><div className="roc-top"><span className="mini-avatar" style={{background:window.colorFor(item.name)}}>{window.initials(item.name)}</span><div className="roc-name"><strong>{item.name}</strong><small>{item.pos} · #{item.num}</small></div>{evaluation?<span className="chip lime">{evaluation.rating}/10</span>:<span className="chip">s/e</span>}</div><div className="roc-bar-row"><span>ASISTENCIA</span><span>{value}%</span></div><div className="roc-bar"><div className="roc-bar-fill" style={{width:`${value}%`}}/></div><div className="roc-foot">{values.length>1?<Sparkline values={values}/>:<span/>}<span className="roc-link">Ver ficha →</span></div></button>;})}</div>
    {attendanceModal&&<CoachAttendanceModal sessions={sessions} roster={roster} attendance={attendance} onToggle={(sessionId,playerId)=>setAttendance((current)=>D.toggleAttendance(current,sessionId,playerId))} onClose={()=>setAttendanceModal(false)}/>} 
    {sessionModal&&<CoachSessionModal draft={sessionDraft} setDraft={setSessionDraft} onSave={createSession} onClose={()=>setSessionModal(false)}/>} 
  </div>;
}

function CoachAttendanceModal({sessions,roster,attendance,onToggle,onClose}){
  const ref=window.useDialogAccessibility(true,onClose);
  return <div className="modal-back" onClick={onClose}><div className="modal" ref={ref} role="dialog" aria-modal="true" tabIndex="-1" onClick={(event)=>event.stopPropagation()}><div className="modal-head"><div className="modal-title">Pasar asistencia</div><button className="btn sm ghost" onClick={onClose}>✕</button></div><div className="modal-body session-modal-body">{sessions.slice().reverse().map((session)=><details key={session.id}><summary><strong>{session.title}</strong><small>{session.date}</small></summary>{roster.map((player)=><label key={player.id} className="check-row"><input type="checkbox" checked={(attendance[session.id]||[]).includes(player.id)} onChange={()=>onToggle(session.id,player.id)}/><span>{player.name}</span></label>)}</details>)}</div></div></div>;
}
function CoachSessionModal({draft,setDraft,onSave,onClose}){
  const ref=window.useDialogAccessibility(true,onClose);
  return <div className="modal-back" onClick={onClose}><div className="modal" ref={ref} role="dialog" aria-modal="true" tabIndex="-1" onClick={(event)=>event.stopPropagation()}><div className="modal-head"><div className="modal-title">Nueva sesión</div><button className="btn sm ghost" onClick={onClose}>✕</button></div><div className="modal-body"><label className="field"><span>Nombre</span><input value={draft.title} onChange={(event)=>setDraft((value)=>({...value,title:event.target.value}))}/></label><label className="field"><span>Fecha</span><input type="date" value={draft.date} onChange={(event)=>setDraft((value)=>({...value,date:event.target.value}))}/></label></div><div className="modal-foot"><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={onSave}>Crear sesión</button></div></div></div>;
}
window.mountPage("page-coach", <CoachPage/>);
