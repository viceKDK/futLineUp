// Editor de alineación con drag & drop + persistencia + subida de fotos + modo libre
function EditorPage() {
  const [roster, setRoster] = window.useStore('roster', window.DEFAULT_ROSTER);
  const [teams, setTeams]   = window.useStore('teams',  window.DEFAULT_SAVED_TEAMS);
  const [draft, setDraft]   = window.useStore('editor', {
    teamId: null,
    name: "Los Pibes del Viernes",
    mode: 7,
    formIdx: 0,
    freeMode: false,
    kit: { design: "solid", primary: "#e11d48", secondary: "#0f172a" },
    assignedIds: [],       // array of player ids (length = size)
    freePositions: {},     // { "mode:formIdx": [[x,y], ...] }
  });

  const mode = draft.mode;
  const formIdx = draft.formIdx;
  const formation = window.FORMATIONS[mode][formIdx];
  const size = formation.positions.length;
  const freeKey = `${mode}:${formIdx}`;

  // Resolve assigned players from ids
  const assigned = React.useMemo(() => {
    const arr = new Array(size).fill(null);
    const ids = draft.assignedIds || [];
    for (let i = 0; i < size; i++) {
      const id = ids[i];
      if (id != null) arr[i] = roster.find(p => p.id === id) || null;
    }
    return arr;
  }, [size, draft.assignedIds, roster]);

  const overridesForSlot = draft.freePositions?.[freeKey] || null;

  // Helpers
  const setIds = (updater) => {
    setDraft(d => {
      const cur = (d.assignedIds || []).slice(0, size);
      while (cur.length < size) cur.push(null);
      const next = typeof updater === 'function' ? updater(cur) : updater;
      return { ...d, assignedIds: next };
    });
  };

  const handleSwap = (a, b) => {
    setIds(ids => {
      const n = [...ids];
      [n[a], n[b]] = [n[b], n[a]];
      return n;
    });
  };
  const handleAssign = (playerId, idx) => {
    setIds(ids => {
      const n = [...ids];
      const existing = n.findIndex(x => x === playerId);
      if (existing >= 0) n[existing] = null;
      n[idx] = playerId;
      return n;
    });
  };
  const handleMovePos = (idx, x, y) => {
    setDraft(d => {
      const map = { ...(d.freePositions || {}) };
      const arr = (map[freeKey] || new Array(size).fill(null)).slice();
      while (arr.length < size) arr.push(null);
      arr[idx] = [x, y];
      map[freeKey] = arr;
      return { ...d, freePositions: map };
    });
  };
  const resetFreePositions = () => {
    setDraft(d => {
      const map = { ...(d.freePositions || {}) };
      delete map[freeKey];
      return { ...d, freePositions: map };
    });
  };

  const onRosterDragStart = (e, id) => {
    e.dataTransfer.setData("application/x-roster", String(id));
    e.dataTransfer.effectAllowed = "copy";
  };

  const onFieldPlayer = (id) => (draft.assignedIds || []).includes(id);

  const autoFill = () => {
    setIds(ids => {
      const next = [...ids];
      const taken = new Set(next.filter(x => x != null));
      const pool = roster.filter(p => !taken.has(p.id));
      const arq = pool.find(p => p.pos === "ARQ");
      if (next[0] == null && arq) {
        next[0] = arq.id;
        pool.splice(pool.indexOf(arq), 1);
      }
      for (let i=1; i<next.length; i++) {
        if (next[i] == null && pool.length) next[i] = pool.shift().id;
      }
      return next;
    });
  };
  const clearAll = () => setIds(new Array(size).fill(null));

  // --- Save team ---
  const saveTeam = () => {
    const id = draft.teamId || ('t' + Date.now());
    const teamEntry = {
      id,
      name: draft.name || "Mi equipo",
      mode,
      formation: formation.name,
      formIdx,
      kit: draft.kit.design,
      color: draft.kit.primary,
      secondary: draft.kit.secondary,
      lastPlayed: "ahora",
      players: (draft.assignedIds || []).filter(Boolean).length,
    };
    setTeams(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx >= 0) { const n = [...prev]; n[idx] = teamEntry; return n; }
      return [...prev, teamEntry];
    });
    setDraft(d => ({ ...d, teamId: id }));
    window.go('share');
  };

  // --- Photo / roster management ---
  const [modal, setModal] = React.useState(null); // null | {type:'add'} | {type:'edit', id}
  const photoInputRef = React.useRef(null);
  const [photoTargetId, setPhotoTargetId] = React.useState(null);

  const onPhotoClick = (id) => {
    setPhotoTargetId(id);
    photoInputRef.current?.click();
  };
  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || photoTargetId == null) return;
    try {
      const dataURL = await window.fileToDataURL(file, 256);
      setRoster(prev => prev.map(p => p.id === photoTargetId ? { ...p, photo: dataURL } : p));
    } catch (_) {}
    setPhotoTargetId(null);
  };

  const addPlayer = (newP) => {
    setRoster(prev => [...prev, { ...newP, id: window.nextPlayerId(prev) }]);
  };
  const removePlayer = (id) => {
    setRoster(prev => prev.filter(p => p.id !== id));
    setIds(ids => ids.map(x => x === id ? null : x));
  };

  // --- Search filter ---
  const [search, setSearch] = React.useState('');
  const visibleRoster = roster.filter(p =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase())
  );

  // keep assignedIds length in sync when mode/formation changes
  React.useEffect(() => {
    setDraft(d => {
      const cur = (d.assignedIds || []).slice();
      if (cur.length === size) return d;
      const next = new Array(size).fill(null);
      for (let i=0; i<Math.min(cur.length, size); i++) next[i] = cur[i];
      return { ...d, assignedIds: next };
    });
  }, [size]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Editor · Fut {mode} · {draft.freeMode ? 'Libre' : formation.name}</div>
          <input className="editor-title-input" value={draft.name}
                 onChange={e=>setDraft(d=>({...d, name: e.target.value}))}/>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn" onClick={clearAll}>Limpiar</button>
          <button className="btn" onClick={autoFill}>Auto-completar</button>
          <button className="btn primary" onClick={saveTeam}>Guardar →</button>
        </div>
      </div>

      <div className="editor-grid">
        <aside className="editor-left">
          <div className="panel">
            <div className="panel-head">Modo</div>
            <div className="seg wide">
              {[5,6,7,8,11].map(m => (
                <button key={m} className={mode===m?"on":""}
                        onClick={()=>setDraft(d=>({...d, mode: m, formIdx: 0}))}>Fut {m}</button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              Formación
              <label className="switch">
                <input type="checkbox" checked={draft.freeMode}
                       onChange={e=>setDraft(d=>({...d, freeMode: e.target.checked}))}/>
                <span>Libre</span>
              </label>
            </div>
            <div className={`form-list ${draft.freeMode?'disabled':''}`}>
              {window.FORMATIONS[mode].map((f, i) => (
                <button key={f.name}
                        className={`form-pill ${formIdx===i?'on':''}`}
                        onClick={()=>setDraft(d=>({...d, formIdx: i}))}>
                  <FormationDot formation={f}/>
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
            {draft.freeMode && (
              <div className="free-note">
                Modo libre: arrastrá los círculos de la cancha a cualquier punto.
                <button className="btn sm ghost" style={{marginTop:8}} onClick={resetFreePositions}>
                  Restablecer posiciones
                </button>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">Camiseta</div>
            <div className="kit-mini-row">
              <Kit design={draft.kit.design} primary={draft.kit.primary} secondary={draft.kit.secondary} number={10} size={80}/>
              <button className="btn sm" onClick={()=>window.go('kits')}>Editar →</button>
            </div>
          </div>
        </aside>

        <div className="editor-pitch-wrap">
          <Pitch
            mode={mode}
            formationIndex={formIdx}
            players={assigned}
            onSwap={handleSwap}
            onAssign={handleAssign}
            kit={draft.kit}
            style={document.body.dataset.pitch || "classic"}
            label={draft.freeMode ? '' : formation.name}
            freeMode={draft.freeMode}
            positionOverrides={overridesForSlot}
            onMovePosition={handleMovePos}
          />
          <div className="pitch-hint">
            {draft.freeMode
              ? 'Arrastrá los círculos. Sumá jugadores soltándolos desde el plantel.'
              : 'Arrastrá jugadores desde la lista o entre posiciones'}
          </div>
        </div>

        <aside className="editor-right">
          <div className="panel">
            <div className="panel-head">
              Plantel
              <span className="chip">{(draft.assignedIds || []).filter(Boolean).length}/{size}</span>
            </div>
            <div className="roster-search">
              <input type="text" placeholder="Buscar jugador..." value={search}
                     onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="roster-list">
              {visibleRoster.map(p => {
                const onField = onFieldPlayer(p.id);
                return (
                  <div key={p.id}
                       className={`roster-item ${onField?'on-field':''}`}
                       draggable={!onField}
                       onDragStart={(e)=>onRosterDragStart(e, p.id)}>
                    <button type="button" className="roster-avatar-btn"
                            onClick={()=>onPhotoClick(p.id)}
                            title="Cambiar foto">
                      {p.photo ? (
                        <img className="roster-avatar-img" src={p.photo} alt=""/>
                      ) : (
                        <div className="roster-avatar" style={{background: window.colorFor(p.name)}}>
                          {window.initials(p.name)}
                        </div>
                      )}
                      <span className="roster-avatar-cam">📷</span>
                    </button>
                    <div className="roster-info">
                      <div className="roster-name">{p.name}</div>
                      <div className="roster-meta">
                        <span className="pos-tag">{p.pos}</span>
                        <span className="roster-num">#{p.num}</span>
                      </div>
                    </div>
                    <div className="roster-state">
                      {onField ? <span className="dot on"></span> : <span className="drag-hint">⋮⋮</span>}
                      <button className="roster-del" onClick={()=>removePlayer(p.id)} title="Eliminar del plantel">×</button>
                    </div>
                  </div>
                );
              })}
              {visibleRoster.length === 0 && (
                <div className="col-empty">Sin resultados</div>
              )}
            </div>
            <button className="btn sm ghost roster-add" onClick={()=>setModal({type:'add'})}>
              + Agregar jugador
            </button>
          </div>
        </aside>
      </div>

      <input ref={photoInputRef} type="file" accept="image/*"
             style={{display:'none'}} onChange={onPhotoChange}/>

      {modal?.type === 'add' && (
        <AddPlayerModal
          onClose={()=>setModal(null)}
          onAdd={(p) => { addPlayer(p); setModal(null); }}
        />
      )}
    </div>
  );
}

function AddPlayerModal({ onClose, onAdd }) {
  const [name, setName] = React.useState('');
  const [num, setNum]   = React.useState('');
  const [pos, setPos]   = React.useState('MED');
  const [photo, setPhoto] = React.useState(null);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const dataURL = await window.fileToDataURL(f, 256);
      setPhoto(dataURL);
    } catch (_) {}
  };

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      num: parseInt(num, 10) || 0,
      pos,
      photo
    });
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="page-kicker">Nuevo jugador</div>
            <div className="modal-title">Sumalo al plantel</div>
          </div>
          <button className="btn sm ghost" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="photo-drop">
            {photo ? <img src={photo} alt=""/> : <span>+ foto (opcional)</span>}
            <input type="file" accept="image/*" onChange={onFile}/>
          </label>
          <div className="form-grid">
            <label>
              <span>Nombre</span>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} autoFocus placeholder="Nombre"/>
            </label>
            <label>
              <span>Dorsal</span>
              <input type="number" value={num} min="0" max="99" onChange={e=>setNum(e.target.value)} placeholder="10"/>
            </label>
            <label>
              <span>Posición</span>
              <select value={pos} onChange={e=>setPos(e.target.value)}>
                <option value="ARQ">Arquero</option>
                <option value="DEF">Defensor</option>
                <option value="MED">Mediocampista</option>
                <option value="DEL">Delantero</option>
              </select>
            </label>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={!name.trim()}>Agregar</button>
        </div>
      </div>
    </div>
  );
}

function FormationDot({ formation }) {
  return (
    <svg width="18" height="24" viewBox="0 0 20 30">
      <rect x="0" y="0" width="20" height="30" rx="2" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.15)"/>
      {formation.positions.map((p,i) => (
        <circle key={i} cx={p[0]*0.18+1} cy={(100-p[1])*0.26+2} r="1" fill="currentColor"/>
      ))}
    </svg>
  );
}

const editorCSS = document.createElement("style");
editorCSS.textContent = `
  .editor-title-input {
    font-family: var(--font-display);
    font-size: clamp(32px, 4vw, 52px);
    letter-spacing: 1px;
    line-height: .95;
    background: transparent;
    border: 0;
    padding: 0;
    color: var(--fg);
    outline: none;
    width: 100%;
    max-width: 620px;
  }
  .editor-title-input:focus {
    border-bottom: 1px solid var(--accent);
  }

  .editor-grid {
    display: grid;
    grid-template-columns: 260px 1fr 280px;
    gap: 18px;
    align-items: start;
  }
  @media (max-width: 1200px) {
    .editor-grid { grid-template-columns: 1fr; }
  }
  .editor-left, .editor-right {
    display: flex; flex-direction: column; gap: 14px;
    position: sticky; top: 20px;
  }
  .panel {
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    padding: 14px;
  }
  .panel-head {
    display: flex; justify-content: space-between; align-items: center;
    font-family: var(--font-cond);
    text-transform: uppercase; letter-spacing: 1.4px;
    font-size: 11px; color: var(--fg-dim);
    margin-bottom: 10px;
  }
  .seg.wide { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 0;
    border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
  .seg.wide button {
    padding: 8px 0; font-size: 12px; color: var(--fg-mute); background: transparent;
    border-right: 1px solid var(--line-soft);
  }
  .seg.wide button:last-child { border-right: 0; }
  .seg.wide button.on { background: var(--accent); color: #0e1210; font-weight: 700; }

  .switch { display: flex; align-items: center; gap: 6px; cursor: pointer; text-transform: none; letter-spacing: 0; font-size: 12px; color: var(--fg-mute); }
  .switch input { accent-color: var(--accent); }

  .form-list { display: flex; flex-direction: column; gap: 4px; }
  .form-list.disabled { opacity: .4; pointer-events: none; }
  .form-pill {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--fg-mute);
    text-align: left; font-size: 13px;
    transition: all .15s;
  }
  .form-pill:hover { background: var(--bg-elev-2); color: var(--fg); }
  .form-pill.on { background: var(--bg-elev-2); border-color: var(--accent); color: var(--fg); }
  .form-pill svg { color: var(--fg-mute); }
  .form-pill.on svg { color: var(--accent); }

  .free-note {
    margin-top: 10px; padding: 8px;
    background: var(--bg-elev-2); border-radius: 6px;
    color: var(--fg-mute); font-size: 12px;
  }

  .kit-mini-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }

  .editor-pitch-wrap { position: relative; }
  .editor-pitch-wrap .pitch-wrap { max-height: 82vh; aspect-ratio: 100/150; }
  .pitch-hint {
    text-align: center; margin-top: 10px;
    font-family: var(--font-mono); font-size: 11px; color: var(--fg-dim);
  }

  .roster-search { margin-bottom: 10px; }
  .roster-search input {
    width: 100%; padding: 8px 10px;
    background: var(--bg-elev-2);
    border: 1px solid var(--line);
    border-radius: 6px;
    color: var(--fg); font-size: 13px; outline: none;
  }
  .roster-search input:focus { border-color: var(--accent); }

  .roster-list { display: flex; flex-direction: column; gap: 2px; max-height: 56vh; overflow-y: auto; }
  .roster-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 6px;
    border-radius: 6px;
    cursor: grab;
    transition: background .15s, opacity .15s;
  }
  .roster-item:hover { background: var(--bg-elev-2); }
  .roster-item:active { cursor: grabbing; }
  .roster-item.on-field { opacity: .45; cursor: not-allowed; }

  .roster-avatar-btn {
    position: relative;
    width: 32px; height: 32px;
    padding: 0; border: 0; border-radius: 50%;
    background: transparent; flex-shrink: 0;
    cursor: pointer;
  }
  .roster-avatar-btn:hover .roster-avatar-cam { opacity: 1; }
  .roster-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: grid; place-items: center;
    color: #fff; font-family: var(--font-cond); font-weight: 700; font-size: 12px;
  }
  .roster-avatar-img {
    width: 32px; height: 32px; border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--line);
  }
  .roster-avatar-cam {
    position: absolute; inset: 0;
    display: grid; place-items: center;
    background: rgba(14,18,16,.65);
    border-radius: 50%;
    font-size: 14px;
    opacity: 0; transition: opacity .15s;
  }

  .roster-info { flex: 1; min-width: 0; }
  .roster-name { font-size: 13px; font-weight: 500; }
  .roster-meta { display: flex; gap: 8px; font-size: 11px; color: var(--fg-dim); }
  .pos-tag {
    font-family: var(--font-mono); font-size: 10px;
    padding: 0 4px; border: 1px solid var(--line); border-radius: 3px;
    letter-spacing: .5px;
  }
  .roster-num { font-family: var(--font-mono); }
  .roster-state { display: flex; align-items: center; gap: 6px; }
  .drag-hint { color: var(--fg-dim); font-family: var(--font-mono); font-size: 14px; }
  .roster-del {
    width: 20px; height: 20px; border-radius: 4px;
    background: transparent; color: var(--fg-dim); font-size: 14px; line-height: 1;
  }
  .roster-del:hover { background: var(--accent-2); color: #fff; }
  .dot.on { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); display: inline-block; }
  .roster-add { width: 100%; margin-top: 8px; border: 1px dashed var(--line); color: var(--fg-mute); }

  .col-empty {
    padding: 12px; text-align: center;
    color: var(--fg-dim); font-family: var(--font-mono); font-size: 11px;
  }

  /* Modal */
  .modal-back {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,.6);
    display: grid; place-items: center;
    padding: 20px;
    animation: fadein .15s ease;
  }
  .modal {
    width: min(100%, 460px);
    background: var(--bg-elev);
    border: 1px solid var(--line);
    border-radius: var(--radius-l);
    overflow: hidden;
    box-shadow: var(--shadow);
  }
  .modal-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 18px 20px 6px;
  }
  .modal-title {
    font-family: var(--font-display);
    font-size: 26px; letter-spacing: 1px; line-height: 1;
  }
  .modal-body { padding: 14px 20px; display: flex; flex-direction: column; gap: 14px; }
  .modal-foot {
    padding: 12px 20px 16px;
    display: flex; justify-content: flex-end; gap: 8px;
    border-top: 1px solid var(--line-soft);
  }
  .photo-drop {
    position: relative;
    display: grid; place-items: center;
    height: 120px;
    background: var(--bg-elev-2);
    border: 1px dashed var(--line);
    border-radius: var(--radius);
    color: var(--fg-dim);
    font-family: var(--font-mono); font-size: 12px;
    cursor: pointer;
    overflow: hidden;
  }
  .photo-drop:hover { border-color: var(--accent); color: var(--accent); }
  .photo-drop img { width: 100%; height: 100%; object-fit: cover; }
  .photo-drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

  .form-grid { display: grid; grid-template-columns: 1fr 90px 140px; gap: 10px; }
  @media (max-width: 500px) { .form-grid { grid-template-columns: 1fr; } }
  .form-grid label { display: flex; flex-direction: column; gap: 4px; }
  .form-grid span {
    font-family: var(--font-cond); font-size: 10px; letter-spacing: 1.4px;
    text-transform: uppercase; color: var(--fg-dim);
  }
  .form-grid input, .form-grid select {
    background: var(--bg-elev-2);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 8px 10px; font-size: 13px;
    color: var(--fg); outline: none;
  }
  .form-grid input:focus, .form-grid select:focus { border-color: var(--accent); }
`;
document.head.appendChild(editorCSS);

ReactDOM.createRoot(document.getElementById("page-editor")).render(<EditorPage/>);
