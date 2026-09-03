// Selector de modo
function ModePage() {
  const [selected, setSelected] = React.useState(7);
  const [name, setName] = React.useState("");
  const [, setDraft] = window.useStore("editor", null);
  const modes = [
    {
      n: 5,
      label: "Fut 5",
      sub: "Papi / fútbol sala",
      per: "5 vs 5",
      size: "15×25m",
    },
    {
      n: 6,
      label: "Fut 6",
      sub: "Cancha chica",
      per: "6 vs 6",
      size: "20×30m",
    },
    {
      n: 7,
      label: "Fut 7",
      sub: "El clásico entre semana",
      per: "7 vs 7",
      size: "30×50m",
    },
    {
      n: 8,
      label: "Fut 8",
      sub: "Cancha mediana",
      per: "8 vs 8",
      size: "40×60m",
    },
    {
      n: 11,
      label: "Fut 11",
      sub: "Cancha grande / oficial",
      per: "11 vs 11",
      size: "68×105m",
    },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Paso 1 de 3 · Modo</div>
          <h1 className="page-title">¿Cuántos por lado?</h1>
          <div className="page-sub">
            Elegí el modo de cancha. Después vas a poder cambiar la formación y
            los jugadores.
          </div>
        </div>
        <button className="btn" onClick={() => window.go("home")}>
          ← Volver
        </button>
      </div>

      <div className="mode-grid">
        {modes.map((m) => (
          <button
            key={m.n}
            className={`mode-card ${selected === m.n ? "selected" : ""}`}
            onClick={() => setSelected(m.n)}
          >
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
          <input
            className="mode-input"
            type="text"
            placeholder="Los Pibes del Viernes"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button
          className="btn primary lg"
          onClick={() => {
            setDraft({
              teamId: null,
              name: name.trim() || "Mi equipo",
              mode: selected,
              formIdx: 0,
              freeMode: false,
              kit: {
                design: "solid",
                primary: "#e11d48",
                secondary: "#0f172a",
              },
              assignedIds: [],
              freePositions: {},
            });
            window.go("editor");
          }}
        >
          Siguiente · Armar alineación →
        </button>
      </div>
    </div>
  );
}

window.mountPage("page-mode", <ModePage />);
