function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function RivalPage() {
  const [roster] = window.useStore("roster", window.DEFAULT_ROSTER);
  const [state, setState] = window.useStore("rival", {
    myMode: 11,
    myForm: 0,
    rivalForm: 1,
    myKit: {
      design: "stripes",
      primary: "#3b82f6",
      secondary: "#ffffff"
    },
    rivalKit: {
      design: "solid",
      primary: "#eab308",
      secondary: "#16a34a"
    },
    rivalRoster: [],
    rivalName: "LOS VISITANTES"
  });
  const [rivalNameInput, setRivalNameInput] = React.useState("");
  const [teamCrests] = window.useStore("teamCrests", {});
  const crestEntryFor = name => {
    const raw = teamCrests[(name || "").trim().toLowerCase()];
    if (!raw) return null;
    if (typeof raw === "string") return raw === "none" ? {
      hidden: true
    } : {
      photo: raw
    };
    return raw;
  };
  const crestFor = (name, fallbackKit) => {
    const entry = crestEntryFor(name) || {};
    if (entry.hidden) return {
      name,
      photo: "none"
    };
    return {
      name,
      design: entry.design || fallbackKit.design,
      primary: entry.primary || fallbackKit.primary,
      secondary: entry.secondary || fallbackKit.secondary,
      photo: entry.photo || undefined,
      initials: entry.initials || undefined
    };
  };
  const {
    myMode = 11,
    myForm = 0,
    rivalForm = 1,
    myKit = {
      design: "stripes",
      primary: "#3b82f6",
      secondary: "#ffffff"
    },
    rivalKit = {
      design: "solid",
      primary: "#eab308",
      secondary: "#16a34a"
    }
  } = state;
  const myTeamName = "LOS PIBES";
  const rivalTeamName = state.rivalName || "LOS VISITANTES";
  const rivalRoster = state.rivalRoster || [];
  const myPlayers = roster.slice(0, window.FORMATIONS[myMode][myForm].positions.length);
  const rivalSize = window.FORMATIONS[myMode][rivalForm].positions.length;
  const rivalPlayers = Array.from({
    length: rivalSize
  }, (_, i) => rivalRoster[i] || null);
  const addRivalPlayer = name => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState(s => ({
      ...s,
      rivalRoster: [...(s.rivalRoster || []), {
        id: `rv${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed
      }]
    }));
  };
  const generateRivalPlayers = n => {
    setState(s => {
      const base = (s.rivalRoster || []).length;
      const added = Array.from({
        length: n
      }, (_, i) => ({
        id: `rv${Date.now()}${Math.random().toString(36).slice(2, 6)}${i}`,
        name: `Rival ${base + i + 1}`
      }));
      return {
        ...s,
        rivalRoster: [...(s.rivalRoster || []), ...added]
      };
    });
  };
  const removeRivalPlayer = id => setState(s => ({
    ...s,
    rivalRoster: (s.rivalRoster || []).filter(p => p.id !== id)
  }));
  const clearRivalRoster = () => setState(s => ({
    ...s,
    rivalRoster: []
  }));
  return React.createElement("div", null, React.createElement("div", {
    className: "page-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Modo rival"), React.createElement("h1", {
    className: "page-title"
  }, "Nosotros vs. ellos"), React.createElement("div", {
    className: "page-sub"
  }, "Cancha completa, dos alineaciones encaradas, como la previa en la TV.")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement("div", {
    className: "seg"
  }, [7, 8, 11].map(m => React.createElement("button", {
    key: m,
    className: myMode === m ? "on" : "",
    onClick: () => setState(s => ({
      ...s,
      myMode: m,
      myForm: 0,
      rivalForm: Math.min(1, window.FORMATIONS[m].length - 1)
    }))
  }, "Fut ", m))), React.createElement("button", {
    className: "btn primary",
    onClick: () => window.go("share")
  }, "Compartir \u2192"))), React.createElement("div", {
    className: "rival-head-row"
  }, React.createElement("div", {
    className: "rival-side"
  }, React.createElement("div", {
    className: "rival-flag",
    style: {
      background: myKit.primary
    }
  }), React.createElement(Crest, _extends({}, crestFor(myTeamName, myKit), {
    size: 38
  })), React.createElement("div", null, React.createElement("div", {
    className: "rival-name"
  }, myTeamName), React.createElement("div", {
    className: "rival-meta"
  }, React.createElement("span", {
    className: "chip lime"
  }, "LOCAL"), React.createElement("span", {
    className: "chip"
  }, window.FORMATIONS[myMode][myForm].name)))), React.createElement("div", {
    className: "rival-vs"
  }, React.createElement("div", {
    className: "vs-word"
  }, "VS"), React.createElement("div", {
    className: "vs-time"
  }, "21:30 \xB7 Cancha 3")), React.createElement("div", {
    className: "rival-side right"
  }, React.createElement("div", null, React.createElement("input", {
    className: "rival-name-input",
    value: state.rivalName || "",
    onChange: e => setState(s => ({
      ...s,
      rivalName: e.target.value
    })),
    placeholder: "LOS VISITANTES"
  }), React.createElement("div", {
    className: "rival-meta"
  }, React.createElement("span", {
    className: "chip"
  }, "VISITANTE"), React.createElement("span", {
    className: "chip"
  }, window.FORMATIONS[myMode][rivalForm].name))), React.createElement(Crest, _extends({}, crestFor(rivalTeamName, rivalKit), {
    size: 38
  })), React.createElement("div", {
    className: "rival-flag",
    style: {
      background: rivalKit.primary
    }
  }))), React.createElement("div", {
    className: "combined-pitch"
  }, React.createElement("div", {
    className: "half-own"
  }, React.createElement(Pitch, {
    mode: myMode,
    formationIndex: myForm,
    players: myPlayers,
    kit: myKit,
    orientation: "up",
    interactive: false,
    style: document.body.dataset.pitch || "classic",
    showNames: true
  })), React.createElement("div", {
    className: "half-rival"
  }, React.createElement(Pitch, {
    mode: myMode,
    formationIndex: rivalForm,
    players: rivalPlayers,
    kit: rivalKit,
    orientation: "up",
    interactive: false,
    style: document.body.dataset.pitch || "classic",
    showNames: true
  })), React.createElement("div", {
    className: "midline-badge"
  }, "\u25CF CENTRO \u25CF")), React.createElement("div", {
    className: "rival-form-controls"
  }, React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Mi formaci\xF3n"), React.createElement("div", {
    className: "form-list"
  }, window.FORMATIONS[myMode].map((f, i) => React.createElement("button", {
    key: f.name,
    className: `form-pill ${myForm === i ? "on" : ""}`,
    onClick: () => setState(s => ({
      ...s,
      myForm: i
    }))
  }, React.createElement(FormationDot, {
    formation: f
  }), React.createElement("span", null, f.name))))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Formaci\xF3n rival"), React.createElement("div", {
    className: "form-list"
  }, window.FORMATIONS[myMode].map((f, i) => React.createElement("button", {
    key: f.name,
    className: `form-pill ${rivalForm === i ? "on" : ""}`,
    onClick: () => setState(s => ({
      ...s,
      rivalForm: i
    }))
  }, React.createElement(FormationDot, {
    formation: f
  }), React.createElement("span", null, f.name)))))), React.createElement("div", {
    className: "panel rival-roster-panel"
  }, React.createElement("div", {
    className: "panel-head-row"
  }, React.createElement("span", null, "Plantel rival \xB7 ", rivalRoster.length, "/", rivalSize), React.createElement("span", {
    className: "chip"
  }, "No se guarda en tu plantel")), React.createElement("div", {
    className: "temp-controls"
  }, React.createElement("input", {
    type: "text",
    placeholder: "Nombre y Enter\u2026",
    value: rivalNameInput,
    onChange: e => setRivalNameInput(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") {
        addRivalPlayer(rivalNameInput);
        setRivalNameInput("");
      }
    }
  }), React.createElement("button", {
    className: "btn",
    onClick: () => {
      addRivalPlayer(rivalNameInput);
      setRivalNameInput("");
    }
  }, "+ Agregar"), React.createElement("span", {
    className: "temp-divider"
  }, "o"), React.createElement("button", {
    className: "btn",
    onClick: () => generateRivalPlayers(rivalSize - rivalRoster.length > 0 ? rivalSize - rivalRoster.length : 1)
  }, "Completar equipo rival"), rivalRoster.length > 0 && React.createElement("button", {
    className: "btn ghost",
    onClick: clearRivalRoster
  }, "Vaciar")), rivalRoster.length > 0 && React.createElement("div", {
    className: "pool-chips",
    style: {
      marginTop: 10
    }
  }, rivalRoster.map(p => React.createElement("div", {
    key: p.id,
    className: "pool-chip"
  }, React.createElement("div", {
    className: "pool-chip-avatar",
    style: {
      background: window.colorFor(p.name)
    }
  }, window.initials(p.name)), React.createElement("span", null, p.name), React.createElement("button", {
    className: "temp-remove",
    onClick: () => removeRivalPlayer(p.id),
    title: "Quitar"
  }, "\xD7"))))));
}
window.mountPage("page-rival", React.createElement(RivalPage, null));
//# sourceURL=src/page-rival.jsx
