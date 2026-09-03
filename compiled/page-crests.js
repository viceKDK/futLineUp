function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const normalizeCrestName = s => (s || "").trim().toLowerCase();
function EscudosPage() {
  const [teamCrests, setTeamCrests] = window.useStore("teamCrests", {});
  const [savedTeams] = window.useStore("teams", window.DEFAULT_SAVED_TEAMS);
  const [customNames, setCustomNames] = window.useStore("customCrestNames", []);
  const [newName, setNewName] = React.useState("");
  const [editingName, setEditingName] = React.useState(null);
  const allNames = [...new Set([...savedTeams.map(t => t.name), ...customNames])].sort();
  const teamColorFor = name => savedTeams.find(t => t.name === name) || null;
  const crestEntryFor = name => {
    const raw = teamCrests[normalizeCrestName(name)];
    if (!raw) return null;
    if (typeof raw === "string") return raw === "none" ? {
      hidden: true
    } : {
      photo: raw
    };
    return raw;
  };
  const crestFor = name => {
    const t = teamColorFor(name);
    const entry = crestEntryFor(name) || {};
    if (entry.hidden) return {
      name,
      photo: "none"
    };
    return {
      name,
      design: entry.design || t?.kit || "solid",
      primary: entry.primary || t?.color || window.colorFor(name || "?"),
      secondary: entry.secondary || t?.secondary || "#0f172a",
      photo: entry.photo || undefined,
      initials: entry.initials || undefined
    };
  };
  const saveCrestEntry = (name, entry) => setTeamCrests(prev => ({
    ...prev,
    [normalizeCrestName(name)]: entry
  }));
  const resetCrestEntry = name => setTeamCrests(prev => {
    const n = {
      ...prev
    };
    delete n[normalizeCrestName(name)];
    return n;
  });
  const addCustomName = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (allNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) return window.__toast?.("Ese equipo ya está en la lista");
    setCustomNames(prev => [...prev, trimmed]);
    setNewName("");
  };
  const removeCustomName = name => {
    setCustomNames(prev => prev.filter(n => n !== name));
    resetCrestEntry(name);
  };
  const isCustom = name => !savedTeams.some(t => t.name === name);
  if (editingName) {
    return React.createElement(CrestEditorScreen, {
      name: editingName,
      entry: crestEntryFor(editingName),
      onSave: entry => {
        saveCrestEntry(editingName, entry);
        setEditingName(null);
      },
      onReset: () => {
        resetCrestEntry(editingName);
        setEditingName(null);
      },
      onBack: () => setEditingName(null)
    });
  }
  return React.createElement("div", null, React.createElement("div", {
    className: "page-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Escudos"), React.createElement("h1", {
    className: "page-title"
  }, "Escudo de cada equipo"), React.createElement("div", {
    className: "page-sub"
  }, "Opcional \u2014 se usan en Liga amateur, Copa y Modo rival. Sin nada elegido se genera uno simple con colores e iniciales.")), React.createElement("div", null)), React.createElement("div", {
    className: "card crest-add-card"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Agregar un rival"), React.createElement("div", {
    className: "crest-add-row"
  }, React.createElement("input", {
    value: newName,
    onChange: e => setNewName(e.target.value),
    placeholder: "Nombre del equipo o rival",
    onKeyDown: e => e.key === "Enter" && addCustomName()
  }), React.createElement("button", {
    className: "btn primary",
    onClick: addCustomName
  }, React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " Agregar")), React.createElement("p", {
    className: "muted"
  }, "Tus equipos guardados ya aparecen abajo. Agreg\xE1 ac\xE1 rivales que todav\xEDa no cargaste en ning\xFAn partido, para prepararles el escudo con anticipaci\xF3n.")), React.createElement("div", {
    className: "card"
  }, React.createElement("div", {
    className: "panel-head-row"
  }, React.createElement("span", null, "Equipos \xB7 ", allNames.length)), allNames.length ? React.createElement("div", {
    className: "crest-manager-grid"
  }, allNames.map(name => React.createElement("div", {
    key: name,
    className: "crest-manager-row-wrap"
  }, React.createElement("button", {
    className: "crest-manager-row",
    onClick: () => setEditingName(name)
  }, React.createElement(Crest, _extends({}, crestFor(name), {
    size: 44
  })), React.createElement("span", {
    className: "crest-manager-name"
  }, name), React.createElement("span", {
    className: "crest-manager-edit"
  }, "Editar \u2192")), isCustom(name) && React.createElement("button", {
    className: "crest-manager-remove",
    onClick: () => removeCustomName(name),
    title: "Quitar de la lista"
  }, "\xD7")))) : React.createElement("div", {
    className: "empty-state"
  }, "Todav\xEDa no hay equipos. Guard\xE1 uno en \"Mis equipos\" o agreg\xE1 un rival arriba.")));
}
function CrestEditorScreen({
  name,
  entry,
  onSave,
  onReset,
  onBack
}) {
  const base = entry && !entry.hidden ? entry : {};
  const [design, setDesign] = React.useState(base.design || "solid");
  const [primary, setPrimary] = React.useState(base.primary || window.colorFor(name || "?"));
  const [secondary, setSecondary] = React.useState(base.secondary || "#0f172a");
  const [photo, setPhoto] = React.useState(base.photo || null);
  const [hidden, setHidden] = React.useState(!!entry?.hidden);
  const [initials, setInitials] = React.useState(base.initials || "");
  const fileRef = React.useRef(null);
  const onFile = async e => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setPhoto(await window.fileToDataURL(file, 160));
      setHidden(false);
    } catch (_) {
      window.__toast?.("No se pudo cargar la imagen");
    }
  };
  const save = () => onSave(hidden ? {
    hidden: true
  } : {
    design,
    primary,
    secondary,
    photo: photo || undefined,
    initials: initials.trim() || undefined
  });
  return React.createElement("div", null, React.createElement("div", {
    className: "page-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "crumbs"
  }, React.createElement("button", {
    className: "crumb-btn",
    onClick: onBack
  }, "Escudos"), React.createElement(Icon, {
    name: "chevronR",
    size: 13
  }), React.createElement("span", {
    className: "crumb-current"
  }, name)), React.createElement("h1", {
    className: "page-title"
  }, name)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement("button", {
    className: "btn ghost",
    onClick: onReset
  }, "Restablecer"), React.createElement("button", {
    className: "btn primary",
    onClick: save
  }, "Guardar \u2192"))), React.createElement("div", {
    className: "kits-layout"
  }, React.createElement("div", {
    className: "kit-preview"
  }, React.createElement("div", {
    className: "crest-preview-stage"
  }, React.createElement(Crest, {
    name: name,
    design: design,
    primary: primary,
    secondary: secondary,
    photo: hidden ? "none" : photo,
    initials: initials,
    size: 220
  }), React.createElement("label", {
    className: "toggle-row crest-hidden-toggle"
  }, React.createElement("input", {
    type: "checkbox",
    checked: hidden,
    onChange: e => setHidden(e.target.checked)
  }), " ", React.createElement("span", null, "Sin escudo (no mostrar nada)"))), React.createElement("div", {
    className: "panel-head"
  }, "Presets"), React.createElement("div", {
    className: "crest-preset-grid"
  }, window.CREST_PRESETS.map(p => React.createElement("button", {
    key: p.name,
    className: "crest-preset-opt",
    onClick: () => {
      setDesign(p.design);
      setPrimary(p.primary);
      setSecondary(p.secondary);
      setPhoto(null);
      setHidden(false);
    }
  }, React.createElement(Crest, {
    name: name,
    design: p.design,
    primary: p.primary,
    secondary: p.secondary,
    size: 36
  }), React.createElement("span", null, p.name))))), React.createElement("div", {
    className: "kit-controls"
  }, React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Letras"), React.createElement("label", {
    className: "field",
    style: {
      marginBottom: 0
    }
  }, React.createElement("span", null, "Iniciales del escudo (vac\xEDo = autom\xE1tico)"), React.createElement("input", {
    type: "text",
    maxLength: 4,
    value: initials,
    onChange: e => setInitials(e.target.value.toUpperCase()),
    placeholder: window.initials(name || "?"),
    disabled: !!photo
  }))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Dise\xF1o"), React.createElement("div", {
    className: "kit-design-grid"
  }, window.KIT_DESIGNS.map(d => React.createElement("button", {
    key: d.id,
    className: `kit-design-opt ${design === d.id && !photo ? "on" : ""}`,
    onClick: () => {
      setDesign(d.id);
      setPhoto(null);
      setHidden(false);
    }
  }, React.createElement(Crest, {
    name: name,
    design: d.id,
    primary: primary,
    secondary: secondary,
    initials: initials,
    size: 48
  }), React.createElement("span", null, d.label))))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Color principal"), React.createElement("div", {
    className: "swatches"
  }, window.KIT_COLOR_SWATCHES.map(c => React.createElement("button", {
    key: c,
    className: `swatch ${primary === c ? "on" : ""}`,
    style: {
      background: c
    },
    onClick: () => {
      setPrimary(c);
      setPhoto(null);
      setHidden(false);
    }
  })), React.createElement("label", {
    className: "swatch custom",
    style: {
      background: primary
    }
  }, React.createElement("input", {
    type: "color",
    value: primary,
    onChange: e => {
      setPrimary(e.target.value);
      setPhoto(null);
      setHidden(false);
    }
  })))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Color secundario"), React.createElement("div", {
    className: "swatches"
  }, window.KIT_COLOR_SWATCHES.map(c => React.createElement("button", {
    key: c,
    className: `swatch ${secondary === c ? "on" : ""}`,
    style: {
      background: c
    },
    onClick: () => {
      setSecondary(c);
      setPhoto(null);
      setHidden(false);
    }
  })), React.createElement("label", {
    className: "swatch custom",
    style: {
      background: secondary
    }
  }, React.createElement("input", {
    type: "color",
    value: secondary,
    onChange: e => {
      setSecondary(e.target.value);
      setPhoto(null);
      setHidden(false);
    }
  })))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Foto propia"), React.createElement("div", {
    className: "crest-photo-row"
  }, React.createElement("button", {
    className: "btn sm",
    onClick: () => fileRef.current?.click()
  }, photo ? "Cambiar foto" : "Subir foto"), photo && React.createElement("button", {
    className: "btn sm ghost",
    onClick: () => setPhoto(null)
  }, "Quitar foto"), React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    hidden: true,
    onChange: onFile
  }))))));
}
window.mountPage("page-crests", React.createElement(EscudosPage, null));
//# sourceURL=src/page-crests.jsx
