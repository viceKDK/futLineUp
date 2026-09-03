// Kit designer — preview + options, persistido + aplicable al equipo activo
function KitsPage() {
  const [kit, setKit] = window.useStore("currentKit", {
    design: "solid",
    primary: "#e11d48",
    secondary: "#0f172a",
    number: 10,
    name: "FUTBOLCLUB",
  });
  const [altKit, setAltKit] = window.useStore("currentKitAlt", {
    design: "solid",
    primary: "#ffffff",
    secondary: "#0f172a",
    number: 10,
    name: "FUTBOLCLUB",
  });
  const [editing, setEditing] = React.useState("main"); // 'main' | 'alt'
  const [, setDraft] = window.useStore("editor", null);

  const activeKit = editing === "main" ? kit : altKit;
  const setActiveKit = editing === "main" ? setKit : setAltKit;
  const otherKit = editing === "main" ? altKit : kit;
  const otherLabel = editing === "main" ? "Alternativa" : "Titular";

  const design = activeKit.design,
    primary = activeKit.primary,
    secondary = activeKit.secondary;
  const number = activeKit.number ?? 10,
    teamName = activeKit.name ?? "FUTBOLCLUB";

  const setField = (k, v) => setActiveKit((prev) => ({ ...prev, [k]: v }));

  // Cada preset trae su alternativa a juego (titular + suplente), no solo un color suelto.
  const presets = [
    {
      name: "Rojo clásico",
      design: "solid",
      primary: "#dc2626",
      secondary: "#ffffff",
      alt: { design: "solid", primary: "#0f172a", secondary: "#dc2626" },
    },
    {
      name: "Blaugrana",
      design: "stripes",
      primary: "#1e3a8a",
      secondary: "#991b1b",
      alt: { design: "solid", primary: "#fbbf24", secondary: "#1e3a8a" },
    },
    {
      name: "Real",
      design: "solid",
      primary: "#ffffff",
      secondary: "#1e3a8a",
      alt: { design: "halves", primary: "#0f172a", secondary: "#1e3a8a" },
    },
    {
      name: "Albiceleste",
      design: "stripes",
      primary: "#3b82f6",
      secondary: "#ffffff",
      alt: { design: "solid", primary: "#0f172a", secondary: "#3b82f6" },
    },
    {
      name: "Millonario",
      design: "sash",
      primary: "#ffffff",
      secondary: "#dc2626",
      alt: { design: "solid", primary: "#0f172a", secondary: "#ffffff" },
    },
    {
      name: "Xeneize",
      design: "sash",
      primary: "#1e3a8a",
      secondary: "#eab308",
      alt: { design: "solid", primary: "#fef3c7", secondary: "#1e3a8a" },
    },
    {
      name: "Verde-negro",
      design: "halves",
      primary: "#16a34a",
      secondary: "#0f172a",
      alt: { design: "solid", primary: "#ffffff", secondary: "#16a34a" },
    },
    {
      name: "Naranja mecánica",
      design: "solid",
      primary: "#ea580c",
      secondary: "#0f172a",
      alt: { design: "solid", primary: "#0f172a", secondary: "#ea580c" },
    },
    {
      name: "Crema",
      design: "stripes",
      primary: "#fef3c7",
      secondary: "#78350f",
      alt: { design: "solid", primary: "#78350f", secondary: "#fef3c7" },
    },
  ];

  const colorSwatches = [
    "#dc2626",
    "#ea580c",
    "#eab308",
    "#16a34a",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#ffffff",
    "#0f172a",
  ];

  const applyToTeam = () => {
    setDraft((d) => {
      const base = d || {
        mode: 7,
        formIdx: 0,
        assignedIds: [],
        freePositions: {},
        freeMode: false,
        name: "Mi equipo",
      };
      const kitObj = { design, primary, secondary };
      return editing === "main"
        ? { ...base, kit: kitObj }
        : { ...base, altKit: kitObj };
    });
    window.go("editor");
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Editor de camisetas</div>
          <h1 className="page-title">Diseñá tu kit</h1>
          <div className="page-sub">
            4 diseños base, colores libres, tipografía impresa. Cada equipo
            puede tener titular y alternativa.
          </div>
        </div>
        <button className="btn primary" onClick={applyToTeam}>
          Aplicar como {editing === "main" ? "titular" : "alternativa"} →
        </button>
      </div>

      <div className="seg kit-mode-seg">
        <button
          className={editing === "main" ? "on" : ""}
          onClick={() => setEditing("main")}
        >
          Titular
        </button>
        <button
          className={editing === "alt" ? "on" : ""}
          onClick={() => setEditing("alt")}
        >
          Alternativa
        </button>
      </div>

      <div className="kits-layout">
        <div className="kit-preview">
          <div className="kit-stage">
            <Kit
              design={design}
              primary={primary}
              secondary={secondary}
              number={number}
              name={teamName}
              size={280}
            />
            <div className="kit-back">
              <Kit
                design={otherKit.design}
                primary={otherKit.primary}
                secondary={otherKit.secondary}
                number={otherKit.number ?? 10}
                name={otherKit.name}
                size={180}
              />
              <div className="kit-back-label">{otherLabel}</div>
            </div>
          </div>
          <div className="kit-specs">
            <div>
              <span>Diseño</span>
              <strong>
                {window.KIT_DESIGNS.find((d) => d.id === design)?.label}
              </strong>
            </div>
            <div>
              <span>Principal</span>
              <strong style={{ color: primary }}>
                {String(primary).toUpperCase()}
              </strong>
            </div>
            <div>
              <span>Secundario</span>
              <strong
                style={{ color: secondary === "#ffffff" ? "#fff" : secondary }}
              >
                {String(secondary).toUpperCase()}
              </strong>
            </div>
            <div>
              <span>Dorsal</span>
              <strong>{number}</strong>
            </div>
          </div>
        </div>

        <div className="kit-controls">
          <div className="panel">
            <div className="panel-head">Diseño</div>
            <div className="kit-design-grid">
              {window.KIT_DESIGNS.map((d) => (
                <button
                  key={d.id}
                  className={`kit-design-opt ${design === d.id ? "on" : ""}`}
                  onClick={() => setField("design", d.id)}
                >
                  <Kit
                    design={d.id}
                    primary={primary}
                    secondary={secondary}
                    size={56}
                    showNumber={false}
                  />
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Color principal</div>
            <div className="swatches">
              {colorSwatches.map((c) => (
                <button
                  key={c}
                  className={`swatch ${primary === c ? "on" : ""}`}
                  style={{ background: c }}
                  onClick={() => setField("primary", c)}
                />
              ))}
              <label className="swatch custom" style={{ background: primary }}>
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setField("primary", e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Color secundario</div>
            <div className="swatches">
              {colorSwatches.map((c) => (
                <button
                  key={c}
                  className={`swatch ${secondary === c ? "on" : ""}`}
                  style={{ background: c }}
                  onClick={() => setField("secondary", c)}
                />
              ))}
              <label
                className="swatch custom"
                style={{ background: secondary }}
              >
                <input
                  type="color"
                  value={secondary}
                  onChange={(e) => setField("secondary", e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Dorsal y nombre</div>
            <div className="kit-fields">
              <label>
                <span>Número</span>
                <input
                  type="number"
                  value={number}
                  onChange={(e) =>
                    setField("number", parseInt(e.target.value) || 0)
                  }
                  min="1"
                  max="99"
                />
              </label>
              <label style={{ flex: 1 }}>
                <span>Nombre / club</span>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setField("name", e.target.value)}
                  maxLength="14"
                />
              </label>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              Presets<span className="muted-note">Titular + alternativa</span>
            </div>
            <div className="presets-grid">
              {presets.map((p) => (
                <button
                  key={p.name}
                  className="preset"
                  title={`${p.name} — aplica titular y alternativa`}
                  onClick={() => {
                    setKit((prev) => ({
                      ...prev,
                      design: p.design,
                      primary: p.primary,
                      secondary: p.secondary,
                    }));
                    setAltKit((prev) => ({
                      ...prev,
                      design: p.alt.design,
                      primary: p.alt.primary,
                      secondary: p.alt.secondary,
                    }));
                    window.__toast?.(
                      `${p.name}: titular y alternativa cargadas`,
                    );
                  }}
                >
                  <div className="preset-pair">
                    <Kit
                      design={p.design}
                      primary={p.primary}
                      secondary={p.secondary}
                      size={44}
                      showNumber={false}
                    />
                    <Kit
                      design={p.alt.design}
                      primary={p.alt.primary}
                      secondary={p.alt.secondary}
                      size={34}
                      showNumber={false}
                    />
                  </div>
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

window.mountPage("page-kits", <KitsPage />);
