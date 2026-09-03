function KitsPage() {
  const [kit, setKit] = window.useStore("currentKit", {
    design: "solid",
    primary: "#e11d48",
    secondary: "#0f172a",
    number: 10,
    name: "FUTBOLCLUB"
  });
  const [altKit, setAltKit] = window.useStore("currentKitAlt", {
    design: "solid",
    primary: "#ffffff",
    secondary: "#0f172a",
    number: 10,
    name: "FUTBOLCLUB"
  });
  const [editing, setEditing] = React.useState("main");
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
  const setField = (k, v) => setActiveKit(prev => ({
    ...prev,
    [k]: v
  }));
  const presets = [{
    name: "Rojo clásico",
    design: "solid",
    primary: "#dc2626",
    secondary: "#ffffff",
    alt: {
      design: "solid",
      primary: "#0f172a",
      secondary: "#dc2626"
    }
  }, {
    name: "Blaugrana",
    design: "stripes",
    primary: "#1e3a8a",
    secondary: "#991b1b",
    alt: {
      design: "solid",
      primary: "#fbbf24",
      secondary: "#1e3a8a"
    }
  }, {
    name: "Real",
    design: "solid",
    primary: "#ffffff",
    secondary: "#1e3a8a",
    alt: {
      design: "halves",
      primary: "#0f172a",
      secondary: "#1e3a8a"
    }
  }, {
    name: "Albiceleste",
    design: "stripes",
    primary: "#3b82f6",
    secondary: "#ffffff",
    alt: {
      design: "solid",
      primary: "#0f172a",
      secondary: "#3b82f6"
    }
  }, {
    name: "Millonario",
    design: "sash",
    primary: "#ffffff",
    secondary: "#dc2626",
    alt: {
      design: "solid",
      primary: "#0f172a",
      secondary: "#ffffff"
    }
  }, {
    name: "Xeneize",
    design: "sash",
    primary: "#1e3a8a",
    secondary: "#eab308",
    alt: {
      design: "solid",
      primary: "#fef3c7",
      secondary: "#1e3a8a"
    }
  }, {
    name: "Verde-negro",
    design: "halves",
    primary: "#16a34a",
    secondary: "#0f172a",
    alt: {
      design: "solid",
      primary: "#ffffff",
      secondary: "#16a34a"
    }
  }, {
    name: "Naranja mecánica",
    design: "solid",
    primary: "#ea580c",
    secondary: "#0f172a",
    alt: {
      design: "solid",
      primary: "#0f172a",
      secondary: "#ea580c"
    }
  }, {
    name: "Crema",
    design: "stripes",
    primary: "#fef3c7",
    secondary: "#78350f",
    alt: {
      design: "solid",
      primary: "#78350f",
      secondary: "#fef3c7"
    }
  }];
  const colorSwatches = ["#dc2626", "#ea580c", "#eab308", "#16a34a", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff", "#0f172a"];
  const applyToTeam = () => {
    setDraft(d => {
      const base = d || {
        mode: 7,
        formIdx: 0,
        assignedIds: [],
        freePositions: {},
        freeMode: false,
        name: "Mi equipo"
      };
      const kitObj = {
        design,
        primary,
        secondary
      };
      return editing === "main" ? {
        ...base,
        kit: kitObj
      } : {
        ...base,
        altKit: kitObj
      };
    });
    window.go("editor");
  };
  return React.createElement("div", null, React.createElement("div", {
    className: "page-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Editor de camisetas"), React.createElement("h1", {
    className: "page-title"
  }, "Dise\xF1\xE1 tu kit"), React.createElement("div", {
    className: "page-sub"
  }, "4 dise\xF1os base, colores libres, tipograf\xEDa impresa. Cada equipo puede tener titular y alternativa.")), React.createElement("button", {
    className: "btn primary",
    onClick: applyToTeam
  }, "Aplicar como ", editing === "main" ? "titular" : "alternativa", " \u2192")), React.createElement("div", {
    className: "seg kit-mode-seg"
  }, React.createElement("button", {
    className: editing === "main" ? "on" : "",
    onClick: () => setEditing("main")
  }, "Titular"), React.createElement("button", {
    className: editing === "alt" ? "on" : "",
    onClick: () => setEditing("alt")
  }, "Alternativa")), React.createElement("div", {
    className: "kits-layout"
  }, React.createElement("div", {
    className: "kit-preview"
  }, React.createElement("div", {
    className: "kit-stage"
  }, React.createElement(Kit, {
    design: design,
    primary: primary,
    secondary: secondary,
    number: number,
    name: teamName,
    size: 280
  }), React.createElement("div", {
    className: "kit-back"
  }, React.createElement(Kit, {
    design: otherKit.design,
    primary: otherKit.primary,
    secondary: otherKit.secondary,
    number: otherKit.number ?? 10,
    name: otherKit.name,
    size: 180
  }), React.createElement("div", {
    className: "kit-back-label"
  }, otherLabel))), React.createElement("div", {
    className: "kit-specs"
  }, React.createElement("div", null, React.createElement("span", null, "Dise\xF1o"), React.createElement("strong", null, window.KIT_DESIGNS.find(d => d.id === design)?.label)), React.createElement("div", null, React.createElement("span", null, "Principal"), React.createElement("strong", {
    style: {
      color: primary
    }
  }, String(primary).toUpperCase())), React.createElement("div", null, React.createElement("span", null, "Secundario"), React.createElement("strong", {
    style: {
      color: secondary === "#ffffff" ? "#fff" : secondary
    }
  }, String(secondary).toUpperCase())), React.createElement("div", null, React.createElement("span", null, "Dorsal"), React.createElement("strong", null, number)))), React.createElement("div", {
    className: "kit-controls"
  }, React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Dise\xF1o"), React.createElement("div", {
    className: "kit-design-grid"
  }, window.KIT_DESIGNS.map(d => React.createElement("button", {
    key: d.id,
    className: `kit-design-opt ${design === d.id ? "on" : ""}`,
    onClick: () => setField("design", d.id)
  }, React.createElement(Kit, {
    design: d.id,
    primary: primary,
    secondary: secondary,
    size: 56,
    showNumber: false
  }), React.createElement("span", null, d.label))))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Color principal"), React.createElement("div", {
    className: "swatches"
  }, colorSwatches.map(c => React.createElement("button", {
    key: c,
    className: `swatch ${primary === c ? "on" : ""}`,
    style: {
      background: c
    },
    onClick: () => setField("primary", c)
  })), React.createElement("label", {
    className: "swatch custom",
    style: {
      background: primary
    }
  }, React.createElement("input", {
    type: "color",
    value: primary,
    onChange: e => setField("primary", e.target.value)
  })))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Color secundario"), React.createElement("div", {
    className: "swatches"
  }, colorSwatches.map(c => React.createElement("button", {
    key: c,
    className: `swatch ${secondary === c ? "on" : ""}`,
    style: {
      background: c
    },
    onClick: () => setField("secondary", c)
  })), React.createElement("label", {
    className: "swatch custom",
    style: {
      background: secondary
    }
  }, React.createElement("input", {
    type: "color",
    value: secondary,
    onChange: e => setField("secondary", e.target.value)
  })))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Dorsal y nombre"), React.createElement("div", {
    className: "kit-fields"
  }, React.createElement("label", null, React.createElement("span", null, "N\xFAmero"), React.createElement("input", {
    type: "number",
    value: number,
    onChange: e => setField("number", parseInt(e.target.value) || 0),
    min: "1",
    max: "99"
  })), React.createElement("label", {
    style: {
      flex: 1
    }
  }, React.createElement("span", null, "Nombre / club"), React.createElement("input", {
    type: "text",
    value: teamName,
    onChange: e => setField("name", e.target.value),
    maxLength: "14"
  })))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Presets", React.createElement("span", {
    className: "muted-note"
  }, "Titular + alternativa")), React.createElement("div", {
    className: "presets-grid"
  }, presets.map(p => React.createElement("button", {
    key: p.name,
    className: "preset",
    title: `${p.name} — aplica titular y alternativa`,
    onClick: () => {
      setKit(prev => ({
        ...prev,
        design: p.design,
        primary: p.primary,
        secondary: p.secondary
      }));
      setAltKit(prev => ({
        ...prev,
        design: p.alt.design,
        primary: p.alt.primary,
        secondary: p.alt.secondary
      }));
      window.__toast?.(`${p.name}: titular y alternativa cargadas`);
    }
  }, React.createElement("div", {
    className: "preset-pair"
  }, React.createElement(Kit, {
    design: p.design,
    primary: p.primary,
    secondary: p.secondary,
    size: 44,
    showNumber: false
  }), React.createElement(Kit, {
    design: p.alt.design,
    primary: p.alt.primary,
    secondary: p.alt.secondary,
    size: 34,
    showNumber: false
  })), React.createElement("span", null, p.name))))))));
}
window.mountPage("page-kits", React.createElement(KitsPage, null));
//# sourceURL=src/page-kits.jsx
