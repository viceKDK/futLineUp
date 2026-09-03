function EditorPage() {
  const [roster, setRoster] = window.useStore("roster", window.DEFAULT_ROSTER);
  const [teams, setTeams] = window.useStore("teams", window.DEFAULT_SAVED_TEAMS);
  const [draft, setDraft] = window.useStore("editor", {
    teamId: null,
    name: "Los Pibes del Viernes",
    mode: 7,
    formIdx: 0,
    freeMode: false,
    kit: {
      design: "solid",
      primary: "#e11d48",
      secondary: "#0f172a"
    },
    assignedIds: [],
    freePositions: {}
  });
  const [playerStyle, setPlayerStyleState] = React.useState(() => window.fcGetTweaks?.().playerStyle || "photo");
  React.useEffect(() => {
    const onChange = e => {
      if (e.detail.key === "playerStyle") setPlayerStyleState(e.detail.value);
    };
    window.addEventListener("fc:tweak-changed", onChange);
    return () => window.removeEventListener("fc:tweak-changed", onChange);
  }, []);
  const activeKit = draft.activeKit === "alt" && draft.altKit ? draft.altKit : draft.kit;
  const mode = draft.mode;
  const formIdx = draft.formIdx;
  const formation = window.FORMATIONS[mode][formIdx];
  const size = formation.positions.length;
  const freeKey = `${mode}:${formIdx}`;
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
  const setIds = updater => {
    setDraft(d => {
      const cur = (d.assignedIds || []).slice(0, size);
      while (cur.length < size) cur.push(null);
      const next = typeof updater === "function" ? updater(cur) : updater;
      return {
        ...d,
        assignedIds: next
      };
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
  const unassignFromField = idx => {
    setIds(ids => {
      const n = [...ids];
      n[idx] = null;
      return n;
    });
  };
  const handleMovePos = (idx, x, y) => {
    setDraft(d => {
      const map = {
        ...(d.freePositions || {})
      };
      const arr = (map[freeKey] || new Array(size).fill(null)).slice();
      while (arr.length < size) arr.push(null);
      arr[idx] = [x, y];
      map[freeKey] = arr;
      return {
        ...d,
        freePositions: map
      };
    });
  };
  const resetFreePositions = () => {
    setDraft(d => {
      const map = {
        ...(d.freePositions || {})
      };
      delete map[freeKey];
      return {
        ...d,
        freePositions: map
      };
    });
  };
  const onRosterDragStart = (e, id) => {
    e.dataTransfer.setData("application/x-roster", String(id));
    e.dataTransfer.effectAllowed = "copy";
    const player = roster.find(p => p.id === id);
    if (player) {
      const ghost = document.createElement("div");
      ghost.className = "roster-drag-ghost";
      let avatar;
      if (player.photo) {
        avatar = document.createElement("img");
        avatar.src = player.photo;
        avatar.alt = "";
      } else {
        avatar = document.createElement("div");
        avatar.className = "roster-drag-ghost-avatar";
        avatar.style.background = window.colorFor(player.name);
        avatar.textContent = window.initials(player.name);
      }
      const label = document.createElement("span");
      label.textContent = player.name;
      ghost.append(avatar, label);
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 18, 18);
      setTimeout(() => ghost.remove(), 0);
    }
  };
  const onFieldPlayer = id => (draft.assignedIds || []).includes(id);
  const toggleSubstitute = id => setDraft(d => {
    const substitutes = new Set(d.substituteIds || []);
    substitutes.has(id) ? substitutes.delete(id) : substitutes.add(id);
    return {
      ...d,
      substituteIds: [...substitutes]
    };
  });
  const setCaptain = id => setDraft(d => ({
    ...d,
    captainId: d.captainId === id ? null : id
  }));
  const quickAssign = id => {
    const ids = draft.assignedIds || [];
    const current = ids.findIndex(value => value === id);
    if (current >= 0) return setIds(next => next.map(value => value === id ? null : value));
    const empty = Array.from({
      length: size
    }, (_, index) => index).find(index => ids[index] == null);
    if (empty == null) return window.__toast?.("La cancha está completa");
    handleAssign(id, empty);
  };
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
      for (let i = 1; i < next.length; i++) {
        if (next[i] == null && pool.length) next[i] = pool.shift().id;
      }
      return next;
    });
  };
  const clearAll = () => setIds(new Array(size).fill(null));
  const saveTeam = () => {
    const id = draft.teamId || "t" + Date.now();
    const teamEntry = {
      id,
      name: draft.name || "Mi equipo",
      mode,
      formation: formation.name,
      formIdx,
      kit: draft.kit.design,
      color: draft.kit.primary,
      secondary: draft.kit.secondary,
      altKit: draft.altKit || null,
      activeKit: draft.activeKit || "main",
      lastPlayed: "ahora",
      players: (draft.assignedIds || []).filter(Boolean).length,
      assignedIds: (draft.assignedIds || []).slice(),
      freePositions: {
        ...(draft.freePositions || {})
      },
      freeMode: !!draft.freeMode,
      captainId: draft.captainId || null,
      substituteIds: (draft.substituteIds || []).slice(),
      updatedAt: new Date().toISOString()
    };
    setTeams(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx >= 0) {
        const n = [...prev];
        n[idx] = teamEntry;
        return n;
      }
      return [...prev, teamEntry];
    });
    setDraft(d => ({
      ...d,
      teamId: id
    }));
    window.go("share");
  };
  const [modal, setModal] = React.useState(null);
  const photoInputRef = React.useRef(null);
  const [photoTargetId, setPhotoTargetId] = React.useState(null);
  const onPhotoClick = id => {
    setPhotoTargetId(id);
    photoInputRef.current?.click();
  };
  const onPhotoChange = async e => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || photoTargetId == null) return;
    try {
      const dataURL = await window.fileToDataURL(file, 256);
      setRoster(prev => prev.map(p => p.id === photoTargetId ? {
        ...p,
        photo: dataURL
      } : p));
    } catch (error) {
      window.__toast?.(error.message || "No se pudo cargar la imagen");
    }
    setPhotoTargetId(null);
  };
  const addPlayer = newP => {
    setRoster(prev => [...prev, {
      ...newP,
      id: window.nextPlayerId(prev),
      active: true
    }]);
  };
  const updatePlayer = (id, changes) => {
    setRoster(prev => prev.map(p => p.id === id ? {
      ...p,
      ...changes
    } : p));
  };
  const removePlayer = id => {
    const player = roster.find(p => p.id === id);
    if (!confirm(`¿Eliminar a ${player?.name || "este jugador"} del plantel?`)) return;
    setRoster(prev => prev.filter(p => p.id !== id));
    setIds(ids => ids.map(x => x === id ? null : x));
  };
  const [search, setSearch] = React.useState("");
  const visibleRoster = roster.filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()));
  const substituteSet = React.useMemo(() => new Set(draft.substituteIds || []), [draft.substituteIds]);
  React.useEffect(() => {
    setDraft(d => {
      const cur = (d.assignedIds || []).slice();
      if (cur.length === size) return d;
      const next = new Array(size).fill(null);
      for (let i = 0; i < Math.min(cur.length, size); i++) next[i] = cur[i];
      return {
        ...d,
        assignedIds: next
      };
    });
  }, [size]);
  return React.createElement("div", null, React.createElement("div", {
    className: "page-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Editor \xB7 Fut ", mode, " \xB7 ", draft.freeMode ? "Libre" : formation.name), React.createElement("input", {
    className: "editor-title-input",
    value: draft.name,
    onChange: e => setDraft(d => ({
      ...d,
      name: e.target.value
    }))
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement("button", {
    className: "btn",
    onClick: clearAll
  }, "Limpiar"), React.createElement("button", {
    className: "btn",
    onClick: autoFill
  }, "Auto-completar"), React.createElement("button", {
    className: "btn primary",
    onClick: saveTeam
  }, "Guardar \u2192"))), React.createElement("div", {
    className: "editor-grid"
  }, React.createElement("aside", {
    className: "editor-left"
  }, React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Modo"), React.createElement("div", {
    className: "seg wide"
  }, [5, 6, 7, 8, 11].map(m => React.createElement("button", {
    key: m,
    className: mode === m ? "on" : "",
    onClick: () => setDraft(d => ({
      ...d,
      mode: m,
      formIdx: 0
    }))
  }, "Fut ", m)))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Formaci\xF3n", React.createElement("label", {
    className: "switch"
  }, React.createElement("input", {
    type: "checkbox",
    checked: draft.freeMode,
    onChange: e => setDraft(d => ({
      ...d,
      freeMode: e.target.checked
    }))
  }), React.createElement("span", null, "Libre"))), React.createElement("div", {
    className: `form-list ${draft.freeMode ? "disabled" : ""}`
  }, window.FORMATIONS[mode].map((f, i) => React.createElement("button", {
    key: f.name,
    className: `form-pill ${formIdx === i ? "on" : ""}`,
    onClick: () => setDraft(d => ({
      ...d,
      formIdx: i
    }))
  }, React.createElement(FormationDot, {
    formation: f
  }), React.createElement("span", null, f.name)))), draft.freeMode && React.createElement("div", {
    className: "free-note"
  }, "Modo libre: arrastr\xE1 los c\xEDrculos de la cancha a cualquier punto.", React.createElement("button", {
    className: "btn sm ghost",
    style: {
      marginTop: 8
    },
    onClick: resetFreePositions
  }, "Restablecer posiciones"))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Camiseta"), React.createElement("div", {
    className: "kit-alt-row"
  }, React.createElement("button", {
    className: `kit-alt-opt ${(draft.activeKit || "main") === "main" ? "on" : ""}`,
    onClick: () => setDraft(d => ({
      ...d,
      activeKit: "main"
    }))
  }, React.createElement(Kit, {
    design: draft.kit.design,
    primary: draft.kit.primary,
    secondary: draft.kit.secondary,
    number: 10,
    size: 64
  }), React.createElement("span", null, "Titular")), React.createElement("button", {
    className: `kit-alt-opt ${draft.activeKit === "alt" ? "on" : ""} ${!draft.altKit ? "empty" : ""}`,
    onClick: () => draft.altKit ? setDraft(d => ({
      ...d,
      activeKit: "alt"
    })) : window.go("kits")
  }, draft.altKit ? React.createElement(Kit, {
    design: draft.altKit.design,
    primary: draft.altKit.primary,
    secondary: draft.altKit.secondary,
    number: 10,
    size: 64
  }) : React.createElement("div", {
    className: "kit-alt-empty"
  }, React.createElement(Icon, {
    name: "plus",
    size: 16
  })), React.createElement("span", null, draft.altKit ? "Alternativa" : "Agregar alt."))), React.createElement("button", {
    className: "btn sm",
    style: {
      width: "100%",
      marginTop: 8
    },
    onClick: () => window.go("kits")
  }, "Editar camisetas \u2192"), React.createElement("div", {
    className: "kit-style-row"
  }, React.createElement("span", null, "Ver en cancha"), React.createElement("div", {
    className: "seg"
  }, React.createElement("button", {
    className: playerStyle === "photo" ? "on" : "",
    onClick: () => window.fcSetTweak("playerStyle", "photo")
  }, "Foto"), React.createElement("button", {
    className: playerStyle === "shirt" ? "on" : "",
    onClick: () => window.fcSetTweak("playerStyle", "shirt")
  }, "Camiseta"))))), React.createElement("div", {
    className: "editor-pitch-wrap"
  }, React.createElement(Pitch, {
    mode: mode,
    formationIndex: formIdx,
    players: assigned,
    onSwap: handleSwap,
    onAssign: handleAssign,
    onRemove: unassignFromField,
    kit: activeKit,
    style: document.body.dataset.pitch || "classic",
    label: draft.freeMode ? "" : formation.name,
    freeMode: draft.freeMode,
    positionOverrides: overridesForSlot,
    onMovePosition: handleMovePos
  }), React.createElement("div", {
    className: "pitch-hint"
  }, draft.freeMode ? "Arrastrá los círculos. Sumá jugadores soltándolos desde el plantel." : "Arrastrá jugadores desde la lista (o de vuelta para sacarlos), o tocá dos posiciones para intercambiarlas")), React.createElement("aside", {
    className: "editor-right"
  }, React.createElement("div", {
    className: "panel",
    "data-pitch-dropzone": "remove"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Plantel", React.createElement("span", {
    className: "chip"
  }, (draft.assignedIds || []).filter(Boolean).length, "/", size)), React.createElement("div", {
    className: "roster-search"
  }, React.createElement("input", {
    type: "text",
    placeholder: "Buscar jugador...",
    value: search,
    onChange: e => setSearch(e.target.value)
  })), React.createElement("div", {
    className: "roster-list"
  }, visibleRoster.map(p => {
    const onField = onFieldPlayer(p.id);
    return React.createElement("div", {
      key: p.id,
      className: `roster-item ${onField ? "on-field" : ""}`,
      draggable: !onField,
      onDragStart: e => onRosterDragStart(e, p.id)
    }, React.createElement("button", {
      type: "button",
      className: "roster-avatar-btn",
      onClick: () => onPhotoClick(p.id),
      title: "Cambiar foto"
    }, p.photo ? React.createElement("img", {
      className: "roster-avatar-img",
      src: p.photo,
      alt: ""
    }) : React.createElement("div", {
      className: "roster-avatar",
      style: {
        background: window.colorFor(p.name)
      }
    }, window.initials(p.name)), React.createElement("span", {
      className: "roster-avatar-cam"
    }, React.createElement(Icon, {
      name: "camera",
      size: 12
    }))), React.createElement("div", {
      className: "roster-info"
    }, React.createElement("div", {
      className: "roster-name"
    }, p.name), React.createElement("div", {
      className: "roster-meta"
    }, React.createElement("span", {
      className: "pos-tag"
    }, p.pos), React.createElement("span", {
      className: "roster-num"
    }, "#", p.num))), React.createElement("div", {
      className: "roster-state"
    }, React.createElement("button", {
      className: `bench-btn ${substituteSet.has(p.id) ? "on" : ""}`,
      onClick: () => toggleSubstitute(p.id),
      title: "Suplente",
      "aria-label": `Alternar suplencia de ${p.name}`
    }, "S"), onField && React.createElement("button", {
      className: `captain-btn ${draft.captainId === p.id ? "on" : ""}`,
      onClick: () => setCaptain(p.id),
      title: "Capit\xE1n",
      "aria-label": `Alternar capitanía de ${p.name}`
    }, "C"), React.createElement("button", {
      className: "quick-assign",
      onClick: () => quickAssign(p.id),
      title: onField ? "Sacar de la cancha" : "Agregar a la primera posición libre",
      "aria-label": onField ? `Sacar a ${p.name} de la cancha` : `Agregar a ${p.name} a la cancha`
    }, onField ? "−" : "+"), React.createElement("button", {
      className: "roster-edit",
      onClick: () => setModal({
        type: "edit",
        player: p
      }),
      title: "Editar jugador",
      "aria-label": `Editar a ${p.name}`
    }, "\u270E"), React.createElement("button", {
      className: "roster-del",
      onClick: () => removePlayer(p.id),
      title: "Eliminar del plantel",
      "aria-label": `Eliminar a ${p.name}`
    }, "\xD7")));
  }), visibleRoster.length === 0 && React.createElement("div", {
    className: "col-empty"
  }, "Sin resultados")), React.createElement("button", {
    className: "btn sm ghost roster-add",
    onClick: () => setModal({
      type: "add"
    })
  }, "+ Agregar jugador")))), React.createElement("input", {
    ref: photoInputRef,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: onPhotoChange
  }), (modal?.type === "add" || modal?.type === "edit") && React.createElement(AddPlayerModal, {
    initial: modal.type === "edit" ? modal.player : null,
    onClose: () => setModal(null),
    onAdd: p => {
      if (modal.type === "edit") updatePlayer(modal.player.id, p);else addPlayer(p);
      setModal(null);
      window.__toast?.(modal.type === "edit" ? "Jugador actualizado" : "Jugador agregado");
    }
  }));
}
function AddPlayerModal({
  onClose,
  onAdd,
  initial = null
}) {
  const dialogRef = window.useDialogAccessibility(true, onClose);
  const [name, setName] = React.useState(initial?.name || "");
  const [num, setNum] = React.useState(initial?.num ?? "");
  const [pos, setPos] = React.useState(initial?.pos || "MED");
  const [secondaryPos, setSecondaryPos] = React.useState(initial?.secondaryPos || "");
  const [preferredFoot, setPreferredFoot] = React.useState(initial?.preferredFoot || "");
  const [photo, setPhoto] = React.useState(initial?.photo || null);
  const onFile = async e => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const dataURL = await window.fileToDataURL(f, 256);
      setPhoto(dataURL);
    } catch (error) {
      window.__toast?.(error.message || "No se pudo cargar la imagen");
    }
  };
  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      num: parseInt(num, 10) || 0,
      pos,
      photo,
      secondaryPos,
      preferredFoot,
      active: initial?.active !== false
    });
  };
  return React.createElement("div", {
    className: "modal-back",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal",
    ref: dialogRef,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": initial ? "Editar jugador" : "Nuevo jugador",
    tabIndex: "-1",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "modal-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, initial ? "Editar jugador" : "Nuevo jugador"), React.createElement("div", {
    className: "modal-title"
  }, initial ? "Actualizá su ficha" : "Sumalo al plantel")), React.createElement("button", {
    className: "btn sm ghost",
    onClick: onClose,
    "aria-label": "Cerrar"
  }, "\u2715")), React.createElement("div", {
    className: "modal-body"
  }, React.createElement("label", {
    className: "photo-drop"
  }, photo ? React.createElement("img", {
    src: photo,
    alt: ""
  }) : React.createElement("span", null, "+ foto (opcional)"), React.createElement("input", {
    type: "file",
    accept: "image/*",
    onChange: onFile
  })), React.createElement("div", {
    className: "form-grid"
  }, React.createElement("label", null, React.createElement("span", null, "Nombre"), React.createElement("input", {
    type: "text",
    maxLength: "80",
    value: name,
    onChange: e => setName(e.target.value),
    autoFocus: true,
    placeholder: "Nombre"
  })), React.createElement("label", null, React.createElement("span", null, "Dorsal"), React.createElement("input", {
    type: "number",
    value: num,
    min: "0",
    max: "99",
    onChange: e => setNum(e.target.value),
    placeholder: "10"
  })), React.createElement("label", null, React.createElement("span", null, "Posici\xF3n"), React.createElement("select", {
    value: pos,
    onChange: e => setPos(e.target.value)
  }, React.createElement("option", {
    value: "ARQ"
  }, "Arquero"), React.createElement("option", {
    value: "DEF"
  }, "Defensor"), React.createElement("option", {
    value: "MED"
  }, "Mediocampista"), React.createElement("option", {
    value: "DEL"
  }, "Delantero"))), React.createElement("label", null, React.createElement("span", null, "Posici\xF3n secundaria"), React.createElement("select", {
    value: secondaryPos,
    onChange: e => setSecondaryPos(e.target.value)
  }, React.createElement("option", {
    value: ""
  }, "Sin definir"), React.createElement("option", {
    value: "ARQ"
  }, "Arquero"), React.createElement("option", {
    value: "DEF"
  }, "Defensor"), React.createElement("option", {
    value: "MED"
  }, "Mediocampista"), React.createElement("option", {
    value: "DEL"
  }, "Delantero"))), React.createElement("label", null, React.createElement("span", null, "Pierna h\xE1bil"), React.createElement("select", {
    value: preferredFoot,
    onChange: e => setPreferredFoot(e.target.value)
  }, React.createElement("option", {
    value: ""
  }, "Sin definir"), React.createElement("option", {
    value: "right"
  }, "Derecha"), React.createElement("option", {
    value: "left"
  }, "Izquierda"), React.createElement("option", {
    value: "both"
  }, "Ambas"))))), React.createElement("div", {
    className: "modal-foot"
  }, React.createElement("button", {
    className: "btn ghost",
    onClick: onClose
  }, "Cancelar"), React.createElement("button", {
    className: "btn primary",
    onClick: submit,
    disabled: !name.trim()
  }, initial ? "Guardar cambios" : "Agregar"))));
}
function FormationDot({
  formation
}) {
  return React.createElement("svg", {
    width: "18",
    height: "24",
    viewBox: "0 0 20 30"
  }, React.createElement("rect", {
    x: "0",
    y: "0",
    width: "20",
    height: "30",
    rx: "2",
    fill: "rgba(255,255,255,.06)",
    stroke: "rgba(255,255,255,.15)"
  }), formation.positions.map((p, i) => React.createElement("circle", {
    key: i,
    cx: p[0] * 0.18 + 1,
    cy: (100 - p[1]) * 0.26 + 2,
    r: "1",
    fill: "currentColor"
  })));
}
window.mountPage("page-editor", React.createElement(EditorPage, null));
//# sourceURL=src/page-editor.jsx
