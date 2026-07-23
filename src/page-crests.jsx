// Escudos — página propia (como Camisetas), independiente de Liga amateur.
// Los escudos se guardan por nombre de equipo (window.useStore('teamCrests', {}))
// porque en Liga los rivales suelen ser texto libre sin equipo guardado.
const normalizeCrestName = (s) => (s || '').trim().toLowerCase();

function EscudosPage() {
  const [teamCrests, setTeamCrests] = window.useStore('teamCrests', {});
  const [savedTeams] = window.useStore('teams', window.DEFAULT_SAVED_TEAMS);
  const [customNames, setCustomNames] = window.useStore('customCrestNames', []);
  const [newName, setNewName] = React.useState('');
  const [editingName, setEditingName] = React.useState(null);

  const allNames = [...new Set([...savedTeams.map(t=>t.name), ...customNames])].sort();
  const teamColorFor = (name) => savedTeams.find(t=>t.name===name) || null;

  const crestEntryFor = (name) => {
    const raw = teamCrests[normalizeCrestName(name)];
    if (!raw) return null;
    if (typeof raw === 'string') return raw === 'none' ? { hidden: true } : { photo: raw };
    return raw;
  };
  const crestFor = (name) => {
    const t = teamColorFor(name);
    const entry = crestEntryFor(name) || {};
    if (entry.hidden) return { name, photo: 'none' };
    return {
      name,
      design: entry.design || t?.kit || 'solid',
      primary: entry.primary || t?.color || window.colorFor(name||'?'),
      secondary: entry.secondary || t?.secondary || '#0f172a',
      photo: entry.photo || undefined,
      initials: entry.initials || undefined,
    };
  };

  const saveCrestEntry = (name, entry) => setTeamCrests(prev => ({ ...prev, [normalizeCrestName(name)]: entry }));
  const resetCrestEntry = (name) => setTeamCrests(prev => { const n = {...prev}; delete n[normalizeCrestName(name)]; return n; });

  const addCustomName = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (allNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) return window.__toast?.('Ese equipo ya está en la lista');
    setCustomNames(prev => [...prev, trimmed]);
    setNewName('');
  };
  const removeCustomName = (name) => {
    setCustomNames(prev => prev.filter(n => n !== name));
    resetCrestEntry(name);
  };
  const isCustom = (name) => !savedTeams.some(t=>t.name===name);

  if (editingName) {
    return (
      <CrestEditorScreen
        name={editingName}
        entry={crestEntryFor(editingName)}
        onSave={(entry)=>{ saveCrestEntry(editingName, entry); setEditingName(null); }}
        onReset={()=>{ resetCrestEntry(editingName); setEditingName(null); }}
        onBack={()=>setEditingName(null)}
      />
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Escudos</div>
          <h1 className="page-title">Escudo de cada equipo</h1>
          <div className="page-sub">Opcional — se usan en Liga amateur, Copa y Modo rival. Sin nada elegido se genera uno simple con colores e iniciales.</div>
        </div>
        <div/>
      </div>

      <div className="card crest-add-card">
        <div className="panel-head">Agregar un rival</div>
        <div className="crest-add-row">
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nombre del equipo o rival"
                 onKeyDown={e=>e.key==='Enter'&&addCustomName()}/>
          <button className="btn primary" onClick={addCustomName}><Icon name="plus" size={14}/> Agregar</button>
        </div>
        <p className="muted">Tus equipos guardados ya aparecen abajo. Agregá acá rivales que todavía no cargaste en ningún partido, para prepararles el escudo con anticipación.</p>
      </div>

      <div className="card">
        <div className="panel-head-row"><span>Equipos · {allNames.length}</span></div>
        {allNames.length ? <div className="crest-manager-grid">
          {allNames.map(name => (
            <div key={name} className="crest-manager-row-wrap">
              <button className="crest-manager-row" onClick={()=>setEditingName(name)}>
                <Crest {...crestFor(name)} size={44}/>
                <span className="crest-manager-name">{name}</span>
                <span className="crest-manager-edit">Editar →</span>
              </button>
              {isCustom(name) && <button className="crest-manager-remove" onClick={()=>removeCustomName(name)} title="Quitar de la lista">×</button>}
            </div>
          ))}
        </div> : <div className="empty-state">Todavía no hay equipos. Guardá uno en "Mis equipos" o agregá un rival arriba.</div>}
      </div>
    </div>
  );
}

function CrestEditorScreen({ name, entry, onSave, onReset, onBack }) {
  const base = entry && !entry.hidden ? entry : {};
  const [design, setDesign] = React.useState(base.design || 'solid');
  const [primary, setPrimary] = React.useState(base.primary || window.colorFor(name||'?'));
  const [secondary, setSecondary] = React.useState(base.secondary || '#0f172a');
  const [photo, setPhoto] = React.useState(base.photo || null);
  const [hidden, setHidden] = React.useState(!!entry?.hidden);
  const [initials, setInitials] = React.useState(base.initials || '');
  const fileRef = React.useRef(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { setPhoto(await window.fileToDataURL(file, 160)); setHidden(false); }
    catch (_) { window.__toast?.('No se pudo cargar la imagen'); }
  };

  const save = () => onSave(hidden ? { hidden: true } : { design, primary, secondary, photo: photo || undefined, initials: initials.trim() || undefined });

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="crumbs">
            <button className="crumb-btn" onClick={onBack}>Escudos</button>
            <Icon name="chevronR" size={13}/>
            <span className="crumb-current">{name}</span>
          </div>
          <h1 className="page-title">{name}</h1>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn ghost" onClick={onReset}>Restablecer</button>
          <button className="btn primary" onClick={save}>Guardar →</button>
        </div>
      </div>

      <div className="kits-layout">
        <div className="kit-preview">
          <div className="crest-preview-stage">
            <Crest name={name} design={design} primary={primary} secondary={secondary} photo={hidden ? 'none' : photo} initials={initials} size={220}/>
            <label className="toggle-row crest-hidden-toggle">
              <input type="checkbox" checked={hidden} onChange={e=>setHidden(e.target.checked)}/> <span>Sin escudo (no mostrar nada)</span>
            </label>
          </div>
          <div className="panel-head">Presets</div>
          <div className="crest-preset-grid">
            {window.CREST_PRESETS.map(p => (
              <button key={p.name} className="crest-preset-opt" onClick={()=>{ setDesign(p.design); setPrimary(p.primary); setSecondary(p.secondary); setPhoto(null); setHidden(false); }}>
                <Crest name={name} design={p.design} primary={p.primary} secondary={p.secondary} size={36}/>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="kit-controls">
          <div className="panel">
            <div className="panel-head">Letras</div>
            <label className="field" style={{marginBottom:0}}>
              <span>Iniciales del escudo (vacío = automático)</span>
              <input type="text" maxLength={4} value={initials}
                     onChange={e=>setInitials(e.target.value.toUpperCase())}
                     placeholder={window.initials(name || '?')}
                     disabled={!!photo}/>
            </label>
          </div>

          <div className="panel">
            <div className="panel-head">Diseño</div>
            <div className="kit-design-grid">
              {window.KIT_DESIGNS.map(d => (
                <button key={d.id} className={`kit-design-opt ${design===d.id && !photo ?'on':''}`}
                        onClick={()=>{ setDesign(d.id); setPhoto(null); setHidden(false); }}>
                  <Crest name={name} design={d.id} primary={primary} secondary={secondary} initials={initials} size={48}/>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Color principal</div>
            <div className="swatches">
              {window.KIT_COLOR_SWATCHES.map(c => <button key={c} className={`swatch ${primary===c?'on':''}`} style={{background:c}} onClick={()=>{setPrimary(c);setPhoto(null);setHidden(false);}}/>)}
              <label className="swatch custom" style={{background:primary}}><input type="color" value={primary} onChange={e=>{setPrimary(e.target.value);setPhoto(null);setHidden(false);}}/></label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Color secundario</div>
            <div className="swatches">
              {window.KIT_COLOR_SWATCHES.map(c => <button key={c} className={`swatch ${secondary===c?'on':''}`} style={{background:c}} onClick={()=>{setSecondary(c);setPhoto(null);setHidden(false);}}/>)}
              <label className="swatch custom" style={{background:secondary}}><input type="color" value={secondary} onChange={e=>{setSecondary(e.target.value);setPhoto(null);setHidden(false);}}/></label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Foto propia</div>
            <div className="crest-photo-row">
              <button className="btn sm" onClick={()=>fileRef.current?.click()}>{photo ? 'Cambiar foto' : 'Subir foto'}</button>
              {photo && <button className="btn sm ghost" onClick={()=>setPhoto(null)}>Quitar foto</button>}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const crestsPageCSS = document.createElement("style");
crestsPageCSS.textContent = `
  .crest-add-card { margin-bottom: 16px; }
  .crest-add-row { display: flex; gap: 8px; margin-bottom: 10px; }
  .crest-add-row input {
    flex: 1; background: var(--bg-elev-2); border: 1px solid var(--line);
    border-radius: 6px; padding: 9px 12px; font-size: 13px; color: var(--fg); outline: none;
  }
  .crest-manager-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
  .crest-manager-row-wrap { position: relative; }
  .crest-manager-row {
    display: flex; align-items: center; gap: 12px; padding: 10px;
    width: 100%; text-align: left; border-radius: 8px;
    background: var(--bg-elev-2); border: 1px solid var(--line-soft);
    transition: border-color .15s;
  }
  .crest-manager-row:hover { border-color: var(--accent); }
  .crest-manager-name { flex: 1; font-size: 13px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .crest-manager-edit { font-size: 11px; color: var(--fg-dim); flex: none; }
  .crest-manager-row:hover .crest-manager-edit { color: var(--accent); }
  .crest-manager-remove {
    position: absolute; top: -6px; right: -6px;
    width: 20px; height: 20px; border-radius: 50%;
    background: var(--bg-elev); border: 1px solid var(--line);
    color: var(--fg-dim); font-size: 13px; line-height: 1;
    display: grid; place-items: center;
  }
  .crest-manager-remove:hover { color: var(--accent-2); border-color: var(--accent-2); }
  .crest-preview-stage { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; min-height: 300px; }
  .crest-hidden-toggle { font-size: 12px; color: var(--fg-mute); }
  .kit-preview .panel-head { margin-top: 20px; }
  .crest-preset-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 6px; }
  .crest-preset-opt {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 6px 4px; background: var(--bg-elev-2); border: 1px solid transparent;
    border-radius: 6px; font-size: 10px; color: var(--fg-mute); text-align: center; line-height: 1.1;
  }
  .crest-preset-opt:hover { border-color: var(--accent); color: var(--fg); }
  .crest-photo-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
`;
document.head.appendChild(crestsPageCSS);

ReactDOM.createRoot(document.getElementById("page-crests")).render(<EscudosPage />);
