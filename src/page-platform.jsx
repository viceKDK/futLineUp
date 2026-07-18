// Product profiles, coach, league and data/account settings.
const EXPERIENCE_OPTIONS = [
  { id:'friends', title:'Amigos', icon:'⚽', text:'Formaciones, sorteos y compartir rápido.' },
  { id:'coach', title:'Entrenador', icon:'⌁', text:'Plantel, entrenamientos, asistencia y evolución.' },
  { id:'league', title:'Liga amateur', icon:'▦', text:'Calendario, resultados y tabla de posiciones.' },
];

function SettingsPage() {
  const [profile, setProfile] = window.useStore('profile', window.DEFAULT_PROFILE);
  const [roster, setRoster] = window.useStore('roster', window.DEFAULT_ROSTER);
  const [session, setSession] = React.useState(null);
  const [paste, setPaste] = React.useState('');
  const importRef = React.useRef(null);

  React.useEffect(() => {
    window.fcAuth?.session().then(setSession).catch(()=>{});
    const sub = window.fcSupabase?.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub?.data?.subscription?.unsubscribe?.();
  }, []);

  const exportBackup = () => {
    window.downloadJSON(window.exportFutbolClubData(), `futbolclub-backup-${new Date().toISOString().slice(0,10)}.json`);
    window.__toast?.('Backup descargado');
  };
  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const count = window.importFutbolClubData(payload, 'replace');
      window.__toast?.(`${count} grupos de datos importados`);
      setTimeout(() => location.reload(), 500);
    } catch (error) { window.__toast?.(error.message || 'No se pudo importar'); }
  };
  const importRosterText = () => {
    const parsed = paste.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map((line, index) => {
      const [name, num, pos] = line.split(',').map(part => part.trim());
      return { id: window.nextPlayerId(roster) + index, name, num: Number(num)||0, pos: ['ARQ','DEF','MED','DEL'].includes(pos?.toUpperCase()) ? pos.toUpperCase() : 'MED', photo:null, active:true };
    }).filter(player => player.name);
    if (!parsed.length) return window.__toast?.('Pegá al menos un jugador');
    setRoster(prev => [...prev, ...parsed]);
    setPaste('');
    window.__toast?.(`${parsed.length} jugadores agregados`);
  };

  return <div>
    <div className="page-head"><div><div className="page-kicker">Cuenta y datos</div><h1 className="page-title">Tu futbolClub</h1><div className="page-sub">Elegí la experiencia, protegé tus datos y conectá tu cuenta cuando quieras sincronizar.</div></div></div>
    <div className="platform-grid">
      <section className="card span-2"><div className="panel-head">Experiencia principal</div><div className="experience-grid">
        {EXPERIENCE_OPTIONS.map(option => <button key={option.id} className={`experience-card ${profile.experience===option.id?'on':''}`} onClick={()=>setProfile(p=>({...p,experience:option.id,onboardingDone:true}))}>
          <span className="experience-icon">{option.icon}</span><strong>{option.title}</strong><small>{option.text}</small>
        </button>)}
      </div></section>
      <section className="card"><div className="panel-head">Perfil</div><label className="field"><span>Tu nombre</span><input value={profile.displayName||''} onChange={e=>setProfile(p=>({...p,displayName:e.target.value}))} placeholder="Nombre o apodo"/></label><label className="field"><span>Temporada</span><input value={profile.season||''} onChange={e=>setProfile(p=>({...p,season:e.target.value}))} placeholder="Ej. 2026 · Apertura"/></label></section>
      <section className="card"><div className="panel-head">Cuenta y sincronización</div>{session ? <><div className="account-row"><div className="avatar-me">{window.initials(session.user?.user_metadata?.full_name || session.user?.email)}</div><div><strong>{session.user?.user_metadata?.full_name || 'Cuenta conectada'}</strong><small>{session.user?.email}</small></div></div><div className="action-row"><button className="btn primary" onClick={()=>window.fcCloud.uploadLocal().then(()=>window.__toast?.('Datos sincronizados')).catch(e=>window.__toast?.(e.message))}>Subir datos</button><button className="btn" onClick={()=>window.fcCloud.downloadToLocal().then(()=>{window.__toast?.('Datos recuperados');setTimeout(()=>location.reload(),500)}).catch(e=>window.__toast?.(e.message))}>Recuperar cuenta</button><button className="btn ghost" onClick={()=>window.fcAuth.signOut()}>Cerrar sesión</button></div></> : <><p className="muted">El modo invitado guarda en este dispositivo. Google Login permite usar varios dispositivos cuando Supabase esté configurado.</p><button className="btn primary" disabled={!window.fcAuth?.configured} onClick={()=>window.fcAuth.signInGoogle().catch(e=>window.__toast?.(e.message))}>Continuar con Google</button>{!window.fcAuth?.configured && <small className="warning-text">Falta configurar `SUPABASE_CONFIG`.</small>}</>}</section>
      <section className="card"><div className="panel-head">Backup local</div><p className="muted">Exportá todo antes de cambiar de dispositivo o importar otros datos.</p><div className="action-row"><button className="btn" onClick={exportBackup}>Exportar JSON</button><button className="btn" onClick={()=>importRef.current?.click()}>Importar</button></div><input ref={importRef} hidden type="file" accept="application/json" onChange={importBackup}/></section>
      <section className="card"><div className="panel-head">Carga rápida de jugadores</div><textarea className="paste-roster" value={paste} onChange={e=>setPaste(e.target.value)} placeholder={'Martín, 10, MED\nNahuel, 1, ARQ\nFacu, 4, DEF'}/><button className="btn primary" onClick={importRosterText}>Agregar al plantel</button></section>
    </div>
  </div>;
}

function CoachPage() {
  const [roster] = window.useStore('roster', window.DEFAULT_ROSTER);
  const [sessions, setSessions] = window.useStore('trainingSessions', []);
  const [attendance, setAttendance] = window.useStore('attendance', {});
  const [evaluations, setEvaluations] = window.useStore('evaluations', []);
  const [selected, setSelected] = React.useState(roster[0]?.id || null);
  const [trainingTitle, setTrainingTitle] = React.useState('Entrenamiento');
  const [trainingDate, setTrainingDate] = React.useState(new Date().toISOString().slice(0,10));
  const [form, setForm] = React.useState({rating:7,good:'',improve:'',goal:'',context:'training'});
  const player = roster.find(item=>item.id===selected);
  const playerEvaluations = evaluations.filter(item=>item.playerId===selected).sort((a,b)=>b.date.localeCompare(a.date));
  const attendanceCount = sessions.filter(session=>(attendance[session.id]||[]).includes(selected)).length;

  const addSession = () => { const id=`tr${Date.now()}`; setSessions(prev=>[...prev,{id,title:trainingTitle.trim()||'Entrenamiento',date:trainingDate}]); setAttendance(prev=>({...prev,[id]:[]})); window.__toast?.('Entrenamiento creado'); };
  const toggleAttendance = (sessionId, playerId) => setAttendance(prev=>{ const ids=new Set(prev[sessionId]||[]); ids.has(playerId)?ids.delete(playerId):ids.add(playerId); return {...prev,[sessionId]:[...ids]}; });
  const saveEvaluation = () => { if(!selected) return; setEvaluations(prev=>[...prev,{id:`ev${Date.now()}`,playerId:selected,date:new Date().toISOString().slice(0,10),...form,rating:Number(form.rating)||0}]); setForm({rating:7,good:'',improve:'',goal:'',context:'training'}); window.__toast?.('Evaluación guardada'); };

  return <div><div className="page-head"><div><div className="page-kicker">Modo entrenador</div><h1 className="page-title">Plantel y evolución</h1><div className="page-sub">Registrá asistencia, observaciones y próximos objetivos sin convertirlo en burocracia.</div></div><button className="btn" onClick={()=>window.go('settings')}>Configurar perfil</button></div>
    <div className="coach-layout">
      <aside className="card"><div className="panel-head">Jugadores · {roster.length}</div><div className="player-selector">{roster.map(p=><button key={p.id} className={selected===p.id?'on':''} onClick={()=>setSelected(p.id)}><span className="mini-avatar" style={{background:window.colorFor(p.name)}}>{window.initials(p.name)}</span><span><strong>{p.name}</strong><small>{p.pos} · #{p.num}</small></span></button>)}</div></aside>
      <main className="coach-main">
        {player && <section className="card player-summary"><div><div className="page-kicker">Ficha del jugador</div><h2>{player.name}</h2><p>{player.pos}{player.secondaryPos?` / ${player.secondaryPos}`:''} · #{player.num}{player.preferredFoot?` · ${player.preferredFoot==='left'?'Zurdo':player.preferredFoot==='both'?'Ambas piernas':'Diestro'}`:''}</p></div><div className="metric"><strong>{sessions.length?Math.round(attendanceCount/sessions.length*100):0}%</strong><span>asistencia</span></div><div className="metric"><strong>{playerEvaluations[0]?.rating ?? '—'}</strong><span>última nota</span></div></section>}
        <section className="card"><div className="panel-head">Nueva evaluación</div><div className="form-grid-wide"><label className="field"><span>Contexto</span><select value={form.context} onChange={e=>setForm(v=>({...v,context:e.target.value}))}><option value="training">Entrenamiento</option><option value="match">Partido</option></select></label><label className="field"><span>Nota</span><input type="number" min="1" max="10" value={form.rating} onChange={e=>setForm(v=>({...v,rating:e.target.value}))}/></label><label className="field span-2"><span>Qué hizo bien</span><textarea value={form.good} onChange={e=>setForm(v=>({...v,good:e.target.value}))}/></label><label className="field span-2"><span>Qué debe mejorar</span><textarea value={form.improve} onChange={e=>setForm(v=>({...v,improve:e.target.value}))}/></label><label className="field span-2"><span>Próximo objetivo</span><input value={form.goal} onChange={e=>setForm(v=>({...v,goal:e.target.value}))}/></label></div><button className="btn primary" onClick={saveEvaluation}>Guardar evaluación</button></section>
        <section className="card"><div className="panel-head">Historial</div>{playerEvaluations.length?<div className="timeline">{playerEvaluations.map(ev=><article key={ev.id}><div><strong>{ev.date} · {ev.context==='match'?'Partido':'Entrenamiento'}</strong><span className="chip lime">{ev.rating}/10</span></div>{ev.good&&<p><b>Bien:</b> {ev.good}</p>}{ev.improve&&<p><b>A mejorar:</b> {ev.improve}</p>}{ev.goal&&<p><b>Objetivo:</b> {ev.goal}</p>}</article>)}</div>:<div className="empty-state">Todavía no hay evaluaciones para este jugador.</div>}</section>
      </main>
      <aside className="card"><div className="panel-head">Entrenamientos</div><label className="field"><span>Nombre</span><input value={trainingTitle} onChange={e=>setTrainingTitle(e.target.value)}/></label><label className="field"><span>Fecha</span><input type="date" value={trainingDate} onChange={e=>setTrainingDate(e.target.value)}/></label><button className="btn primary" onClick={addSession}>Crear sesión</button><div className="session-list">{sessions.slice().reverse().map(session=><details key={session.id}><summary><strong>{session.title}</strong><small>{session.date} · {(attendance[session.id]||[]).length}/{roster.length}</small></summary>{roster.map(p=><label key={p.id} className="check-row"><input type="checkbox" checked={(attendance[session.id]||[]).includes(p.id)} onChange={()=>toggleAttendance(session.id,p.id)}/><span>{p.name}</span></label>)}</details>)}</div></aside>
    </div>
  </div>;
}

function calculateStandings(fixtures) {
  const table = new Map();
  const row = name => { if(!table.has(name)) table.set(name,{name,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0}); return table.get(name); };
  fixtures.filter(f=>f.played).forEach(f=>{ const home=row(f.home), away=row(f.away), hs=Number(f.homeScore), as=Number(f.awayScore); home.pj++;away.pj++;home.gf+=hs;home.gc+=as;away.gf+=as;away.gc+=hs;if(hs>as){home.pg++;away.pp++;home.pts+=3}else if(hs<as){away.pg++;home.pp++;away.pts+=3}else{home.pe++;away.pe++;home.pts++;away.pts++;} });
  return [...table.values()].sort((a,b)=>b.pts-a.pts||((b.gf-b.gc)-(a.gf-a.gc))||b.gf-a.gf||a.name.localeCompare(b.name));
}

function LeaguePage() {
  const [league, setLeague] = window.useStore('league', {name:'Liga amateur',season:'2026',fixtures:[]});
  const [form,setForm]=React.useState({date:new Date().toISOString().slice(0,10),home:'',away:'',homeScore:'',awayScore:''});
  const fixtures=league.fixtures||[], standings=calculateStandings(fixtures);
  const saveFixture=()=>{if(!form.home.trim()||!form.away.trim())return window.__toast?.('Completá ambos equipos');const played=form.homeScore!==''&&form.awayScore!=='';setLeague(l=>({...l,fixtures:[...(l.fixtures||[]),{id:`fx${Date.now()}`,...form,home:form.home.trim(),away:form.away.trim(),played,homeScore:Number(form.homeScore)||0,awayScore:Number(form.awayScore)||0}]}));setForm(v=>({...v,home:'',away:'',homeScore:'',awayScore:''}));window.__toast?.('Partido agregado');};
  return <div><div className="page-head"><div><div className="page-kicker">Modo liga</div><input className="editor-title-input" value={league.name} onChange={e=>setLeague(l=>({...l,name:e.target.value}))}/><div className="page-sub">Calendario, resultados y tabla calculada automáticamente.</div></div><input className="season-input" value={league.season} onChange={e=>setLeague(l=>({...l,season:e.target.value}))} aria-label="Temporada"/></div>
    <div className="league-layout"><section className="card"><div className="panel-head">Agregar partido</div><div className="form-grid-wide"><label className="field span-2"><span>Fecha</span><input type="date" value={form.date} onChange={e=>setForm(v=>({...v,date:e.target.value}))}/></label><label className="field"><span>Local</span><input value={form.home} onChange={e=>setForm(v=>({...v,home:e.target.value}))}/></label><label className="field"><span>Visitante</span><input value={form.away} onChange={e=>setForm(v=>({...v,away:e.target.value}))}/></label><label className="field"><span>Goles local</span><input type="number" min="0" value={form.homeScore} onChange={e=>setForm(v=>({...v,homeScore:e.target.value}))}/></label><label className="field"><span>Goles visitante</span><input type="number" min="0" value={form.awayScore} onChange={e=>setForm(v=>({...v,awayScore:e.target.value}))}/></label></div><button className="btn primary" onClick={saveFixture}>Guardar partido</button></section>
    <section className="card span-2"><div className="panel-head">Tabla · {league.season}</div>{standings.length?<div className="table-wrap"><table className="standings"><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th></tr></thead><tbody>{standings.map((t,i)=><tr key={t.name}><td>{i+1}</td><td>{t.name}</td><td>{t.pj}</td><td>{t.pg}</td><td>{t.pe}</td><td>{t.pp}</td><td>{t.gf}</td><td>{t.gc}</td><td>{t.gf-t.gc}</td><td><strong>{t.pts}</strong></td></tr>)}</tbody></table></div>:<div className="empty-state">Cargá un resultado para generar la tabla.</div>}</section>
    <section className="card span-3"><div className="panel-head">Calendario y resultados · {fixtures.length}</div><div className="fixture-list">{fixtures.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(f=><article key={f.id}><time>{f.date}</time><strong>{f.home}</strong><span>{f.played?`${f.homeScore} — ${f.awayScore}`:'vs'}</span><strong>{f.away}</strong><button onClick={()=>setLeague(l=>({...l,fixtures:l.fixtures.filter(x=>x.id!==f.id)}))} aria-label="Eliminar partido">×</button></article>)}</div></section></div>
  </div>;
}

const platformCSS=document.createElement('style');platformCSS.textContent=`
.platform-grid,.league-layout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.span-2{grid-column:span 2}.span-3{grid-column:1/-1}.experience-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.experience-card{display:flex;flex-direction:column;text-align:left;gap:6px;padding:16px;border:1px solid var(--line);border-radius:var(--radius);background:var(--bg-elev-2)}.experience-card.on{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}.experience-icon{font-size:24px}.experience-card small,.account-row small{display:block;color:var(--fg-dim)}.field{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}.field>span{font:11px var(--font-cond);text-transform:uppercase;letter-spacing:1px;color:var(--fg-dim)}.field input,.field select,.field textarea,.paste-roster,.season-input{width:100%;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:9px;color:var(--fg)}.field textarea{min-height:72px;resize:vertical}.paste-roster{min-height:120px;margin-bottom:10px}.muted{color:var(--fg-mute)}.warning-text{display:block;color:var(--warn);margin-top:8px}.action-row,.account-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.coach-layout{display:grid;grid-template-columns:220px minmax(0,1fr) 280px;gap:16px;align-items:start}.coach-main{display:flex;flex-direction:column;gap:16px}.player-selector{display:flex;flex-direction:column;gap:4px;max-height:70vh;overflow:auto}.player-selector button{display:flex;align-items:center;gap:8px;padding:8px;border-radius:6px;text-align:left}.player-selector button.on{background:var(--accent);color:#0e1210}.player-selector small{display:block;opacity:.65}.mini-avatar{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700}.player-summary{display:flex;align-items:center;gap:24px}.player-summary>div:first-child{flex:1}.player-summary h2{font:36px var(--font-display);margin:0}.player-summary p{color:var(--fg-mute)}.metric{text-align:center}.metric strong{display:block;font:36px var(--font-display)}.metric span{font-size:11px;color:var(--fg-dim);text-transform:uppercase}.form-grid-wide{display:grid;grid-template-columns:1fr 1fr;gap:10px}.form-grid-wide .span-2{grid-column:span 2}.timeline{display:flex;flex-direction:column;gap:10px}.timeline article{padding:12px;background:var(--bg-elev-2);border-radius:8px}.timeline article>div{display:flex;justify-content:space-between}.timeline p{margin:7px 0;color:var(--fg-mute)}.session-list{margin-top:14px}.session-list details{border-top:1px solid var(--line);padding:9px 0}.session-list summary{cursor:pointer}.session-list summary small{display:block;color:var(--fg-dim)}.check-row{display:flex;gap:8px;padding:5px}.season-input{width:140px}.table-wrap{overflow:auto}.standings{width:100%;border-collapse:collapse}.standings th,.standings td{padding:9px;border-bottom:1px solid var(--line);text-align:center}.standings th:nth-child(2),.standings td:nth-child(2){text-align:left}.fixture-list{display:flex;flex-direction:column}.fixture-list article{display:grid;grid-template-columns:110px 1fr 90px 1fr 30px;gap:10px;align-items:center;padding:12px;border-top:1px solid var(--line);text-align:center}.fixture-list time{color:var(--fg-dim);text-align:left}.empty-state{padding:28px;text-align:center;color:var(--fg-dim)}
@media(max-width:1100px){.coach-layout{grid-template-columns:1fr}.player-selector{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));max-height:none}.platform-grid,.league-layout{grid-template-columns:1fr}.span-2,.span-3{grid-column:auto}}@media(max-width:650px){.experience-grid,.form-grid-wide{grid-template-columns:1fr}.form-grid-wide .span-2{grid-column:auto}.player-summary{align-items:flex-start;flex-wrap:wrap}.fixture-list article{grid-template-columns:1fr 40px 1fr}.fixture-list time{grid-column:1/-1}.fixture-list button{grid-column:1/-1}}
`;document.head.appendChild(platformCSS);
ReactDOM.createRoot(document.getElementById('page-coach')).render(<CoachPage/>);
ReactDOM.createRoot(document.getElementById('page-league')).render(<LeaguePage/>);
ReactDOM.createRoot(document.getElementById('page-settings')).render(<SettingsPage/>);