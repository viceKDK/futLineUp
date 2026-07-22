// Product profiles, coach, league and data/account settings.
const EXPERIENCE_OPTIONS = [
  { id:'friends', title:'Amigos', icon:'friends', text:'Formaciones, sorteos y compartir rápido.' },
  { id:'coach', title:'Entrenador', icon:'vest', text:'Plantel, entrenamientos, asistencia y evolución.' },
  { id:'league', title:'Liga amateur', icon:'trophy', text:'Calendario, resultados y tabla de posiciones.' },
];

const DEFAULT_ATTRS = { tech:6, phys:6, tac:6, fin:6, att:6 };
const RADAR_AXES = [
  { key:'tech', label:'Técnica' },
  { key:'phys', label:'Físico' },
  { key:'tac',  label:'Táctica' },
  { key:'fin',  label:'Definición' },
  { key:'att',  label:'Actitud' },
];

// ---- Small chart primitives (SVG, sin dependencias) ----
function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function RadarChart({ values, size = 200 }) {
  const cx = size / 2, cy = size / 2, maxR = size * 0.35;
  const n = RADAR_AXES.length;
  const ringPts = (r) => RADAR_AXES.map((_, i) => polar(cx, cy, r, i * 360 / n).join(',')).join(' ');
  const valuePts = RADAR_AXES.map((axis, i) => polar(cx, cy, maxR * Math.min(1, (values[axis.key] ?? 5) / 10), i * 360 / n));
  return (
    <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`}>
      {[1, 0.7, 0.4].map(f => <polygon key={f} points={ringPts(maxR * f)} fill="none" stroke="var(--line-soft)"/>)}
      {RADAR_AXES.map((_, i) => { const [x, y] = polar(cx, cy, maxR, i * 360 / n); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line-soft)"/>; })}
      <polygon points={valuePts.map(p => p.join(',')).join(' ')} fill="color-mix(in oklch, var(--accent) 18%, transparent)" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round"/>
      {valuePts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--accent)"/>)}
      {RADAR_AXES.map((axis, i) => {
        const [x, y] = polar(cx, cy, maxR * 1.28, i * 360 / n);
        return <text key={axis.key} x={x} y={y} textAnchor="middle" fill="var(--fg-mute)" fontSize="10">{axis.label}</text>;
      })}
    </svg>
  );
}

function Sparkline({ values, width = 86, height = 24, color = "var(--accent)" }) {
  if (!values.length) return <svg width={width} height={height}></svg>;
  const min = Math.min(...values), max = Math.max(...values);
  const span = Math.max(1, max - min);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 4) - 2).toFixed(1)}`).join(' ');
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function EvolutionChart({ points, width = 640, height = 150 }) {
  if (points.length < 2) return <div className="empty-state sm">Necesitás al menos 2 evaluaciones para ver la evolución.</div>;
  const min = Math.min(...points.map(p => p.v), 1), max = Math.max(...points.map(p => p.v), 10);
  const span = Math.max(1, max - min);
  const padL = 26, padR = 12, padT = 12, padB = 14;
  const innerW = width - padL - padR, innerH = height - padT - padB;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;
  const coords = points.map((p, i) => [padL + i * step, padT + innerH - ((p.v - min) / span) * innerH]);
  const line = coords.map(c => c.join(',')).join(' ');
  const area = `${padL},${padT + innerH} ${line} ${padL + innerW},${padT + innerH}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {[0, 0.33, 0.66, 1].map(f => <line key={f} x1={padL} y1={padT + innerH * f} x2={width - padR} y2={padT + innerH * f} stroke="var(--line-soft)"/>)}
      <polygon points={area} fill="color-mix(in oklch, var(--accent) 16%, transparent)"/>
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {coords.map((c, i) => <circle key={i} cx={c[0]} cy={c[1]} r={i === coords.length - 1 ? 4.5 : 3.5} fill={i === coords.length - 1 ? 'var(--accent)' : 'var(--bg-elev)'} stroke="var(--accent)" strokeWidth="2"/>)}
    </svg>
  );
}

function Donut({ pct, size = 60 }) {
  const r = size * 0.4, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flex:'none'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-elev-2)" strokeWidth={size*0.1}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth={size*0.1}
        strokeDasharray={`${c * pct / 100} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill="var(--fg)" fontFamily="var(--font-display)" fontSize={size*0.26}>{pct}%</text>
    </svg>
  );
}

// ---- Settings / Hub ----
function SettingsPage() {
  const [profile, setProfile] = window.useStore('profile', window.DEFAULT_PROFILE);
  const [roster, setRoster] = window.useStore('roster', window.DEFAULT_ROSTER);
  const [lastBackupAt, setLastBackupAt] = window.useStore('lastBackupAt', null);
  const [session, setSession] = React.useState(null);
  const [paste, setPaste] = React.useState('');
  const [confirmingWipe, setConfirmingWipe] = React.useState(false);
  const importRef = React.useRef(null);

  React.useEffect(() => {
    window.fcAuth?.session().then(setSession).catch(()=>{});
    const sub = window.fcSupabase?.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub?.data?.subscription?.unsubscribe?.();
  }, []);

  const exportBackup = () => {
    window.downloadJSON(window.exportFutbolClubData(), `futbolclub-backup-${new Date().toISOString().slice(0,10)}.json`);
    setLastBackupAt(new Date().toISOString());
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
  const wipeAllData = () => {
    for (const key of window.db.keys()) window.db.remove(key);
    window.__toast?.('Todos los datos locales fueron eliminados');
    setTimeout(() => location.reload(), 500);
  };

  return <div>
    <div className="page-head"><div><div className="page-kicker">Cuenta y datos</div><h1 className="page-title">Tu futbolClub</h1><div className="page-sub">Elegí la experiencia, protegé tus datos y conectá tu cuenta cuando quieras sincronizar.</div></div></div>

    <section className="card hub-block"><div className="panel-head">Experiencia principal</div><div className="experience-grid">
      {EXPERIENCE_OPTIONS.map(option => <button key={option.id} className={`experience-card ${profile.experience===option.id?'on':''}`} onClick={()=>setProfile(p=>({...p,experience:option.id,onboardingDone:true}))}>
        <span className="experience-icon"><Icon name={option.icon} size={22}/></span><strong>{option.title}</strong><small>{option.text}</small>
      </button>)}
    </div></section>

    <div className="hub-row">
      <section className="card"><div className="panel-head">Perfil</div><label className="field"><span>Tu nombre</span><input value={profile.displayName||''} onChange={e=>setProfile(p=>({...p,displayName:e.target.value}))} placeholder="Nombre o apodo"/></label><label className="field"><span>Temporada</span><input value={profile.season||''} onChange={e=>setProfile(p=>({...p,season:e.target.value}))} placeholder="Ej. 2026 · Apertura"/></label></section>
      <section className="card"><div className="panel-head">Cuenta y sincronización</div>{session ? <><div className="account-row"><div className="avatar-me">{window.initials(session.user?.user_metadata?.full_name || session.user?.email)}</div><div><strong>{session.user?.user_metadata?.full_name || 'Cuenta conectada'}</strong><small>{session.user?.email}</small></div></div><div className="action-row"><button className="btn primary" onClick={()=>window.fcCloud.uploadLocal().then(()=>window.__toast?.('Datos sincronizados')).catch(e=>window.__toast?.(e.message))}>Subir datos</button><button className="btn" onClick={()=>window.fcCloud.downloadToLocal().then(()=>{window.__toast?.('Datos recuperados');setTimeout(()=>location.reload(),500)}).catch(e=>window.__toast?.(e.message))}>Recuperar cuenta</button><button className="btn ghost" onClick={()=>window.fcAuth.signOut()}>Cerrar sesión</button></div></> : <><div className="guest-account-state"><span className="status-dot"></span><div><strong>Estás usando futbolClub sin cuenta</strong><small>Editor, sorteo, camisetas y enlaces compartidos están disponibles. Los datos se guardan solamente en este dispositivo.</small></div></div><div className="action-row"><button className="btn primary" onClick={()=>window.go('auth')}>Iniciar sesión / Crear cuenta</button><button className="btn" disabled={!window.fcAuth?.configured} onClick={()=>window.fcAuth.signInGoogle().catch(e=>window.__toast?.(e.message))}><Icon name="google" size={14}/> Conectar Google para sincronizar</button></div>{!window.fcAuth?.configured && <small className="account-note">La cuenta es opcional. Podrás conectarla cuando el servicio de sincronización esté configurado.</small>}</>}</section>
    </div>

    <div className="hub-row">
      <section className="card"><div className="panel-head">Backup local</div><p className="muted">Exportá todo antes de cambiar de dispositivo o importar otros datos.{lastBackupAt && <> Último backup: <strong>{window.relDate(lastBackupAt)}</strong>.</>}</p><div className="action-row"><button className="btn" onClick={exportBackup}><Icon name="download" size={13}/> Exportar JSON</button><button className="btn" onClick={()=>importRef.current?.click()}><Icon name="upload" size={13}/> Importar</button></div><input ref={importRef} hidden type="file" accept="application/json" onChange={importBackup}/></section>
      <section className="card"><div className="panel-head">Carga rápida de jugadores</div><textarea className="paste-roster" value={paste} onChange={e=>setPaste(e.target.value)} placeholder={'Martín, 10, MED\nNahuel, 1, ARQ\nFacu, 4, DEF'}/><button className="btn primary" onClick={importRosterText}>Agregar al plantel</button></section>
    </div>

    <InstallAppCard />

    <section className="card danger-zone">
      <Icon name="warning" size={20} style={{color:'var(--accent-2)'}}/>
      <div className="danger-copy"><strong>Zona de peligro</strong><div>Eliminar todos los datos locales: plantel, alineaciones, evaluaciones y liga. No se puede deshacer.</div></div>
      {confirmingWipe ? <div className="action-row">
        <button className="btn ghost" onClick={()=>setConfirmingWipe(false)}>Cancelar</button>
        <button className="btn danger" onClick={wipeAllData}>Sí, borrar todo</button>
      </div> : <button className="btn danger-outline" onClick={()=>setConfirmingWipe(true)}><Icon name="trash" size={13}/> Borrar todo…</button>}
    </section>
  </div>;
}

function InstallAppCard() {
  const [installable, setInstallable] = React.useState(!!window.__pwaInstallPrompt);
  const [offlineReady, setOfflineReady] = React.useState(false);

  React.useEffect(() => {
    const canInstall = () => setInstallable(!!window.__pwaInstallPrompt);
    const installed = () => setInstallable(false);
    const ready = () => setOfflineReady(true);
    window.addEventListener('fc:pwa-installable', canInstall);
    window.addEventListener('fc:pwa-installed', installed);
    window.addEventListener('fc:pwa-ready', ready);
    navigator.serviceWorker?.ready.then(ready).catch(()=>{});
    return () => {
      window.removeEventListener('fc:pwa-installable', canInstall);
      window.removeEventListener('fc:pwa-installed', installed);
      window.removeEventListener('fc:pwa-ready', ready);
    };
  }, []);

  const install = async () => {
    const prompt = window.__pwaInstallPrompt;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    window.__pwaInstallPrompt = null;
    setInstallable(false);
  };

  return <section className="card"><div className="panel-head">Aplicación</div><p className="muted">{offlineReady ? 'Lista para abrirse con conexión limitada después de la primera carga.' : 'Preparando los archivos para uso con conexión limitada…'}</p>{installable ? <button className="btn primary" onClick={install}>Instalar futbolClub</button> : <small className="account-note">También podés instalarla desde el menú de tu navegador cuando esté disponible.</small>}</section>;
}

// ---- Coach ----
function inLastDays(dateStr, days, from = new Date()) {
  const d = new Date(dateStr);
  const diff = (from - d) / 86400000;
  return diff >= 0 && diff < days;
}

function CoachPage() {
  const [roster, setRoster] = window.useStore('roster', window.DEFAULT_ROSTER);
  const [sessions, setSessions] = window.useStore('trainingSessions', []);
  const [attendance, setAttendance] = window.useStore('attendance', {});
  const [evaluations, setEvaluations] = window.useStore('evaluations', []);
  const [objectives, setObjectives] = window.useStore('objectives', []);
  const [selected, setSelected] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [sessionModal, setSessionModal] = React.useState(false);
  const [trainingTitle, setTrainingTitle] = React.useState('Entrenamiento');
  const [trainingDate, setTrainingDate] = React.useState(new Date().toISOString().slice(0,10));
  const [showSessions, setShowSessions] = React.useState(false);
  const [newObjective, setNewObjective] = React.useState('');
  const [showEvalForm, setShowEvalForm] = React.useState(false);
  const [form, setForm] = React.useState({rating:7,good:'',improve:'',goal:'',context:'training'});
  const dossierRef = React.useRef(null);

  const exportDossier = async (playerName) => {
    if (!window.html2canvas || !dossierRef.current) return window.__toast?.('Export no disponible todavía, esperá un segundo');
    window.__toast?.('Generando imagen...');
    try {
      const canvas = await window.html2canvas(dossierRef.current, { backgroundColor: '#0e1210', scale: 2, useCORS: true, logging: false });
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${playerName.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-ficha.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        window.__toast?.('Ficha descargada');
      }, 'image/png');
    } catch (_) { window.__toast?.('Error al exportar la ficha'); }
  };

  const attendancePct = (playerId) => sessions.length ? Math.round(sessions.filter(s=>(attendance[s.id]||[]).includes(playerId)).length / sessions.length * 100) : 0;
  const lastEval = (playerId) => evaluations.filter(e=>e.playerId===playerId).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const ratingsTrend = (playerId) => evaluations.filter(e=>e.playerId===playerId).sort((a,b)=>a.date.localeCompare(b.date)).map(e=>e.rating);

  const addSession = () => { const id=`tr${Date.now()}`; setSessions(prev=>[...prev,{id,title:trainingTitle.trim()||'Entrenamiento',date:trainingDate}]); setAttendance(prev=>({...prev,[id]:[]})); setSessionModal(false); window.__toast?.('Entrenamiento creado'); };
  const toggleAttendance = (sessionId, playerId) => setAttendance(prev=>{ const ids=new Set(prev[sessionId]||[]); ids.has(playerId)?ids.delete(playerId):ids.add(playerId); return {...prev,[sessionId]:[...ids]}; });
  const saveEvaluation = () => { if(!selected) return; setEvaluations(prev=>[...prev,{id:`ev${Date.now()}`,playerId:selected,date:new Date().toISOString().slice(0,10),...form,rating:Number(form.rating)||0}]); setForm({rating:7,good:'',improve:'',goal:'',context:'training'}); setShowEvalForm(false); window.__toast?.('Evaluación guardada'); };
  const setAttrs = (playerId, key, value) => setRoster(prev => prev.map(p => p.id===playerId ? {...p, attrs:{...(p.attrs||DEFAULT_ATTRS), [key]: Number(value)}} : p));
  const addObjective = (playerId) => { if(!newObjective.trim()) return; setObjectives(prev=>[...prev,{id:`ob${Date.now()}`,playerId,text:newObjective.trim(),done:false}]); setNewObjective(''); };
  const toggleObjective = (id) => setObjectives(prev=>prev.map(o=>o.id===id?{...o,done:!o.done}:o));
  const deleteObjective = (id) => setObjectives(prev=>prev.filter(o=>o.id!==id));

  // --- Stats de overview ---
  const now = new Date();
  const thisMonth = now.toISOString().slice(0,7);
  const sessionsThisMonth = sessions.filter(s=>s.date.slice(0,7)===thisMonth).length;
  const evaluationsLast30 = evaluations.filter(e=>inLastDays(e.date,30,now)).length;
  const avgRating = evaluations.length ? (evaluations.reduce((a,e)=>a+e.rating,0)/evaluations.length).toFixed(1) : '—';
  const avgAttendance = sessions.length ? Math.round(roster.reduce((a,p)=>a+attendancePct(p.id),0)/(roster.length||1)) : 0;

  const nextSession = sessions.slice().sort((a,b)=>a.date.localeCompare(b.date)).find(s=>s.date>=now.toISOString().slice(0,10))
    || sessions.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];

  const filtered = roster.filter(p => {
    if (filter==='low') return attendancePct(p.id) < 60;
    if (filter==='unrated') { const le = lastEval(p.id); return !le || !inLastDays(le.date, 21, now); }
    return true;
  });

  const player = roster.find(p=>p.id===selected);

  if (player) {
    const attrs = player.attrs || DEFAULT_ATTRS;
    const playerEvaluations = evaluations.filter(e=>e.playerId===selected).sort((a,b)=>b.date.localeCompare(a.date));
    const evoPoints = evaluations.filter(e=>e.playerId===selected).sort((a,b)=>a.date.localeCompare(b.date)).slice(-8).map(e=>({v:e.rating,d:e.date}));
    const pct = attendancePct(selected);
    const streak = sessions.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(-8);
    const playerObjectives = objectives.filter(o=>o.playerId===selected);

    return <div>
      <div className="crumbs">
        <button className="crumb-btn" onClick={()=>setSelected(null)}>Entrenador</button>
        <Icon name="chevronR" size={13}/>
        <button className="crumb-btn" onClick={()=>setSelected(null)}>Plantel</button>
        <Icon name="chevronR" size={13}/>
        <span className="crumb-current">{player.name}</span>
      </div>
      <div className="dossier-head">
        <div/>
        <button className="btn" onClick={()=>exportDossier(player.name)}><Icon name="download" size={13}/> Exportar ficha</button>
        <button className="btn primary" onClick={()=>setShowEvalForm(v=>!v)}><Icon name="plus" size={14}/> Nueva evaluación</button>
      </div>
      <div className="dossier-grid" ref={dossierRef}>
        <div className="dossier-col">
          <section className="card dossier-hero">
            <div className="dossier-avatar" style={{background:window.colorFor(player.name)}}>{window.initials(player.name)}</div>
            <h2>{player.name}</h2>
            <div className="tag-row">
              <span className="mini-tag">{player.pos}</span>
              <span className="mini-tag">#{player.num}</span>
              {player.preferredFoot && <span className="mini-tag">{player.preferredFoot==='left'?'Zurdo':player.preferredFoot==='both'?'Ambas piernas':'Diestro'}</span>}
            </div>
            <div className="dossier-quickstats">
              <div><strong>{avgRatingOf(playerEvaluations)}</strong><span>Nota media</span></div>
              <div><strong>{playerEvaluations.length}</strong><span>Evaluaciones</span></div>
              <div><strong>{pct}%</strong><span>Asistencia</span></div>
            </div>
          </section>

          <section className="card">
            <div className="panel-head-row"><span>Perfil de atributos</span><span className="lime-note">Media {avgAttrOf(attrs)}</span></div>
            <RadarChart values={attrs}/>
            <div className="attrs-edit">
              {RADAR_AXES.map(axis => <label key={axis.key} className="attr-row"><span>{axis.label}</span><input type="range" min="1" max="10" value={attrs[axis.key] ?? 6} onChange={e=>setAttrs(selected, axis.key, e.target.value)}/><b>{attrs[axis.key] ?? 6}</b></label>)}
            </div>
          </section>

          <section className="card">
            <div className="panel-head-row"><span>Objetivos activos</span><span className="muted-note">{playerObjectives.filter(o=>o.done).length} de {playerObjectives.length}</span></div>
            <div className="objectives-list">
              {playerObjectives.map(o => <div key={o.id} className={`objective-row ${o.done?'done':''}`}>
                <button className="objective-check" onClick={()=>toggleObjective(o.id)}>{o.done && <Icon name="check" size={12}/>}</button>
                <span>{o.text}</span>
                <button className="objective-del" onClick={()=>deleteObjective(o.id)}>×</button>
              </div>)}
              {!playerObjectives.length && <div className="empty-state sm">Sin objetivos activos.</div>}
            </div>
            <div className="objective-add"><input value={newObjective} onChange={e=>setNewObjective(e.target.value)} placeholder="Nuevo objetivo…" onKeyDown={e=>e.key==='Enter'&&addObjective(selected)}/><button className="btn sm" onClick={()=>addObjective(selected)}><Icon name="plus" size={12}/></button></div>
          </section>
        </div>

        <div className="dossier-col">
          <section className="dossier-pair">
            <div className="card attendance-card"><Donut pct={pct}/><div><div className="panel-head-row" style={{marginBottom:2}}><span>Asistencia</span></div><div className="muted">{sessions.filter(s=>(attendance[s.id]||[]).includes(selected)).length} de {sessions.length} sesiones</div></div></div>
            <div className="card">
              <div className="panel-head-row"><span>Racha · últimas {streak.length} sesiones</span></div>
              <div className="streak-row">{streak.map(s => <span key={s.id} className={`streak-dot ${(attendance[s.id]||[]).includes(selected)?'on':''}`} title={s.date}></span>)}</div>
              <div className="muted-note">Presente en {streak.filter(s=>(attendance[s.id]||[]).includes(selected)).length} · faltó {streak.filter(s=>!(attendance[s.id]||[]).includes(selected)).length}</div>
            </div>
          </section>

          <section className="card">
            <div className="panel-head-row"><span>Evolución de notas</span></div>
            <EvolutionChart points={evoPoints}/>
            {evoPoints.length>0 && <div className="evo-dates">{evoPoints.map((p,i)=><span key={i}>{p.d.slice(5)}</span>)}</div>}
          </section>

          {showEvalForm && <section className="card eval-form-card">
            <div className="panel-head-row"><span>Nueva evaluación</span><button className="btn sm ghost" onClick={()=>setShowEvalForm(false)}>Cancelar</button></div>
            <div className="form-grid-wide"><label className="field"><span>Contexto</span><select value={form.context} onChange={e=>setForm(v=>({...v,context:e.target.value}))}><option value="training">Entrenamiento</option><option value="match">Partido</option></select></label><label className="field"><span>Nota</span><input type="number" min="1" max="10" value={form.rating} onChange={e=>setForm(v=>({...v,rating:e.target.value}))}/></label><label className="field span-2"><span>Qué hizo bien</span><textarea value={form.good} onChange={e=>setForm(v=>({...v,good:e.target.value}))}/></label><label className="field span-2"><span>Qué debe mejorar</span><textarea value={form.improve} onChange={e=>setForm(v=>({...v,improve:e.target.value}))}/></label><label className="field span-2"><span>Próximo objetivo</span><input value={form.goal} onChange={e=>setForm(v=>({...v,goal:e.target.value}))}/></label></div>
            <button className="btn primary" onClick={saveEvaluation}>Guardar evaluación</button>
          </section>}

          <section className="card">
            <div className="panel-head-row"><span>Historial de evaluaciones</span><span className="muted-note">{playerEvaluations.length} en total</span></div>
            {playerEvaluations.length ? <div className="eval-timeline">{playerEvaluations.map(ev=><article key={ev.id}>
              <span className="timeline-dot"></span>
              <div className="timeline-head"><strong>{ev.date} · {ev.context==='match'?'Partido':'Entrenamiento'}</strong><span className="chip lime">{ev.rating}/10</span></div>
              {ev.good&&<p><b>Bien:</b> {ev.good}</p>}{ev.improve&&<p><b>A mejorar:</b> {ev.improve}</p>}{ev.goal&&<p><b>Objetivo:</b> {ev.goal}</p>}
            </article>)}</div> : <div className="empty-state">Todavía no hay evaluaciones para este jugador.</div>}
          </section>
        </div>
      </div>
    </div>;
  }

  return <div>
    <div className="page-head">
      <div><div className="page-kicker">Modo entrenador</div><h1 className="page-title">Tu plantel</h1><div className="page-sub">Asistencia, evolución y objetivos de un vistazo.</div></div>
      <div style={{display:'flex',gap:8}}>
        <button className="btn" onClick={()=>setSessionModal(true)}><Icon name="session" size={14}/> Nueva sesión</button>
        <button className="btn" onClick={()=>window.go('settings')}>Configurar perfil</button>
      </div>
    </div>

    <div className="stat-strip">
      <div className="stat-card"><div className="stat-n">{avgAttendance}%</div><div className="stat-l">Asistencia promedio</div></div>
      <div className="stat-card"><div className="stat-n">{sessionsThisMonth}</div><div className="stat-l">Sesiones este mes</div></div>
      <div className="stat-card"><div className="stat-n">{evaluationsLast30}</div><div className="stat-l">Evaluaciones · 30 días</div></div>
      <div className="stat-card"><div className="stat-n">{avgRating}</div><div className="stat-l">Nota media</div></div>
    </div>

    {nextSession && <div className="card next-session-banner">
      <span className="banner-icon"><Icon name="session" size={18}/></span>
      <div className="banner-body"><strong>{nextSession.title} · {nextSession.date}</strong><div className="muted">{(attendance[nextSession.id]||[]).length} de {roster.length} confirmados</div></div>
      <div className="avatar-stack">{roster.slice(0,4).map(p=><span key={p.id} className="stack-avatar" style={{background:window.colorFor(p.name)}}>{window.initials(p.name)}</span>)}{roster.length>4 && <span className="stack-more">+{roster.length-4}</span>}</div>
      <button className="btn primary sm" onClick={()=>setShowSessions(true)}>Pasar asistencia</button>
    </div>}

    <div className="panel-head-row" style={{margin:'22px 0 12px'}}>
      <span>Jugadores · {roster.length}</span>
      <div className="seg">
        <button className={filter==='all'?'on':''} onClick={()=>setFilter('all')}>Todos</button>
        <button className={filter==='low'?'on':''} onClick={()=>setFilter('low')}>Baja asistencia</button>
        <button className={filter==='unrated'?'on':''} onClick={()=>setFilter('unrated')}>Sin evaluar</button>
      </div>
    </div>

    <div className="roster-grid">
      {filtered.map(p => {
        const le = lastEval(p.id);
        const trend = ratingsTrend(p.id);
        const pct = attendancePct(p.id);
        const stale = !le || !inLastDays(le.date, 21, now);
        return <button key={p.id} className="roster-overview-card" onClick={()=>setSelected(p.id)}>
          <div className="roc-top">
            <span className="mini-avatar" style={{background:window.colorFor(p.name)}}>{window.initials(p.name)}</span>
            <div className="roc-name"><strong>{p.name}</strong><small>{p.pos} · #{p.num}</small></div>
            {le ? <span className="chip lime">{le.rating}/10</span> : <span className="chip">s/e</span>}
          </div>
          <div className="roc-bar-row"><span>ASISTENCIA</span><span>{pct}%</span></div>
          <div className="roc-bar"><div className="roc-bar-fill" style={{width:`${pct}%`, background: pct<60?'var(--accent-2)':'var(--accent)'}}></div></div>
          <div className="roc-foot">
            {trend.length>1 ? <Sparkline values={trend} color={pct<60?'var(--accent-2)':'var(--accent)'}/> : <span/>}
            {stale ? <span className="stale-note">Sin evaluar hace tiempo</span> : <span className="roc-link">Ver ficha →</span>}
          </div>
        </button>;
      })}
      {!filtered.length && <div className="empty-state">No hay jugadores en este filtro.</div>}
    </div>

    {showSessions && <div className="modal-back" onClick={()=>setShowSessions(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><div><div className="page-kicker">Entrenamientos</div><div className="modal-title">Pasar asistencia</div></div><button className="btn sm ghost" onClick={()=>setShowSessions(false)}>✕</button></div>
        <div className="modal-body session-modal-body">
          {sessions.slice().reverse().map(session=><details key={session.id} open={session.id===nextSession?.id}><summary><strong>{session.title}</strong><small>{session.date} · {(attendance[session.id]||[]).length}/{roster.length}</small></summary>{roster.map(p=><label key={p.id} className="check-row"><input type="checkbox" checked={(attendance[session.id]||[]).includes(p.id)} onChange={()=>toggleAttendance(session.id,p.id)}/><span>{p.name}</span></label>)}</details>)}
          {!sessions.length && <div className="empty-state">Todavía no hay entrenamientos creados.</div>}
        </div>
      </div>
    </div>}

    {sessionModal && <div className="modal-back" onClick={()=>setSessionModal(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><div><div className="page-kicker">Entrenador</div><div className="modal-title">Nueva sesión</div></div><button className="btn sm ghost" onClick={()=>setSessionModal(false)}>✕</button></div>
        <div className="modal-body"><label className="field"><span>Nombre</span><input value={trainingTitle} onChange={e=>setTrainingTitle(e.target.value)}/></label><label className="field"><span>Fecha</span><input type="date" value={trainingDate} onChange={e=>setTrainingDate(e.target.value)}/></label></div>
        <div className="modal-foot"><button className="btn ghost" onClick={()=>setSessionModal(false)}>Cancelar</button><button className="btn primary" onClick={addSession}>Crear sesión</button></div>
      </div>
    </div>}
  </div>;
}
function avgRatingOf(list) { if(!list.length) return '—'; return (list.reduce((a,e)=>a+e.rating,0)/list.length).toFixed(1); }
function avgAttrOf(attrs) { const vals=Object.values(attrs); return (vals.reduce((a,v)=>a+v,0)/vals.length).toFixed(1); }

// ---- League ----
function calculateStandings(fixtures) {
  const table = new Map();
  const row = name => { if(!table.has(name)) table.set(name,{name,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0,form:[]}); return table.get(name); };
  fixtures.filter(f=>f.played).slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(f=>{
    const home=row(f.home), away=row(f.away), hs=Number(f.homeScore), as=Number(f.awayScore);
    home.pj++;away.pj++;home.gf+=hs;home.gc+=as;away.gf+=as;away.gc+=hs;
    if(hs>as){home.pg++;away.pp++;home.pts+=3;home.form.push('G');away.form.push('P');}
    else if(hs<as){away.pg++;home.pp++;away.pts+=3;home.form.push('P');away.form.push('G');}
    else{home.pe++;away.pe++;home.pts++;away.pts++;home.form.push('E');away.form.push('E');}
  });
  return [...table.values()].sort((a,b)=>b.pts-a.pts||((b.gf-b.gc)-(a.gf-a.gc))||b.gf-a.gf||a.name.localeCompare(b.name))
    .map(t=>({...t, form:t.form.slice(-5)}));
}

const normalizeTeamName = (s) => (s || '').trim().toLowerCase();

function LeaguePage() {
  const [competitions, setCompetitions] = window.useStore('competitions', () => {
    const legacy = window.db.load('league', null);
    return [legacy ? { id: 'c1', ...legacy } : { id: 'c1', name: 'Liga amateur', season: '2026', fixtures: [] }];
  });
  const [activeId, setActiveId] = window.useStore('activeCompetitionId', () => competitions[0]?.id || 'c1');
  const [teamCrests, setTeamCrests] = window.useStore('teamCrests', {});
  const [savedTeams] = window.useStore('teams', window.DEFAULT_SAVED_TEAMS);
  const [tab, setTab] = React.useState('table');
  const [form,setForm]=React.useState({date:new Date().toISOString().slice(0,10),home:'',away:'',homeScore:'',awayScore:''});
  const [scoreDrafts, setScoreDrafts] = React.useState({});
  const [newComp, setNewComp] = React.useState({name:'', season:''});
  const [showNewComp, setShowNewComp] = React.useState(false);
  const crestInputRef = React.useRef(null);
  const crestTargetRef = React.useRef(null);

  const competition = competitions.find(c => c.id === activeId) || competitions[0];
  const setCompetition = (updater) => setCompetitions(list =>
    list.map(c => c.id === competition.id ? (typeof updater === 'function' ? updater(c) : updater) : c));

  const fixtures=competition.fixtures||[], standings=calculateStandings(fixtures);
  const teamNameOptions = [...new Set([
    ...savedTeams.map(t=>t.name),
    ...fixtures.flatMap(f=>[f.home,f.away]),
  ])].sort();
  const crestTeamNames = [...new Set([
    ...fixtures.flatMap(f=>[f.home,f.away]),
    ...((competition.cup?.teams)||[]),
  ])].filter(Boolean).sort();

  const teamColorFor = (name) => savedTeams.find(t=>t.name===name) || null;
  const crestFor = (name) => {
    const key = normalizeTeamName(name);
    const t = teamColorFor(name);
    return { name, design: t?.kit || 'solid', primary: t?.color || window.colorFor(name||'?'), secondary: t?.secondary || '#0f172a', photo: teamCrests[key] };
  };

  const addCompetition = () => {
    if (!newComp.name.trim()) return window.__toast?.('Ponele un nombre a la competencia');
    const id = 'c' + Date.now();
    setCompetitions(list => [...list, { id, name: newComp.name.trim(), season: newComp.season.trim() || '2026', fixtures: [] }]);
    setActiveId(id);
    setNewComp({name:'', season:''});
    setShowNewComp(false);
  };
  const deleteCompetition = (id) => {
    if (competitions.length <= 1) return window.__toast?.('Tiene que quedar al menos una competencia');
    if (!confirm('¿Eliminar esta competencia? Se pierde su tabla, fixture y cuadro de copa.')) return;
    setCompetitions(list => list.filter(c => c.id !== id));
    if (activeId === id) setActiveId(competitions.find(c => c.id !== id)?.id);
  };

  const openCrestPicker = (name) => { crestTargetRef.current = name; crestInputRef.current?.click(); };
  const onCrestFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const name = crestTargetRef.current;
    if (!file || !name) return;
    try {
      const dataURL = await window.fileToDataURL(file, 160);
      setTeamCrests(prev => ({ ...prev, [normalizeTeamName(name)]: dataURL }));
    } catch (_) { window.__toast?.('No se pudo cargar el escudo'); }
  };
  const clearCrest = (name) => setTeamCrests(prev => { const n = {...prev}; delete n[normalizeTeamName(name)]; return n; });
  const hideCrest = (name) => setTeamCrests(prev => ({ ...prev, [normalizeTeamName(name)]: 'none' }));

  const saveFixture=()=>{
    if(!form.home.trim()||!form.away.trim())return window.__toast?.('Completá ambos equipos');
    const played=form.homeScore!==''&&form.awayScore!=='';
    setCompetition(l=>({...l,fixtures:[...(l.fixtures||[]),{id:`fx${Date.now()}`,...form,home:form.home.trim(),away:form.away.trim(),played,homeScore:Number(form.homeScore)||0,awayScore:Number(form.awayScore)||0}]}));
    setForm(v=>({...v,home:'',away:'',homeScore:'',awayScore:''}));
    window.__toast?.('Partido agregado');
  };
  const deleteFixture = (id) => setCompetition(l=>({...l,fixtures:l.fixtures.filter(x=>x.id!==id)}));
  const saveScore = (fx) => {
    const draft = scoreDrafts[fx.id] || {};
    const hs = draft.home ?? fx.homeScore, as = draft.away ?? fx.awayScore;
    if (hs==='' || as==='' || hs==null || as==null) return window.__toast?.('Completá ambos marcadores');
    setCompetition(l=>({...l,fixtures:l.fixtures.map(x=>x.id===fx.id?{...x,played:true,homeScore:Number(hs),awayScore:Number(as)}:x)}));
    window.__toast?.('Resultado guardado');
  };

  const played = fixtures.filter(f=>f.played);
  const pending = fixtures.filter(f=>!f.played).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const nextFixture = pending[0];
  const teamStanding = name => standings.find(t=>t.name===name);
  const byDate = {};
  fixtures.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(f=>{ (byDate[f.date] = byDate[f.date]||[]).push(f); });
  const recent = played.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);

  return <div>
    <div className="page-head">
      <div><div className="page-kicker">Modo liga</div><input className="editor-title-input" value={competition.name} onChange={e=>setCompetition(l=>({...l,name:e.target.value}))}/><div className="page-sub">{standings.length} equipos · {played.length} de {fixtures.length} fechas jugadas</div></div>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input className="season-input" value={competition.season} onChange={e=>setCompetition(l=>({...l,season:e.target.value}))} aria-label="Temporada"/>
      </div>
    </div>

    <div className="comp-selector">
      {competitions.map(c => (
        <div key={c.id} className={`comp-pill ${c.id===activeId?'on':''}`}>
          <button className="comp-pill-main" onClick={()=>setActiveId(c.id)}>
            <strong>{c.name}</strong><span>{c.season}</span>
          </button>
          {competitions.length>1 && <button className="comp-pill-del" onClick={()=>deleteCompetition(c.id)} title="Eliminar competencia" aria-label={`Eliminar ${c.name}`}>×</button>}
        </div>
      ))}
      {showNewComp ? (
        <div className="comp-pill comp-pill-new-form">
          <input placeholder="Nombre (ej. Apertura)" value={newComp.name} onChange={e=>setNewComp(v=>({...v,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addCompetition()}/>
          <input placeholder="Temporada" value={newComp.season} onChange={e=>setNewComp(v=>({...v,season:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addCompetition()}/>
          <button className="btn sm primary" onClick={addCompetition}>Crear</button>
          <button className="btn sm ghost" onClick={()=>setShowNewComp(false)}>✕</button>
        </div>
      ) : (
        <button className="comp-pill comp-pill-add" onClick={()=>setShowNewComp(true)}><Icon name="plus" size={13}/> Nueva competencia</button>
      )}
    </div>

    <div className="seg tab-seg">
      <button className={tab==='table'?'on':''} onClick={()=>setTab('table')}>Tabla</button>
      <button className={tab==='fixture'?'on':''} onClick={()=>setTab('fixture')}>Fixture</button>
      <button className={tab==='cup'?'on':''} onClick={()=>setTab('cup')}>Copa</button>
      <button className={tab==='crests'?'on':''} onClick={()=>setTab('crests')}>Escudos</button>
    </div>

    {tab==='table' && <>
      <div className="hub-row uneven">
        <div className="card">
          <div className="panel-head-row"><span>Próxima fecha</span>{nextFixture && <span className="muted-note">{nextFixture.date}</span>}</div>
          {nextFixture ? <div className="matchup-row">
            <div className="matchup-team right"><Crest {...crestFor(nextFixture.home)} size={32}/><div><strong>{nextFixture.home}</strong><small>{teamStanding(nextFixture.home) ? `${standings.indexOf(teamStanding(nextFixture.home))+1}º · ${teamStanding(nextFixture.home).pts} pts` : 'sin datos'}</small></div></div>
            <div className="matchup-vs"></div>
            <div className="matchup-team"><div><strong>{nextFixture.away}</strong><small>{teamStanding(nextFixture.away) ? `${standings.indexOf(teamStanding(nextFixture.away))+1}º · ${teamStanding(nextFixture.away).pts} pts` : 'sin datos'}</small></div><Crest {...crestFor(nextFixture.away)} size={32}/></div>
          </div> : <div className="empty-state sm">No hay partidos pendientes.</div>}
        </div>
        <div className="card">
          <div className="panel-head-row"><span>Carga rápida</span></div>
          <datalist id="league-team-names">{teamNameOptions.map(name => <option key={name} value={name}/>)}</datalist>
          <div className="form-grid-wide"><label className="field span-2"><span>Fecha</span><input type="date" value={form.date} onChange={e=>setForm(v=>({...v,date:e.target.value}))}/></label><label className="field"><span>Local</span><input list="league-team-names" value={form.home} onChange={e=>setForm(v=>({...v,home:e.target.value}))} placeholder="Elegí o escribí un nombre"/></label><label className="field"><span>Visitante</span><input list="league-team-names" value={form.away} onChange={e=>setForm(v=>({...v,away:e.target.value}))} placeholder="Elegí o escribí un nombre"/></label><label className="field"><span>Goles local</span><input type="number" min="0" value={form.homeScore} onChange={e=>setForm(v=>({...v,homeScore:e.target.value}))}/></label><label className="field"><span>Goles visitante</span><input type="number" min="0" value={form.awayScore} onChange={e=>setForm(v=>({...v,awayScore:e.target.value}))}/></label></div>
          <button className="btn primary" onClick={saveFixture}><Icon name="plus" size={14}/> Guardar partido</button>
        </div>
      </div>

      <section className="card">
        <div className="panel-head-row"><span>Tabla de posiciones</span><span className="muted-note">G victoria · E empate · P derrota</span></div>
        {standings.length ? <div className="table-wrap"><table className="standings">
          <thead><tr><th>#</th><th className="left">Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>Forma</th><th>PTS</th></tr></thead>
          <tbody>{standings.map((t,i)=><tr key={t.name} className={i<1?'top-row':''}>
            <td><span className={`pos-badge ${i===0?'first':''}`}>{i+1}</span></td>
            <td className="left"><div className="standings-team"><Crest {...crestFor(t.name)} size={22}/><strong>{t.name}</strong></div></td>
            <td>{t.pj}</td><td>{t.pg}</td><td>{t.pe}</td><td>{t.pp}</td><td>{t.gf}</td><td>{t.gc}</td>
            <td className={t.gf-t.gc>0?'pos-diff':t.gf-t.gc<0?'neg-diff':''}>{t.gf-t.gc>0?'+':''}{t.gf-t.gc}</td>
            <td><span className="form-row">{t.form.map((r,j)=><i key={j} className={`form-dot ${r.toLowerCase()}`}>{r}</i>)}</span></td>
            <td><strong>{t.pts}</strong></td>
          </tr>)}</tbody>
        </table></div> : <div className="empty-state">Cargá un resultado para generar la tabla.</div>}
      </section>

      <section className="card">
        <div className="panel-head-row"><span>Últimos resultados</span></div>
        <div className="results-list">{recent.map(f=><div key={f.id} className="results-row">
          <time>{f.date}</time><strong className="right">{f.home}</strong><span className="score-chip">{f.homeScore} — {f.awayScore}</span><strong>{f.away}</strong>
          <button className="del-icon" onClick={()=>deleteFixture(f.id)} aria-label="Eliminar partido"><Icon name="trash" size={13}/></button>
        </div>)}
        {!recent.length && <div className="empty-state sm">Todavía no hay resultados cargados.</div>}</div>
      </section>
    </>}

    {tab==='fixture' && <div className="fixture-layout">
      <div className="fixture-days">
        {Object.keys(byDate).sort().map(date => <div key={date} className="fixture-day">
          <div className="fixture-day-label">{date}</div>
          {byDate[date].map(f => {
            const draft = scoreDrafts[f.id] || {};
            return <article key={f.id} className={`fixture-card ${!f.played?'pending':''}`}>
              <div className="fixture-card-top"><span className="muted-note">{f.date}</span><span className={`badge ${f.played?'final':'pending'}`}>{f.played?'Final':'Pendiente'}</span></div>
              <div className="fixture-teams">
                <div className="fixture-team right"><strong>{f.home}</strong><Crest {...crestFor(f.home)} size={24}/></div>
                {f.played ? <span className="score-chip">{f.homeScore} – {f.awayScore}</span> : <span className="score-inputs">
                  <input type="number" min="0" value={draft.home ?? ''} onChange={e=>setScoreDrafts(s=>({...s,[f.id]:{...s[f.id],home:e.target.value}}))} placeholder="–"/>
                  <span>–</span>
                  <input type="number" min="0" value={draft.away ?? ''} onChange={e=>setScoreDrafts(s=>({...s,[f.id]:{...s[f.id],away:e.target.value}}))} placeholder="–"/>
                </span>}
                <div className="fixture-team"><Crest {...crestFor(f.away)} size={24}/><strong>{f.away}</strong></div>
              </div>
              <div className="fixture-card-foot">
                <button className="del-icon" onClick={()=>deleteFixture(f.id)} aria-label="Eliminar partido"><Icon name="trash" size={13}/></button>
                {!f.played && <button className="btn primary sm" onClick={()=>saveScore(f)}>Guardar</button>}
              </div>
            </article>;
          })}
        </div>)}
        {!fixtures.length && <div className="empty-state">Todavía no hay partidos cargados. Agregá uno desde la pestaña Tabla.</div>}
      </div>
      <div className="fixture-side">
        <section className="card">
          <div className="panel-head-row"><span>Tabla</span><button className="link-btn" onClick={()=>setTab('table')}>Ver completa →</button></div>
          {standings.slice(0,5).map((t,i)=><div key={t.name} className="mini-standing-row"><span className={`pos-badge sm ${i===0?'first':''}`}>{i+1}</span><strong>{t.name}</strong><span className={t.gf-t.gc>0?'pos-diff':t.gf-t.gc<0?'neg-diff':''}>{t.gf-t.gc>0?'+':''}{t.gf-t.gc}</span><strong>{t.pts}</strong></div>)}
          {!standings.length && <div className="empty-state sm">Sin datos todavía.</div>}
        </section>
      </div>
    </div>}

    {tab==='cup' && <LeagueCup league={competition} setLeague={setCompetition} teamNameOptions={teamNameOptions} crestFor={crestFor}/>}

    {tab==='crests' && (
      <section className="card">
        <div className="panel-head-row"><span>Escudos</span><span className="muted-note">Opcional · por defecto se genera uno simple</span></div>
        {crestTeamNames.length ? <div className="crest-manager-grid">
          {crestTeamNames.map(name => (
            <div key={name} className="crest-manager-row">
              <Crest {...crestFor(name)} size={40}/>
              <span className="crest-manager-name">{name}</span>
              <div className="crest-manager-actions">
                <button className="btn sm" onClick={()=>openCrestPicker(name)}>Subir</button>
                {teamCrests[normalizeTeamName(name)] && <button className="btn sm ghost" onClick={()=>clearCrest(name)}>Generado</button>}
                {teamCrests[normalizeTeamName(name)] !== 'none' && <button className="btn sm ghost" onClick={()=>hideCrest(name)}>Ocultar</button>}
              </div>
            </div>
          ))}
        </div> : <div className="empty-state">Todavía no hay equipos cargados en esta competencia.</div>}
        <input ref={crestInputRef} type="file" accept="image/*" hidden onChange={onCrestFile}/>
      </section>
    )}
  </div>;
}

// ---- League: Copa / eliminatoria directa ----
function getCupWinner(match) {
  if (!match) return null;
  if (match.winnerPick) return match.winnerPick;
  if (match.scoreA === undefined || match.scoreB === undefined || match.scoreA === '' || match.scoreB === '') return null;
  const a = Number(match.scoreA), b = Number(match.scoreB);
  if (a > b) return 'a';
  if (b > a) return 'b';
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
      matches.push({ key, teamA: currentTeams[i*2] || null, teamB: currentTeams[i*2+1] || null, match });
    }
    rounds.push(matches);
    currentTeams = matches.map(m => {
      const w = getCupWinner(m.match);
      if (w === 'a') return m.teamA;
      if (w === 'b') return m.teamB;
      return null;
    });
  }
  return rounds;
}

function cupRoundLabel(r, total) {
  const fromEnd = total - r;
  if (fromEnd === 1) return 'Final';
  if (fromEnd === 2) return 'Semifinal';
  if (fromEnd === 3) return 'Cuartos de final';
  if (fromEnd === 4) return 'Octavos de final';
  if (fromEnd === 5) return 'Dieciseisavos de final';
  return `Ronda ${r+1}`;
}

function LeagueCup({ league, setLeague, teamNameOptions, crestFor }) {
  const cup = league.cup || null;
  const [setupSize, setSetupSize] = React.useState(8);
  const [setupNames, setSetupNames] = React.useState(Array(32).fill(''));
  const [shuffle, setShuffle] = React.useState(true);

  const generateCup = () => {
    const names = setupNames.slice(0, setupSize).map(n => n.trim());
    if (names.some(n => !n)) return window.__toast?.(`Completá el nombre de los ${setupSize} equipos`);
    const teams = shuffle ? window.fisherYates(names) : names;
    setLeague(l => ({ ...l, cup: { size: setupSize, teams, matches: {} } }));
    window.__toast?.('Cuadro generado');
  };

  const resetCup = () => {
    if (!confirm('¿Reiniciar el cuadro eliminatorio? Se perderán los resultados cargados.')) return;
    setLeague(l => ({ ...l, cup: null }));
  };

  const setCupScore = (key, field, value) => {
    setLeague(l => {
      const prev = l.cup.matches?.[key] || {};
      const { winnerPick, ...rest } = prev;
      return { ...l, cup: { ...l.cup, matches: { ...l.cup.matches, [key]: { ...rest, [field]: value } } } };
    });
  };
  const setCupWinnerPick = (key, side) => {
    setLeague(l => ({ ...l, cup: { ...l.cup, matches: { ...l.cup.matches, [key]: { ...(l.cup.matches?.[key]||{}), winnerPick: side } } } }));
  };
  const stepCupScore = (key, field, current, delta) => {
    const next = Math.max(0, (Number(current) || 0) + delta);
    setCupScore(key, field, String(next));
  };

  if (!cup) {
    return (
      <div className="card cup-setup">
        <div className="panel-head-row"><span>Nuevo cuadro eliminatorio</span></div>
        <div className="seg" style={{marginBottom:14}}>
          {[4,8,16,32].map(n => <button key={n} className={setupSize===n?'on':''} onClick={()=>setSetupSize(n)}>{n} equipos</button>)}
        </div>
        <datalist id="league-team-names">{teamNameOptions.map(name => <option key={name} value={name}/>)}</datalist>
        <div className="cup-setup-grid">
          {Array.from({length: setupSize}).map((_, i) => (
            <input key={i} list="league-team-names" value={setupNames[i]||''}
                   onChange={e=>setSetupNames(prev=>{ const next=prev.slice(); next[i]=e.target.value; return next; })}
                   placeholder={`Equipo ${i+1}`}/>
          ))}
        </div>
        <label className="toggle-row"><input type="checkbox" checked={shuffle} onChange={e=>setShuffle(e.target.checked)}/> <span>Sortear posiciones del cuadro</span></label>
        <button className="btn primary" onClick={generateCup}><Icon name="shuffle" size={14}/> Generar cuadro</button>
      </div>
    );
  }

  const rounds = buildCupRounds(cup);
  const finalRoundIdx = rounds.length - 1;
  const finalMatch = rounds[finalRoundIdx][0];
  const champion = finalMatch ? getCupWinner(finalMatch.match) : null;
  const championName = champion === 'a' ? finalMatch.teamA : champion === 'b' ? finalMatch.teamB : null;
  const sideRounds = rounds.slice(0, finalRoundIdx);

  const renderMatch = (m) => {
    const winner = getCupWinner(m.match);
    const canScore = m.teamA && m.teamB;
    const tied = canScore && m.match.scoreA !== '' && m.match.scoreB !== '' && m.match.scoreA !== undefined && m.match.scoreB !== undefined && Number(m.match.scoreA) === Number(m.match.scoreB) && !m.match.winnerPick;
    const stepper = (field, value) => (
      <div className="cup-score-stepper">
        <button type="button" onClick={()=>stepCupScore(m.key, field, value, -1)} aria-label="Restar gol">−</button>
        <input type="number" min="0" value={value ?? ''} onChange={e=>setCupScore(m.key, field, e.target.value)}/>
        <button type="button" onClick={()=>stepCupScore(m.key, field, value, 1)} aria-label="Sumar gol">+</button>
      </div>
    );
    return (
      <div key={m.key} className="cup-match">
        <div className={`cup-team ${winner==='a'?'winner':''}`}>
          {m.teamA && <Crest {...crestFor(m.teamA)} size={18}/>}
          <span className="cup-team-name">{m.teamA || 'Por definir'}</span>
          {canScore && stepper('scoreA', m.match.scoreA)}
        </div>
        <div className={`cup-team ${winner==='b'?'winner':''}`}>
          {m.teamB && <Crest {...crestFor(m.teamB)} size={18}/>}
          <span className="cup-team-name">{m.teamB || 'Por definir'}</span>
          {canScore && stepper('scoreB', m.match.scoreB)}
        </div>
        {tied && (
          <div className="cup-tiebreak">
            <span>Empate:</span>
            <button onClick={()=>setCupWinnerPick(m.key,'a')}>{m.teamA}</button>
            <button onClick={()=>setCupWinnerPick(m.key,'b')}>{m.teamB}</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="cup-toolbar">
        <span className="muted-note">{cup.size} equipos · eliminación directa</span>
        <button className="btn sm ghost" onClick={resetCup}><Icon name="refresh" size={12}/> Reiniciar cuadro</button>
      </div>
      <div className="cup-bracket">
        <div className="cup-side">
          {sideRounds.map((roundMatches, r) => (
            <div key={r} className="cup-round">
              <div className="cup-round-label">{cupRoundLabel(r, rounds.length)}</div>
              <div className="cup-round-matches">
                {roundMatches.slice(0, roundMatches.length/2).map(renderMatch)}
              </div>
            </div>
          ))}
        </div>

        <div className="cup-round cup-champion-col">
          <div className="cup-round-label">Final</div>
          <div className="cup-round-matches cup-round-matches-final">
            {renderMatch(finalMatch)}
          </div>
          <div className="cup-round-label" style={{marginTop:18}}>Campeón</div>
          <div className={`cup-champion-card ${championName?'has-winner':''}`}>
            <Icon name="trophy" size={18}/>
            <span>{championName || 'Por definir'}</span>
          </div>
        </div>

        <div className="cup-side">
          {sideRounds.slice().reverse().map((roundMatches, ri) => {
            const r = sideRounds.length - 1 - ri;
            return (
              <div key={r} className="cup-round">
                <div className="cup-round-label">{cupRoundLabel(r, rounds.length)}</div>
                <div className="cup-round-matches">
                  {roundMatches.slice(roundMatches.length/2).map(renderMatch)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const platformCSS=document.createElement('style');platformCSS.textContent=`
.hub-block{margin-bottom:16px}.hub-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}.hub-row.uneven{grid-template-columns:1.4fr 1fr}
.experience-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.experience-card{display:flex;flex-direction:column;text-align:left;gap:8px;padding:16px;border:1px solid var(--line);border-radius:var(--radius);background:var(--bg-elev-2);color:var(--fg-mute)}.experience-card.on{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}.experience-icon{width:34px;height:34px;border-radius:8px;background:var(--bg-elev);display:grid;place-items:center;color:var(--accent)}.experience-card strong{color:var(--fg)}.experience-card small,.account-row small{display:block;color:var(--fg-dim)}
.field{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}.field>span{font:11px var(--font-cond);text-transform:uppercase;letter-spacing:1px;color:var(--fg-dim)}.field input,.field select,.field textarea,.paste-roster,.season-input{width:100%;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:9px;color:var(--fg)}.field textarea{min-height:72px;resize:vertical}.paste-roster{min-height:120px;margin-bottom:10px}.muted{color:var(--fg-mute)}.action-row,.account-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.danger-zone{display:flex;align-items:center;gap:14px;background:color-mix(in oklch,var(--accent-2) 6%,var(--bg-elev));border-color:color-mix(in oklch,var(--accent-2) 45%,var(--line-soft));margin-top:16px}.danger-copy{flex:1}.danger-copy strong{color:var(--accent-2);font-size:13.5px}.danger-copy div{color:var(--fg-mute);font-size:12px;margin-top:2px}.btn.danger-outline{background:transparent;border-color:var(--accent-2);color:var(--accent-2)}.btn.danger{background:var(--accent-2);border-color:var(--accent-2);color:#fff;font-weight:600}
.panel-head-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;font:600 11px var(--font-cond);text-transform:uppercase;letter-spacing:1.4px;color:var(--fg-dim)}.lime-note{color:var(--accent);font-family:var(--font-body);text-transform:none;letter-spacing:0}.muted-note{font-family:var(--font-body);text-transform:none;letter-spacing:0;color:var(--fg-mute);font-size:12px}
.crumbs{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--fg-dim);margin-bottom:10px}.crumb-btn{color:var(--fg-dim)}.crumb-btn:hover{color:var(--accent)}.crumb-current{color:var(--fg);font-weight:600}
.dossier-head{display:flex;justify-content:flex-end;gap:8px;margin-bottom:14px}
.dossier-grid{display:grid;grid-template-columns:360px minmax(0,1fr);gap:14px;align-items:start}.dossier-col{display:flex;flex-direction:column;gap:14px;min-width:0}
.dossier-hero{text-align:center}.dossier-avatar{width:76px;height:76px;border-radius:16px;margin:0 auto 10px;display:grid;place-items:center;font-family:var(--font-display);font-size:30px;color:#fff}.dossier-hero h2{font:36px var(--font-display);margin:0 0 8px}.tag-row{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:14px}.mini-tag{padding:3px 9px;border-radius:99px;background:var(--bg-elev-2);border:1px solid var(--line);font-size:11px;color:var(--fg-mute)}
.dossier-quickstats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.dossier-quickstats div{background:var(--bg-elev-2);border-radius:8px;padding:11px;text-align:center}.dossier-quickstats strong{display:block;font:26px var(--font-display)}.dossier-quickstats span{font:9.5px var(--font-cond);text-transform:uppercase;letter-spacing:1px;color:var(--fg-dim)}
.attrs-edit{display:flex;flex-direction:column;gap:6px;margin-top:8px}.attr-row{display:grid;grid-template-columns:76px 1fr 20px;align-items:center;gap:8px;font-size:11.5px;color:var(--fg-mute)}.attr-row input[type=range]{accent-color:var(--accent)}.attr-row b{color:var(--fg);text-align:right}
.objectives-list{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}.objective-row{display:flex;align-items:center;gap:10px;font-size:12.5px}.objective-row.done span:first-of-type{color:var(--fg-dim);text-decoration:line-through}.objective-check{width:20px;height:20px;border-radius:6px;border:1px solid var(--line);background:var(--bg);display:grid;place-items:center;flex:none;color:#0e1210}.objective-row.done .objective-check{background:var(--accent);border-color:var(--accent)}.objective-row span:first-of-type{flex:1}.objective-del{color:var(--fg-dim);font-size:14px}.objective-del:hover{color:var(--accent-2)}
.objective-add{display:flex;gap:6px}.objective-add input{flex:1;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:7px 9px;color:var(--fg);font-size:12.5px}
.dossier-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.attendance-card{display:flex;align-items:center;gap:14px}.streak-row{display:flex;gap:5px;margin-bottom:8px}.streak-dot{flex:1;height:22px;border-radius:5px;background:var(--bg-elev-2);border:1px solid var(--line)}.streak-dot.on{background:var(--accent);border-color:var(--accent)}
.evo-dates{display:flex;justify-content:space-between;font-size:10px;color:var(--fg-dim);padding:0 14px;margin-top:2px}
.eval-timeline{position:relative;padding-left:24px}.eval-timeline::before{content:'';position:absolute;left:6px;top:4px;bottom:4px;width:2px;background:var(--line-soft)}.eval-timeline article{position:relative;margin-bottom:16px}.timeline-dot{position:absolute;left:-24px;top:2px;width:14px;height:14px;border-radius:50%;background:var(--accent);border:3px solid var(--bg-elev)}.timeline-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px}.eval-timeline p{margin:3px 0;color:var(--fg-mute);font-size:12.5px}
.eval-form-card .form-grid-wide{margin-bottom:10px}
.stat-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.stat-card{background:var(--bg-elev);border:1px solid var(--line-soft);border-radius:var(--radius);padding:16px}.stat-n{font:34px var(--font-display);line-height:1}.stat-l{font:10.5px var(--font-cond);text-transform:uppercase;letter-spacing:1px;color:var(--fg-dim);margin-top:4px}
.next-session-banner{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:16px 18px;margin-bottom:0}.banner-icon{width:38px;height:38px;border-radius:8px;background:var(--bg-elev-2);display:grid;place-items:center;color:var(--accent);flex:none}.banner-body{flex:1;min-width:200px}.avatar-stack{display:flex;align-items:center}.stack-avatar{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:700;border:2px solid var(--bg);margin-left:-8px;color:#fff}.stack-avatar:first-child{margin-left:0;border-color:var(--accent)}.stack-more{font-size:11px;color:var(--fg-dim);margin-left:6px}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:6px;overflow:hidden}.seg button{padding:5px 12px;font-size:11px;color:var(--fg-mute);background:transparent}.seg button.on{background:var(--accent);color:#0e1210;font-weight:600}.tab-seg{margin-bottom:16px}
.roster-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.roster-overview-card{text-align:left;background:var(--bg-elev);border:1px solid var(--line-soft);border-radius:var(--radius);padding:16px;display:flex;flex-direction:column;gap:0;transition:border-color .15s}.roster-overview-card:hover{border-color:var(--accent)}
.roc-top{display:flex;align-items:center;gap:10px;margin-bottom:12px}.roc-name{flex:1;min-width:0}.roc-name strong{display:block;font-size:14px}.roc-name small{color:var(--fg-dim);font-size:11px}
.roc-bar-row{display:flex;justify-content:space-between;font:10.5px var(--font-cond);text-transform:uppercase;letter-spacing:1px;color:var(--fg-dim);margin-bottom:4px}.roc-bar-row span:last-child{color:var(--fg);font-weight:600;font-family:var(--font-body);text-transform:none}
.roc-bar{height:4px;border-radius:2px;background:var(--bg-elev-2);margin-bottom:12px}.roc-bar-fill{height:4px;border-radius:2px}
.roc-foot{display:flex;align-items:center;justify-content:space-between}.roc-link{font-size:11px;color:var(--fg-mute)}.stale-note{font-size:11px;color:var(--warn)}
.mini-avatar{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;flex:none}
.form-grid-wide{display:grid;grid-template-columns:1fr 1fr;gap:10px}.form-grid-wide .span-2{grid-column:span 2}
.session-modal-body{max-height:60vh;overflow:auto}.session-list details{border-top:1px solid var(--line);padding:9px 0}.session-modal-body details{border-top:1px solid var(--line-soft);padding:9px 0}.session-modal-body summary{cursor:pointer}.session-modal-body summary small{display:block;color:var(--fg-dim)}.check-row{display:flex;gap:8px;padding:5px}
.matchup-row{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center}.matchup-team{min-width:0;display:flex;align-items:center;gap:10px}.matchup-team.right{text-align:right;flex-direction:row-reverse}.matchup-team strong{display:block;font:26px var(--font-display)}.matchup-team small{color:var(--fg-dim);font-size:11px}.matchup-vs{text-align:center}.matchup-vs::before{content:'VS';display:block;font:20px var(--font-display);color:var(--accent)}
.table-wrap{overflow:auto}.standings{width:100%;border-collapse:collapse;font-size:13px}.standings th,.standings td{padding:9px 6px;border-bottom:1px solid var(--line-soft);text-align:center}.standings th{font:10.5px var(--font-cond);text-transform:uppercase;letter-spacing:1px;color:var(--fg-dim)}.standings td.left,.standings th.left{text-align:left}.standings tr.top-row{background:color-mix(in oklch,var(--accent) 6%,transparent)}
.pos-badge{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:5px;background:var(--bg-elev-2);color:var(--fg-mute);font-weight:700;font-size:11px}.pos-badge.first{background:var(--accent);color:#0e1210}.pos-badge.sm{width:18px;height:18px;font-size:10px}
.pos-diff{color:var(--accent)}.neg-diff{color:var(--accent-2)}
.form-row{display:inline-flex;gap:3px}.form-dot{width:14px;height:14px;border-radius:4px;background:var(--bg-elev-2);color:var(--fg-mute);font-style:normal;font-size:9px;font-weight:700;display:grid;place-items:center}.form-dot.g{background:var(--accent);color:#0e1210}.form-dot.p{background:var(--accent-2);color:#fff}
.results-list{display:flex;flex-direction:column}.results-row{display:grid;grid-template-columns:100px 1fr auto 1fr 28px;gap:10px;align-items:center;padding:11px 0;border-top:1px solid var(--line-soft);text-align:center;font-size:13px}.results-row:first-child{border-top:0}.results-row time{color:var(--fg-dim);text-align:left;font-size:12px}.results-row strong.right{text-align:right}.score-chip{font-family:var(--font-mono);font-weight:600;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:4px 10px}.del-icon{color:var(--fg-dim);display:grid;place-items:center}.del-icon:hover{color:var(--accent-2)}
.fixture-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:14px;align-items:start}.fixture-days{display:flex;flex-direction:column;gap:16px}.fixture-day-label{font:11px var(--font-cond);text-transform:uppercase;letter-spacing:1.4px;color:var(--fg-dim);margin-bottom:8px}
.fixture-card{background:var(--bg-elev);border:1px solid var(--line-soft);border-radius:10px;padding:14px 16px;margin-bottom:10px}.fixture-card.pending{border-color:var(--accent)}.fixture-card-top{display:flex;justify-content:space-between;margin-bottom:10px}
.badge{padding:2px 9px;border-radius:99px;font:700 10px var(--font-cond);text-transform:uppercase;letter-spacing:1px}.badge.final{background:var(--accent);color:#0e1210}.badge.pending{background:var(--bg-elev-2);border:1px solid var(--line);color:var(--warn)}
.fixture-teams{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center}.fixture-team{display:flex;align-items:center;gap:8px;min-width:0}.fixture-team.right{justify-content:flex-end;text-align:right}.score-inputs{display:inline-flex;gap:6px;align-items:center}.score-inputs input{width:38px;height:34px;background:var(--bg);border:1px solid var(--line);border-radius:6px;text-align:center;color:var(--fg);font-family:var(--font-mono)}
.fixture-card-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:12px;align-items:center}
.fixture-side{display:flex;flex-direction:column;gap:14px}.mini-standing-row{display:grid;grid-template-columns:22px 1fr 34px 34px;gap:6px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line-soft);font-size:12.5px}.mini-standing-row:last-child{border-bottom:0}.link-btn{color:var(--accent);font-size:11px}
.empty-state{padding:28px;text-align:center;color:var(--fg-dim)}.empty-state.sm{padding:14px;font-size:12.5px}
.cup-setup{max-width:640px}
.cup-setup-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:14px}
.cup-setup-grid input{background:var(--bg-elev-2);border:1px solid var(--line);border-radius:6px;padding:8px 10px;font-size:12.5px;color:var(--fg);outline:none}
.cup-setup .toggle-row{margin-bottom:14px}
.cup-toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.cup-bracket{display:flex;gap:28px;align-items:center;overflow-x:auto;padding-bottom:8px}
.cup-side{display:flex;gap:28px;align-self:stretch}
.cup-round{display:flex;flex-direction:column;flex:none;width:180px}
.cup-round-label{font:11px var(--font-cond);text-transform:uppercase;letter-spacing:1.4px;color:var(--fg-dim);text-align:center;margin-bottom:10px}
.cup-round-matches{flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:14px}
.cup-round-matches-final{flex:none}
.cup-match{display:flex;flex-direction:column;background:var(--bg-elev);border:1px solid var(--line-soft);border-radius:8px;overflow:visible;position:relative}
.cup-team{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 8px 7px 10px;border-bottom:1px solid var(--line-soft);font-size:12.5px}
.cup-team:last-child{border-bottom:0}
.cup-team.winner{background:color-mix(in oklch,var(--accent) 12%,transparent);font-weight:700}
.cup-team-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--fg-mute)}
.cup-team.winner .cup-team-name{color:var(--fg)}
.cup-score-stepper{display:flex;align-items:center;gap:2px;flex:none}
.cup-score-stepper button{width:18px;height:18px;padding:0;border-radius:4px;background:var(--bg-elev-2);border:1px solid var(--line);color:var(--fg-mute);font-size:11px;line-height:1;display:inline-flex;align-items:center;justify-content:center;flex:none}
.cup-score-stepper button:hover{border-color:var(--accent);color:var(--accent)}
.cup-score-stepper input{width:22px;background:transparent;border:0;text-align:center;color:var(--fg);font-family:var(--font-mono);font-size:12.5px;font-weight:700;padding:0;-moz-appearance:textfield}
.cup-score-stepper input::-webkit-outer-spin-button,.cup-score-stepper input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.cup-tiebreak{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 10px;border-top:1px dashed var(--line);font-size:11px;color:var(--warn)}
.cup-tiebreak button{padding:3px 8px;border-radius:4px;background:var(--bg-elev-2);border:1px solid var(--line);color:var(--fg);font-size:11px}
.cup-tiebreak button:hover{border-color:var(--accent);color:var(--accent)}
.cup-champion-col{width:170px;align-items:center;flex:none}
.cup-champion-col .cup-round-label{width:100%}
.cup-champion-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 14px;background:var(--bg-elev);border:1px dashed var(--line);border-radius:10px;color:var(--fg-dim);text-align:center;font-size:13px;width:100%}
.cup-champion-card.has-winner{border-style:solid;border-color:var(--accent);color:var(--accent);background:color-mix(in oklch,var(--accent) 10%,var(--bg-elev));font-family:var(--font-display);font-size:20px;letter-spacing:.5px}
@media(max-width:900px){.cup-bracket{flex-direction:column;align-items:stretch}.cup-side{flex-direction:column}}
.comp-selector{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.comp-pill{display:flex;align-items:stretch;background:var(--bg-elev);border:1px solid var(--line-soft);border-radius:8px;overflow:hidden}
.comp-pill.on{border-color:var(--accent)}
.comp-pill-main{display:flex;flex-direction:column;align-items:flex-start;padding:7px 12px;gap:1px;color:var(--fg-mute)}
.comp-pill.on .comp-pill-main{color:var(--fg)}
.comp-pill-main strong{font-size:12.5px}
.comp-pill-main span{font-family:var(--font-mono);font-size:10px;color:var(--fg-dim)}
.comp-pill-del{padding:0 8px;color:var(--fg-dim);border-left:1px solid var(--line-soft)}
.comp-pill-del:hover{color:var(--accent-2)}
.comp-pill-add{padding:7px 14px;display:flex;align-items:center;gap:6px;color:var(--fg-mute);border-style:dashed;background:transparent}
.comp-pill-add:hover{color:var(--accent);border-color:var(--accent)}
.comp-pill-new-form{display:flex;align-items:center;gap:6px;padding:6px}
.comp-pill-new-form input{background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:6px 8px;font-size:12px;color:var(--fg);outline:none;width:120px}
.standings-team{display:flex;align-items:center;gap:8px}
.crest-manager-grid{display:flex;flex-direction:column;gap:2px}
.crest-manager-row{display:flex;align-items:center;gap:12px;padding:8px 0;border-top:1px solid var(--line-soft)}
.crest-manager-row:first-child{border-top:0}
.crest-manager-name{flex:1;font-size:13px}
.crest-manager-actions{display:flex;gap:6px}
@media(max-width:1100px){.hub-row,.hub-row.uneven,.roster-grid,.dossier-grid,.dossier-pair,.fixture-layout{grid-template-columns:1fr}}
@media(max-width:650px){.experience-grid,.form-grid-wide{grid-template-columns:1fr}.form-grid-wide .span-2{grid-column:auto}.stat-strip{grid-template-columns:1fr 1fr}.fixture-teams{grid-template-columns:1fr}.results-row{grid-template-columns:1fr 1fr}.results-row time{grid-column:1/-1}.results-row .del-icon{grid-column:1/-1}}
`;document.head.appendChild(platformCSS);
const accountCSS = document.createElement('style');
accountCSS.textContent = '.guest-account-state{display:flex;gap:10px;align-items:flex-start;padding:12px;margin-bottom:12px;background:var(--bg-elev-2);border-radius:8px}.guest-account-state small,.account-note{display:block;color:var(--fg-dim);margin-top:4px}.status-dot{width:9px;height:9px;flex:0 0 auto;margin-top:5px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px color-mix(in oklch,var(--accent) 18%,transparent)}';
document.head.appendChild(accountCSS);
ReactDOM.createRoot(document.getElementById('page-coach')).render(<CoachPage/>);
ReactDOM.createRoot(document.getElementById('page-league')).render(<LeaguePage/>);
ReactDOM.createRoot(document.getElementById('page-settings')).render(<SettingsPage/>);
