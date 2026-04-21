// Kit designer — preview + options, persistido + aplicable al equipo activo
function KitsPage() {
  const [kit, setKit] = window.useStore('currentKit', {
    design: "solid", primary: "#e11d48", secondary: "#0f172a",
    number: 10, name: "FUTBOLCLUB"
  });
  const [, setDraft] = window.useStore('editor', null);

  const design = kit.design, primary = kit.primary, secondary = kit.secondary;
  const number = kit.number ?? 10, teamName = kit.name ?? "FUTBOLCLUB";

  const setField = (k, v) => setKit(prev => ({ ...prev, [k]: v }));

  const presets = [
    { name: "Rojo clásico",   design: "solid",   primary: "#dc2626", secondary: "#ffffff" },
    { name: "Blaugrana",      design: "stripes", primary: "#1e3a8a", secondary: "#991b1b" },
    { name: "Albiceleste",    design: "stripes", primary: "#3b82f6", secondary: "#ffffff" },
    { name: "Millonario",     design: "sash",    primary: "#ffffff", secondary: "#dc2626" },
    { name: "Xeneize",        design: "sash",    primary: "#1e3a8a", secondary: "#eab308" },
    { name: "Verde-negro",    design: "halves",  primary: "#16a34a", secondary: "#0f172a" },
    { name: "Naranja mecánica", design: "solid", primary: "#ea580c", secondary: "#0f172a" },
    { name: "Crema",          design: "stripes", primary: "#fef3c7", secondary: "#78350f" },
  ];

  const colorSwatches = ["#dc2626","#ea580c","#eab308","#16a34a","#06b6d4","#3b82f6","#8b5cf6","#ec4899","#ffffff","#0f172a"];

  const applyToTeam = () => {
    setDraft(d => {
      const base = d || { mode: 7, formIdx: 0, assignedIds: [], freePositions: {}, freeMode: false, name: "Mi equipo" };
      return { ...base, kit: { design, primary, secondary } };
    });
    window.go('editor');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Editor de camisetas</div>
          <h1 className="page-title">Diseñá tu kit</h1>
          <div className="page-sub">4 diseños base, colores libres, tipografía impresa. Aplicable a cualquier equipo guardado.</div>
        </div>
        <button className="btn primary" onClick={applyToTeam}>Aplicar al equipo →</button>
      </div>

      <div className="kits-layout">
        <div className="kit-preview">
          <div className="kit-stage">
            <Kit design={design} primary={primary} secondary={secondary} number={number} name={teamName} size={280}/>
            <div className="kit-back">
              <Kit design={design} primary={primary} secondary={secondary} number={number} name={teamName} size={180}/>
              <div className="kit-back-label">Contra</div>
            </div>
          </div>
          <div className="kit-specs">
            <div><span>Diseño</span><strong>{window.KIT_DESIGNS.find(d=>d.id===design)?.label}</strong></div>
            <div><span>Principal</span><strong style={{color:primary}}>{String(primary).toUpperCase()}</strong></div>
            <div><span>Secundario</span><strong style={{color:secondary==="#ffffff"?"#fff":secondary}}>{String(secondary).toUpperCase()}</strong></div>
            <div><span>Dorsal</span><strong>{number}</strong></div>
          </div>
        </div>

        <div className="kit-controls">
          <div className="panel">
            <div className="panel-head">Diseño</div>
            <div className="kit-design-grid">
              {window.KIT_DESIGNS.map(d => (
                <button key={d.id}
                  className={`kit-design-opt ${design===d.id?'on':''}`}
                  onClick={()=>setField('design', d.id)}>
                  <Kit design={d.id} primary={primary} secondary={secondary} size={56} showNumber={false}/>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Color principal</div>
            <div className="swatches">
              {colorSwatches.map(c => (
                <button key={c}
                  className={`swatch ${primary===c?'on':''}`}
                  style={{background:c}}
                  onClick={()=>setField('primary', c)}/>
              ))}
              <label className="swatch custom" style={{background:primary}}>
                <input type="color" value={primary} onChange={e=>setField('primary', e.target.value)}/>
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Color secundario</div>
            <div className="swatches">
              {colorSwatches.map(c => (
                <button key={c}
                  className={`swatch ${secondary===c?'on':''}`}
                  style={{background:c}}
                  onClick={()=>setField('secondary', c)}/>
              ))}
              <label className="swatch custom" style={{background:secondary}}>
                <input type="color" value={secondary} onChange={e=>setField('secondary', e.target.value)}/>
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Dorsal y nombre</div>
            <div className="kit-fields">
              <label>
                <span>Número</span>
                <input type="number" value={number} onChange={e=>setField('number', parseInt(e.target.value)||0)} min="1" max="99"/>
              </label>
              <label style={{flex:1}}>
                <span>Nombre / club</span>
                <input type="text" value={teamName} onChange={e=>setField('name', e.target.value)} maxLength="14"/>
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Presets</div>
            <div className="presets-grid">
              {presets.map((p,i) => (
                <button key={i} className="preset"
                  onClick={()=>setKit(prev => ({ ...prev, design: p.design, primary: p.primary, secondary: p.secondary }))}>
                  <Kit design={p.design} primary={p.primary} secondary={p.secondary} size={52} showNumber={false}/>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const kitsCSS = document.createElement("style");
kitsCSS.textContent = `
  .kits-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 18px;
    align-items: start;
  }
  @media (max-width: 1100px) {
    .kits-layout { grid-template-columns: 1fr; }
  }
  .kit-preview {
    background:
      radial-gradient(ellipse at 50% 30%, rgba(255,255,255,.05), transparent 60%),
      linear-gradient(180deg, var(--bg-elev), var(--bg-elev-2));
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    padding: 40px 30px;
    min-height: 520px;
    position: relative;
  }
  .kit-stage {
    display: flex; justify-content: center; align-items: flex-end;
    gap: 40px;
    min-height: 360px;
  }
  .kit-back {
    display: flex; flex-direction: column; align-items: center;
    opacity: .85;
  }
  .kit-back-label {
    font-family: var(--font-mono); font-size: 10px;
    color: var(--fg-dim); text-transform: uppercase; letter-spacing: 1.4px;
    margin-top: 4px;
  }
  .kit-specs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: var(--line-soft);
    border-radius: 8px; overflow: hidden;
    margin-top: 30px;
  }
  .kit-specs > div {
    background: var(--bg-elev-2);
    padding: 10px 14px;
  }
  .kit-specs span {
    display: block;
    font-family: var(--font-cond);
    font-size: 10px; letter-spacing: 1.4px;
    text-transform: uppercase; color: var(--fg-dim);
    margin-bottom: 2px;
  }
  .kit-specs strong {
    font-family: var(--font-mono);
    font-size: 13px; font-weight: 500;
  }

  .kit-controls { display: flex; flex-direction: column; gap: 14px; }

  .kit-design-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
  }
  .kit-design-opt {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 8px 4px;
    background: var(--bg-elev-2);
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--fg-mute);
    font-size: 11px;
  }
  .kit-design-opt:hover { color: var(--fg); }
  .kit-design-opt.on { border-color: var(--accent); color: var(--fg); }

  .swatches { display: flex; flex-wrap: wrap; gap: 6px; }
  .swatch {
    width: 28px; height: 28px; border-radius: 6px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform .1s;
    position: relative;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,.2);
  }
  .swatch.on { border-color: var(--accent); transform: scale(1.1); }
  .swatch.custom { background: conic-gradient(red,orange,yellow,green,cyan,blue,magenta,red); overflow: hidden; }
  .swatch.custom input { opacity: 0; width: 100%; height: 100%; cursor: pointer; }

  .kit-fields { display: flex; gap: 10px; }
  .kit-fields label { display: flex; flex-direction: column; gap: 4px; }
  .kit-fields span {
    font-family: var(--font-cond); font-size: 10px; letter-spacing: 1.4px;
    text-transform: uppercase; color: var(--fg-dim);
  }
  .kit-fields input {
    background: var(--bg-elev-2);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 8px 10px; font-size: 14px;
    color: var(--fg); outline: none;
    width: 80px;
    font-family: var(--font-mono);
  }
  .kit-fields label[style*="flex"] input { width: 100%; font-family: var(--font-body); }
  .kit-fields input:focus { border-color: var(--accent); }

  .presets-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
  }
  .preset {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 6px 4px;
    background: var(--bg-elev-2);
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 10px; color: var(--fg-mute);
    text-align: center; line-height: 1.1;
  }
  .preset:hover { border-color: var(--accent); color: var(--fg); }
`;
document.head.appendChild(kitsCSS);

ReactDOM.createRoot(document.getElementById("page-kits")).render(<KitsPage/>);
