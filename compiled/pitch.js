function Pitch(props) {
  const {
    mode = 7,
    formationIndex = 0,
    players = [],
    onSwap,
    onAssign,
    onRemove,
    kit = {
      design: "solid",
      primary: "#e11d48",
      secondary: "#0f172a"
    },
    orientation = "up",
    half = false,
    interactive = true,
    style = "classic",
    showNames = true,
    label,
    freeMode = false,
    positionOverrides = null,
    onMovePosition
  } = props;
  const formation = window.FORMATIONS[mode][formationIndex];
  const rawPositions = formation.positions;
  const positions = rawPositions.map((p, i) => freeMode && positionOverrides && positionOverrides[i] || p);
  const [selectedIdx, setSelectedIdx] = React.useState(null);
  const svgRef = React.useRef(null);
  const draggingRef = React.useRef(false);
  React.useEffect(() => {
    setSelectedIdx(null);
  }, [mode, formationIndex, freeMode]);
  const handleSlotClick = idx => {
    if (!interactive || freeMode || draggingRef.current) return;
    if (selectedIdx === null) {
      if (players[idx]) setSelectedIdx(idx);
      return;
    }
    if (selectedIdx === idx) {
      setSelectedIdx(null);
      return;
    }
    onSwap && onSwap(selectedIdx, idx);
    setSelectedIdx(null);
  };
  const pitchPalette = {
    classic: {
      a: "#2e8440",
      b: "#2a7a3b"
    },
    flat: {
      a: "#3a8f4a",
      b: "#3a8f4a"
    },
    dark: {
      a: "#163324",
      b: "#12291d"
    }
  }[style] || {
    a: "#2e8440",
    b: "#2a7a3b"
  };
  const lineColor = style === "dark" ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.85)";
  const vbW = 100,
    vbH = half ? 80 : 150;
  const stripes = [];
  const stripeCount = 10;
  for (let i = 0; i < stripeCount; i++) {
    stripes.push(React.createElement("rect", {
      key: i,
      x: "0",
      y: i * 150 / stripeCount,
      width: "100",
      height: 150 / stripeCount,
      fill: i % 2 ? pitchPalette.a : pitchPalette.b
    }));
  }
  const handleDragOver = (e, idx) => {
    if (!interactive) return;
    e.preventDefault();
    e.currentTarget.classList.add("hover");
  };
  const handleDragLeave = e => {
    e.currentTarget.classList.remove("hover");
  };
  const handleDrop = (e, idx) => {
    if (!interactive) return;
    e.preventDefault();
    e.currentTarget.classList.remove("hover");
    const fromRoster = e.dataTransfer.getData("application/x-roster");
    if (fromRoster) onAssign && onAssign(parseInt(fromRoster, 10), idx);
  };
  const startPlayerDrag = (e, idx) => {
    if (!interactive || freeMode || !players[idx]) return;
    const svg = svgRef.current;
    if (!svg) return;
    const startX = e.clientX,
      startY = e.clientY;
    const state = {
      dragging: false,
      hoverEl: null
    };
    const move = ev => {
      if (!state.dragging) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
        state.dragging = true;
        draggingRef.current = true;
        svg.classList.add("dragging-player");
        svg.querySelector(`[data-slot-idx="${idx}"]`)?.classList.add("drag-source");
      }
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const slotEl = el && el.closest("[data-slot-idx]");
      const dropEl = el && el.closest('[data-pitch-dropzone="remove"]');
      const hoverEl = slotEl && svg.contains(slotEl) && slotEl.dataset.slotIdx != String(idx) ? slotEl : dropEl;
      if (state.hoverEl && state.hoverEl !== hoverEl) state.hoverEl.classList.remove("hover");
      if (hoverEl) hoverEl.classList.add("hover");
      state.hoverEl = hoverEl;
    };
    const up = ev => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      svg.classList.remove("dragging-player");
      svg.querySelector(`[data-slot-idx="${idx}"]`)?.classList.remove("drag-source");
      if (state.hoverEl) state.hoverEl.classList.remove("hover");
      if (state.dragging) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const slotEl = el && el.closest("[data-slot-idx]");
        const dropEl = el && el.closest('[data-pitch-dropzone="remove"]');
        if (slotEl && svg.contains(slotEl)) {
          const targetIdx = parseInt(slotEl.dataset.slotIdx, 10);
          if (!isNaN(targetIdx) && targetIdx !== idx) onSwap && onSwap(idx, targetIdx);
        } else if (dropEl) {
          onRemove && onRemove(idx);
        }
        setTimeout(() => {
          draggingRef.current = false;
        }, 80);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const toScreen = (x, y) => {
    let sx = x;
    let sy;
    if (orientation === "up") sy = 150 - y / 100 * 140 - 5;else sy = y / 100 * 140 + 5;
    return [sx, sy];
  };
  const fromScreenY = svgY => {
    if (orientation === "up") return (145 - svgY) / 1.4;
    return (svgY - 5) / 1.4;
  };
  const slotPointerDown = (e, idx) => {
    if (!freeMode || !interactive || !onMovePosition) return;
    const svg = svgRef.current;
    if (!svg) return;
    e.preventDefault();
    e.stopPropagation();
    const update = ev => {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const loc = pt.matrixTransform(ctm.inverse());
      const fx = Math.max(4, Math.min(96, loc.x));
      const fy = Math.max(2, Math.min(98, fromScreenY(loc.y)));
      onMovePosition(idx, fx, fy);
    };
    const up = () => {
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", update);
    window.addEventListener("pointerup", up);
  };
  const handleSlotPointerDown = (e, idx) => {
    if (freeMode) {
      slotPointerDown(e, idx);
      return;
    }
    startPlayerDrag(e, idx);
  };
  return React.createElement("div", {
    className: `pitch-wrap ${style} ${freeMode ? "free" : ""}`,
    "data-orientation": orientation
  }, label && React.createElement("div", {
    className: "pitch-label"
  }, label), freeMode && React.createElement("div", {
    className: "pitch-free-hint"
  }, "MODO LIBRE \xB7 arrastr\xE1 los c\xEDrculos"), React.createElement("svg", {
    ref: svgRef,
    className: "pitch-svg",
    viewBox: `0 ${half ? orientation === "up" ? 70 : 0 : 0} ${vbW} ${vbH}`,
    xmlns: "http://www.w3.org/2000/svg",
    preserveAspectRatio: "xMidYMid meet"
  }, React.createElement("g", null, stripes), React.createElement("rect", {
    x: "0",
    y: "0",
    width: "100",
    height: "150",
    fill: "url(#pitchVignette)"
  }), React.createElement("defs", null, React.createElement("radialGradient", {
    id: "pitchVignette",
    cx: "50%",
    cy: "50%",
    r: "70%"
  }, React.createElement("stop", {
    offset: "60%",
    stopColor: "rgba(0,0,0,0)"
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "rgba(0,0,0,.35)"
  }))), React.createElement("g", {
    fill: "none",
    stroke: lineColor,
    strokeWidth: ".4"
  }, React.createElement("rect", {
    x: "3",
    y: "3",
    width: "94",
    height: "144"
  }), React.createElement("line", {
    x1: "3",
    y1: "75",
    x2: "97",
    y2: "75"
  }), React.createElement("circle", {
    cx: "50",
    cy: "75",
    r: "10"
  }), React.createElement("circle", {
    cx: "50",
    cy: "75",
    r: ".8",
    fill: lineColor
  }), React.createElement("rect", {
    x: "22",
    y: "3",
    width: "56",
    height: "18"
  }), React.createElement("rect", {
    x: "36",
    y: "3",
    width: "28",
    height: "7"
  }), React.createElement("circle", {
    cx: "50",
    cy: "14",
    r: ".8",
    fill: lineColor
  }), React.createElement("path", {
    d: "M 40 21 A 12 12 0 0 0 60 21"
  }), React.createElement("rect", {
    x: "22",
    y: "129",
    width: "56",
    height: "18"
  }), React.createElement("rect", {
    x: "36",
    y: "140",
    width: "28",
    height: "7"
  }), React.createElement("circle", {
    cx: "50",
    cy: "136",
    r: ".8",
    fill: lineColor
  }), React.createElement("path", {
    d: "M 40 129 A 12 12 0 0 1 60 129"
  }), React.createElement("path", {
    d: "M 3 5 A 2 2 0 0 0 5 3"
  }), React.createElement("path", {
    d: "M 97 5 A 2 2 0 0 1 95 3"
  }), React.createElement("path", {
    d: "M 3 145 A 2 2 0 0 1 5 147"
  }), React.createElement("path", {
    d: "M 97 145 A 2 2 0 0 0 95 147"
  })), positions.map((p, idx) => {
    const [sx, sy] = toScreen(p[0], p[1]);
    const player = players[idx];
    const isEmpty = !player;
    const isSelected = selectedIdx === idx;
    return React.createElement("g", {
      key: idx,
      "data-slot-idx": idx,
      transform: `translate(${sx},${sy})`,
      className: `slot ${isEmpty ? "empty" : ""} ${freeMode ? "free" : ""} ${isSelected ? "selected" : ""}`,
      onDragOver: e => handleDragOver(e, idx),
      onDragLeave: handleDragLeave,
      onDrop: e => handleDrop(e, idx),
      onPointerDown: e => handleSlotPointerDown(e, idx),
      onClick: () => handleSlotClick(idx)
    }, React.createElement(PlayerDot, {
      player: player,
      kit: kit,
      interactive: interactive,
      showName: showNames,
      onRemove: onRemove ? () => onRemove(idx) : null
    }));
  })));
}
function PlayerDot({
  player,
  kit,
  interactive,
  showName,
  onRemove
}) {
  const empty = !player;
  const display = typeof window !== "undefined" && window.document?.body?.dataset?.playerStyle || "photo";
  return React.createElement("g", {
    style: {
      cursor: interactive && !empty ? "grab" : "default"
    }
  }, React.createElement("ellipse", {
    cx: "0",
    cy: "7.6",
    rx: "5",
    ry: "1.1",
    fill: "rgba(0,0,0,.35)"
  }), empty ? React.createElement("g", null, React.createElement("circle", {
    r: "5.2",
    fill: "rgba(0,0,0,.25)",
    stroke: "rgba(255,255,255,.45)",
    strokeWidth: ".4",
    strokeDasharray: "1 1.2"
  }), React.createElement("text", {
    y: "1.5",
    textAnchor: "middle",
    fontSize: "5",
    fill: "rgba(255,255,255,.55)",
    fontFamily: "'Bebas Neue'"
  }, "+")) : display === "shirt" ? React.createElement("g", null, React.createElement("foreignObject", {
    x: "-5",
    y: "-5.5",
    width: "10",
    height: "11"
  }, React.createElement("div", {
    xmlns: "http://www.w3.org/1999/xhtml",
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, React.createElement(MiniKit, {
    kit: kit,
    num: player.num
  }))), showName && React.createElement("g", {
    transform: "translate(0,8)"
  }, React.createElement("rect", {
    x: "-7",
    y: "-1.8",
    width: "14",
    height: "3.6",
    rx: "1.2",
    fill: "rgba(0,0,0,.72)"
  }), React.createElement("text", {
    y: ".7",
    textAnchor: "middle",
    fontSize: "2.4",
    fontFamily: "'Archivo Narrow', sans-serif",
    fontWeight: "700",
    fill: "#fff"
  }, player.name.toUpperCase()))) : React.createElement("g", null, React.createElement("circle", {
    r: "5.2",
    fill: kit.primary,
    stroke: "#fff",
    strokeWidth: ".5"
  }), player.photo ? React.createElement(React.Fragment, null, React.createElement("defs", null, React.createElement("clipPath", {
    id: `ph-${player.id}`
  }, React.createElement("circle", {
    r: "4.6"
  }))), React.createElement("image", {
    href: player.photo,
    x: "-4.6",
    y: "-4.6",
    width: "9.2",
    height: "9.2",
    preserveAspectRatio: "xMidYMid slice",
    clipPath: `url(#ph-${player.id})`
  })) : React.createElement(React.Fragment, null, React.createElement("circle", {
    r: "4.6",
    fill: window.colorFor(player.name)
  }), React.createElement("text", {
    y: "1.4",
    textAnchor: "middle",
    fontSize: "3.6",
    fontWeight: "700",
    fontFamily: "'Archivo Narrow', sans-serif",
    fill: "#fff"
  }, window.initials(player.name))), React.createElement("g", {
    transform: "translate(3.6,-3.6)"
  }, React.createElement("circle", {
    r: "2.2",
    fill: "#0e1210",
    stroke: "#fff",
    strokeWidth: ".3"
  }), React.createElement("text", {
    y: "0.9",
    textAnchor: "middle",
    fontSize: "2.6",
    fontWeight: "700",
    fontFamily: "'Bebas Neue'",
    fill: "#fff"
  }, player.num)), showName && React.createElement("g", {
    transform: "translate(0,8)"
  }, React.createElement("rect", {
    x: "-7",
    y: "-1.8",
    width: "14",
    height: "3.6",
    rx: "1.2",
    fill: "rgba(0,0,0,.72)"
  }), React.createElement("text", {
    y: ".7",
    textAnchor: "middle",
    fontSize: "2.4",
    fontFamily: "'Archivo Narrow', sans-serif",
    fontWeight: "700",
    fill: "#fff"
  }, player.name.toUpperCase()))));
}
function MiniKit({
  kit,
  num
}) {
  const id = React.useId().replace(/:/g, "");
  return React.createElement("svg", {
    width: "100%",
    height: "100%",
    viewBox: "0 0 100 105"
  }, React.createElement("defs", null, React.createElement("clipPath", {
    id: `mk-${id}`
  }, React.createElement("path", {
    d: "M20,10 L35,4 C40,12 60,12 65,4 L80,10 L95,22 L82,38 L78,32 L78,95 C78,97 76,99 74,99 L26,99 C24,99 22,97 22,95 L22,32 L18,38 L5,22 Z"
  }))), React.createElement("path", {
    d: "M20,10 L35,4 C40,12 60,12 65,4 L80,10 L95,22 L82,38 L78,32 L78,95 C78,97 76,99 74,99 L26,99 C24,99 22,97 22,95 L22,32 L18,38 L5,22 Z",
    fill: kit.primary,
    stroke: "rgba(0,0,0,.35)",
    strokeWidth: "1"
  }), React.createElement("g", {
    clipPath: `url(#mk-${id})`
  }, kit.design === "stripes" && [0, 1, 2, 3, 4, 5].map(i => React.createElement("rect", {
    key: i,
    x: i * 18,
    y: "0",
    width: "9",
    height: "105",
    fill: kit.secondary
  })), kit.design === "sash" && React.createElement("polygon", {
    points: "-5,40 60,-5 105,25 25,95",
    fill: kit.secondary
  }), kit.design === "halves" && React.createElement("rect", {
    x: "50",
    y: "0",
    width: "55",
    height: "105",
    fill: kit.secondary
  })), React.createElement("text", {
    x: "50",
    y: "70",
    textAnchor: "middle",
    fontFamily: "'Bebas Neue'",
    fontSize: "40",
    fill: window.contrastTextMixed(kit.primary, kit.secondary, kit.design),
    style: {
      paintOrder: "stroke",
      stroke: window.contrastTextMixed(kit.primary, kit.secondary, kit.design) === "#ffffff" ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.65)",
      strokeWidth: 1.8
    }
  }, num));
}
window.Pitch = Pitch;
window.PlayerDot = PlayerDot;
//# sourceURL=src/pitch.jsx
