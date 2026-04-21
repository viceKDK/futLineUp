// Selector de modo
function ModePage() {
  const [selected, setSelected] = React.useState(7);
  const [name, setName] = React.useState('');
  const [, setDraft] = window.useStore('editor', null);
  const modes = [
    { n: 5,  label: "Fut 5",  sub: "Papi / fútbol sala",        per: "5 vs 5",   size: "15×25m" },
    { n: 6,  label: "Fut 6",  sub: "Cancha chica",              per: "6 vs 6",   size: "20×30m" },
    { n: 7,  label: "Fut 7",  sub: "El clásico entre semana",   per: "7 vs 7",   size: "30×50m" },
    { n: 8,  label: "Fut 8",  sub: "Cancha mediana",            per: "8 vs 8",   size: "40×60m" },
    { n: 11, label: "Fut 11", sub: "Cancha grande / oficial",   per: "11 vs 11", size: "68×105m" },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Paso 1 de 3 · Modo</div>
          <h1 className="page-title">¿Cuántos por lado?</h1>
          <div className="page-sub">Elegí el modo de cancha. Después vas a poder cambiar la formación y los jugadores.</div>
        </div>
        <button className="btn" onClick={()=>window.go('home')}>← Volver</button>
      </div>

      <div className="mode-grid">
        {modes.map(m => (
          <button key={m.n}
                  className={`mode-card ${selected === m.n ? 'selected' : ''}`}
                  onClick={()=>setSelected(m.n)}>
            <div className="mode-num">
              <span className="mode-num-big">{m.n}</span>
              <span className="mode-num-v">v</span>
              <span className="mode-num-big">{m.n}</span>
            </div>
            <div className="mode-label">{m.label}</div>
            <div className="mode-sub">{m.sub}</div>
            <div className="mode-meta">
              <span>{m.per}</span>
              <span className="dot">·</span>
              <span>{m.size}</span>
            </div>
            <div className="mode-check">{selected === m.n ? "✓" : ""}</div>
          </button>
        ))}
      </div>

      <div className="mode-foot">
        <div>
          <div className="page-kicker">Paso 2 · Nombre</div>
          <input className="mode-input" type="text" placeholder="Los Pibes del Viernes"
                 value={name} onChange={e=>setName(e.target.value)}/>
        </div>
        <button className="btn primary lg" onClick={()=>{
          setDraft({
            teamId: null,
            name: name.trim() || "Mi equipo",
            mode: selected,
            formIdx: 0,
            freeMode: false,
            kit: { design: "solid", primary: "#e11d48", secondary: "#0f172a" },
            assignedIds: [],
            freePositions: {},
          });
          window.go('editor');
        }}>
          Siguiente · Armar alineación →
        </button>
      </div>
    </div>
  );
}

const modeCSS = document.createElement("style");
modeCSS.textContent = `
  .mode-grid {
    display: grid; gap: 14px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    margin-bottom: 40px;
  }
  .mode-card {
    position: relative;
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    padding: 22px 18px;
    text-align: left;
    color: var(--fg);
    transition: border-color .15s, background .15s, transform .15s;
  }
  .mode-card:hover { border-color: var(--accent); }
  .mode-card.selected {
    border-color: var(--accent);
    background: linear-gradient(160deg, color-mix(in oklch, var(--accent) 12%, var(--bg-elev)), var(--bg-elev));
  }
  .mode-num {
    display: flex; align-items: baseline; gap: 4px;
    font-family: var(--font-display);
    line-height: 1;
    margin-bottom: 18px;
    color: var(--accent);
  }
  .mode-num-big { font-size: 64px; letter-spacing: 1px; }
  .mode-num-v   { font-size: 20px; color: var(--fg-dim); }
  .mode-label {
    font-family: var(--font-cond);
    font-weight: 700; font-size: 18px;
    text-transform: uppercase; letter-spacing: 1px;
  }
  .mode-sub { color: var(--fg-mute); font-size: 13px; margin-bottom: 8px; }
  .mode-meta {
    font-family: var(--font-mono);
    font-size: 11px; color: var(--fg-dim);
    display: flex; gap: 6px; align-items: center;
  }
  .mode-meta .dot { opacity: .4; }
  .mode-check {
    position: absolute; top: 14px; right: 14px;
    width: 22px; height: 22px;
    border-radius: 50%;
    display: grid; place-items: center;
    background: var(--accent); color: #0e1210; font-weight: 700;
    opacity: 0; transition: opacity .15s;
  }
  .mode-card.selected .mode-check { opacity: 1; }

  .mode-foot {
    display: flex; justify-content: space-between; align-items: flex-end;
    gap: 20px;
    padding: 20px 24px;
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
  }
  .mode-input {
    background: transparent;
    border: 0; border-bottom: 1px solid var(--line);
    padding: 8px 2px;
    min-width: 320px;
    font-family: var(--font-display);
    font-size: 30px; letter-spacing: 1px;
    outline: none;
    color: var(--fg);
  }
  .mode-input:focus { border-color: var(--accent); }
  .mode-input::placeholder { color: var(--fg-dim); }
  .btn.lg { padding: 14px 24px; font-size: 15px; }
`;
document.head.appendChild(modeCSS);

ReactDOM.createRoot(document.getElementById("page-mode")).render(<ModePage/>);
