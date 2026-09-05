function EditorPage() {
  const L = window.fcLineup;
  const [roster, setRoster] = window.useStore("roster", window.DEFAULT_ROSTER);
  const [teams, setTeams] = window.useStore("teams", window.DEFAULT_SAVED_TEAMS);
  const [draft, setDraft] = window.useStore("editor", {
    teamId: null,
    name: "Los Pibes del Viernes",
    mode: 7,
    formIdx: 0,
    freeMode: false,
    kit: { design: "solid", primary: "#e11d48", secondary: "#0f172a" },
    assignedIds: [],
    freePositions: {},
    substituteIds: [],
    captainId: null,
  });
  const [search, setSearch] = React.useState("");
  const [modal, setModal] = React.useState(null);
  const [photoTargetId, setPhotoTargetId] = React.useState(null);
  const [playerStyle, setPlayerStyle] = React.useState(() => window.fcGetTweaks?.().playerStyle || "photo");
  const photoInputRef = React.useRef(null);

  const mode = draft.mode;
  const formIdx = draft.formIdx;
  const formation = window.FORMATIONS[mode][formIdx];
  const size = formation.positions.length;
  const freeKey = `${mode}:${formIdx}`;
  const activeKit = draft.activeKit === "alt" && draft.altKit ? draft.altKit : draft.kit;
  const ids = L.resizeAssignments(draft.assignedIds || [], size);
  const assigned = React.useMemo(() => ids.map((id) => id == null ? null : roster.find((player) => player.id === id) || null), [draft.assignedIds, roster, size]);
  const substituteSet = React.useMemo(() => new Set(draft.substituteIds || []), [draft.substituteIds]);
  const visibleRoster = roster.filter((player) => !search.trim() || player.name.toLowerCase().includes(search.trim().toLowerCase()));

  React.useEffect(() => {
    const onChange = (event) => event.detail.key === "playerStyle" && setPlayerStyle(event.detail.value);
    window.addEventListener("fc:tweak-changed", onChange);
    return () => window.removeEventListener("fc:tweak-changed", onChange);
  }, []);
  React.useEffect(() => {
    setDraft((current) => {
      const resized = L.resizeAssignments(current.assignedIds || [], size);
      return resized.length === (current.assignedIds || []).length ? current : { ...current, assignedIds: resized };
    });
  }, [size]);

  const setIds = (producer) => setDraft((current) => ({ ...current, assignedIds: producer(L.resizeAssignments(current.assignedIds || [], size)) }));
  const assign = (playerId, slot) => setIds((current) => L.assignPlayer(current, playerId, slot, size));
  const swap = (a, b) => setIds((current) => L.swapSlots(current, a, b, size));
  const removeFromField = (slot) => setIds((current) => L.unassignPlayer(current, slot, size));
  const autoFill = () => setIds((current) => L.autoFillAssignments(current, roster, size));
  const clearAll = () => setDraft((current) => ({ ...current, assignedIds: L.resizeAssignments([], size), captainId: null }));
  const movePosition = (slot, x, y) => setDraft((current) => ({ ...current, freePositions: L.moveFreePosition(current.freePositions, freeKey, slot, [x, y], size) }));
  const resetPositions = () => setDraft((current) => ({ ...current, freePositions: L.resetFreePositions(current.freePositions, freeKey) }));
  const toggleSubstitute = (id) => setDraft((current) => ({ ...current, substituteIds: L.toggleId(current.substituteIds || [], id) }));
  const setCaptain = (id) => setDraft((current) => ({ ...current, captainId: current.captainId === id ? null : id }));
  const quickAssign = (id) => {
    const slot = ids.findIndex((value) => value === id);
    if (slot >= 0) return removeFromField(slot);
    const empty = ids.findIndex((value) => value == null);
    if (empty < 0) return window.__toast?.("La cancha está completa");
    assign(id, empty);
  };

  const saveTeam = () => {
    const teamEntry = L.createTeamEntry({ ...draft, assignedIds: ids }, formation, () => new Date(), () => `t${Date.now()}`);
    setTeams((current) => {
      const index = current.findIndex((team) => team.id === teamEntry.id);
      if (index < 0) return [...current, teamEntry];
      const next = current.slice(); next[index] = teamEntry; return next;
    });
    setDraft((current) => ({ ...current, teamId: teamEntry.id }));
    window.go("share");
  };

  const onRosterDragStart = (event, id) => {
    event.dataTransfer.setData("application/x-roster", String(id));
    event.dataTransfer.effectAllowed = "copy";
  };
  const onPhotoClick = (id) => { setPhotoTargetId(id); photoInputRef.current?.click(); };
  const onPhotoChange = async (event) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || photoTargetId == null) return;
    try {
      const photo = await window.fileToDataURL(file, 256);
      setRoster((current) => current.map((player) => player.id === photoTargetId ? { ...player, photo } : player));
    } catch (error) { window.__toast?.(error.message || "No se pudo cargar la imagen"); }
    setPhotoTargetId(null);
  };
  const removePlayer = (id) => {
    const player = roster.find((item) => item.id === id);
    if (!confirm(`¿Eliminar a ${player?.name || "este jugador"} del plantel?`)) return;
    setRoster((current) => current.filter((item) => item.id !== id));
    setIds((current) => current.map((value) => value === id ? null : value));
  };
  const savePlayer = (value) => {
    if (modal?.type === "edit") setRoster((current) => current.map((player) => player.id === modal.player.id ? { ...player, ...value } : player));
    else setRoster((current) => [...current, { ...value, id: window.nextPlayerId(current), active: true }]);
    setModal(null);
  };

  return <div>
    <div className="page-head"><div><div className="page-kicker">Editor · Fut {mode} · {draft.freeMode ? "Libre" : formation.name}</div><input className="editor-title-input" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}/></div><div style={{display:"flex",gap:8}}><button className="btn" onClick={clearAll}>Limpiar</button><button className="btn" onClick={autoFill}>Auto-completar</button><button className="btn primary" onClick={saveTeam}>Guardar →</button></div></div>
    <div className="editor-grid">
      <aside className="editor-left">
        <div className="panel"><div className="panel-head">Modo</div><div className="seg wide">{[5,6,7,8,11].map((value)=><button key={value} className={mode===value?"on":""} onClick={()=>setDraft((current)=>({...current,mode:value,formIdx:0}))}>Fut {value}</button>)}</div></div>
        <div className="panel"><div className="panel-head">Formación<label className="switch"><input type="checkbox" checked={draft.freeMode} onChange={(event)=>setDraft((current)=>({...current,freeMode:event.target.checked}))}/><span>Libre</span></label></div><div className={`form-list ${draft.freeMode?"disabled":""}`}>{window.FORMATIONS[mode].map((item,index)=><button key={item.name} className={`form-pill ${formIdx===index?"on":""}`} onClick={()=>setDraft((current)=>({...current,formIdx:index}))}><FormationDot formation={item}/><span>{item.name}</span></button>)}</div>{draft.freeMode&&<div className="free-note">Arrastrá los jugadores a cualquier punto.<button className="btn sm ghost" onClick={resetPositions}>Restablecer posiciones</button></div>}</div>
        <div className="panel"><div className="panel-head">Camiseta</div><div className="kit-alt-row"><button className={`kit-alt-opt ${(draft.activeKit||"main")==="main"?"on":""}`} onClick={()=>setDraft((current)=>({...current,activeKit:"main"}))}><Kit design={draft.kit.design} primary={draft.kit.primary} secondary={draft.kit.secondary} number={10} size={64}/><span>Titular</span></button><button className={`kit-alt-opt ${draft.activeKit==="alt"?"on":""}`} onClick={()=>draft.altKit?setDraft((current)=>({...current,activeKit:"alt"})):window.go("kits")}>{draft.altKit?<Kit design={draft.altKit.design} primary={draft.altKit.primary} secondary={draft.altKit.secondary} number={10} size={64}/>:<div className="kit-alt-empty"><Icon name="plus" size={16}/></div>}<span>{draft.altKit?"Alternativa":"Agregar alt."}</span></button></div><button className="btn sm" style={{width:"100%",marginTop:8}} onClick={()=>window.go("kits")}>Editar camisetas →</button><div className="kit-style-row"><span>Ver en cancha</span><div className="seg"><button className={playerStyle==="photo"?"on":""} onClick={()=>window.fcSetTweak("playerStyle","photo")}>Foto</button><button className={playerStyle==="shirt"?"on":""} onClick={()=>window.fcSetTweak("playerStyle","shirt")}>Camiseta</button></div></div></div>
      </aside>
      <div className="editor-pitch-wrap"><Pitch mode={mode} formationIndex={formIdx} players={assigned} onSwap={swap} onAssign={assign} onRemove={removeFromField} kit={activeKit} style={document.body.dataset.pitch||"classic"} label={draft.freeMode?"":formation.name} freeMode={draft.freeMode} positionOverrides={draft.freePositions?.[freeKey]||null} onMovePosition={movePosition}/><div className="pitch-hint">{draft.freeMode?"Arrastrá los círculos y soltá jugadores desde el plantel.":"Arrastrá o tocá jugadores para asignar e intercambiar posiciones."}</div></div>
      <aside className="editor-right"><div className="panel" data-pitch-dropzone="remove"><div className="panel-head">Plantel <span className="chip">{ids.filter((value)=>value!=null).length}/{size}</span></div><div className="roster-search"><input type="text" placeholder="Buscar jugador..." value={search} onChange={(event)=>setSearch(event.target.value)}/></div><div className="roster-list">{visibleRoster.map((player)=>{const onField=ids.includes(player.id);return <div key={player.id} className={`roster-item ${onField?"on-field":""}`} draggable={!onField} onDragStart={(event)=>onRosterDragStart(event,player.id)}><button type="button" className="roster-avatar-btn" onClick={()=>onPhotoClick(player.id)}>{player.photo?<img className="roster-avatar-img" src={player.photo} alt=""/>:<div className="roster-avatar" style={{background:window.colorFor(player.name)}}>{window.initials(player.name)}</div>}</button><div className="roster-info"><div className="roster-name">{player.name}</div><div className="roster-meta"><span className="pos-tag">{player.pos}</span><span className="roster-num">#{player.num}</span></div></div><div className="roster-state"><button className={`bench-btn ${substituteSet.has(player.id)?"on":""}`} onClick={()=>toggleSubstitute(player.id)}>S</button>{onField&&<button className={`captain-btn ${draft.captainId===player.id?"on":""}`} onClick={()=>setCaptain(player.id)}>C</button>}<button className="quick-assign" onClick={()=>quickAssign(player.id)}>{onField?"−":"+"}</button><button className="roster-edit" onClick={()=>setModal({type:"edit",player})}>✎</button><button className="roster-del" onClick={()=>removePlayer(player.id)}>×</button></div></div>;})}{!visibleRoster.length&&<div className="col-empty">Sin resultados</div>}</div><button className="btn sm ghost roster-add" onClick={()=>setModal({type:"add"})}>+ Agregar jugador</button></div></aside>
    </div>
    <input ref={photoInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={onPhotoChange}/>
    {modal&&<AddPlayerModal initial={modal.type==="edit"?modal.player:null} onClose={()=>setModal(null)} onSave={savePlayer}/>} 
  </div>;
}

function AddPlayerModal({onClose,onSave,initial=null}){
  const ref=window.useDialogAccessibility(true,onClose);
  const [value,setValue]=React.useState({name:initial?.name||"",num:initial?.num??"",pos:initial?.pos||"MED",secondaryPos:initial?.secondaryPos||"",preferredFoot:initial?.preferredFoot||"",photo:initial?.photo||null});
  const patch=(key,next)=>setValue((current)=>({...current,[key]:next}));
  const onFile=async(event)=>{const file=event.target.files?.[0];if(!file)return;try{patch("photo",await window.fileToDataURL(file,256));}catch(error){window.__toast?.(error.message);}};
  const submit=()=>{if(!value.name.trim())return;onSave({...value,name:value.name.trim(),num:parseInt(value.num,10)||0,active:initial?.active!==false});};
  return <div className="modal-back" onClick={onClose}><div className="modal" ref={ref} role="dialog" aria-modal="true" tabIndex="-1" onClick={(event)=>event.stopPropagation()}><div className="modal-head"><div className="modal-title">{initial?"Editar jugador":"Nuevo jugador"}</div><button className="btn sm ghost" onClick={onClose}>✕</button></div><div className="modal-body"><label className="photo-drop">{value.photo?<img src={value.photo} alt=""/>:<span>+ foto (opcional)</span>}<input type="file" accept="image/*" onChange={onFile}/></label><div className="form-grid"><label><span>Nombre</span><input value={value.name} onChange={(event)=>patch("name",event.target.value)} autoFocus/></label><label><span>Dorsal</span><input type="number" min="0" max="99" value={value.num} onChange={(event)=>patch("num",event.target.value)}/></label><label><span>Posición</span><select value={value.pos} onChange={(event)=>patch("pos",event.target.value)}>{["ARQ","DEF","MED","DEL"].map((pos)=><option key={pos} value={pos}>{pos}</option>)}</select></label><label><span>Posición secundaria</span><select value={value.secondaryPos} onChange={(event)=>patch("secondaryPos",event.target.value)}><option value="">Sin definir</option>{["ARQ","DEF","MED","DEL"].map((pos)=><option key={pos} value={pos}>{pos}</option>)}</select></label><label><span>Pierna hábil</span><select value={value.preferredFoot} onChange={(event)=>patch("preferredFoot",event.target.value)}><option value="">Sin definir</option><option value="right">Derecha</option><option value="left">Izquierda</option><option value="both">Ambas</option></select></label></div></div><div className="modal-foot"><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={submit} disabled={!value.name.trim()}>{initial?"Guardar cambios":"Agregar"}</button></div></div></div>;
}
function FormationDot({formation}){return <svg width="18" height="24" viewBox="0 0 20 30"><rect x="0" y="0" width="20" height="30" rx="2" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.15)"/>{formation.positions.map((position,index)=><circle key={index} cx={position[0]*.18+1} cy={(100-position[1])*.26+2} r="1" fill="currentColor"/>)}</svg>;}
window.mountPage("page-editor", <EditorPage/>);
