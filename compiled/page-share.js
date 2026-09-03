function SharePage() {
  const [styleTab, setStyleTab] = React.useState("card");
  const [playerStyle, setPlayerStyleState] = React.useState(() => window.fcGetTweaks?.().playerStyle || "photo");
  React.useEffect(() => {
    const onChange = e => {
      if (e.detail.key === "playerStyle") setPlayerStyleState(e.detail.value);
    };
    window.addEventListener("fc:tweak-changed", onChange);
    return () => window.removeEventListener("fc:tweak-changed", onChange);
  }, []);
  const sharedSnapshot = React.useMemo(() => {
    const raw = location.hash.startsWith("#share=") ? location.hash.slice(7) : null;
    if (!raw) return null;
    try {
      return window.decodeLineupSnapshot(raw);
    } catch (_) {
      window.__toast?.("El enlace compartido no es válido");
      return null;
    }
  }, []);
  const [storedRoster] = window.useStore("roster", window.DEFAULT_ROSTER);
  const [storedDraft] = window.useStore("editor", {
    name: "Los Pibes del Viernes",
    mode: 7,
    formIdx: 0,
    kit: {
      design: "stripes",
      primary: "#3b82f6",
      secondary: "#ffffff"
    },
    assignedIds: [],
    freePositions: {}
  });
  const roster = sharedSnapshot?.roster || storedRoster;
  const draft = sharedSnapshot?.draft || storedDraft;
  const [currentKit] = window.useStore("currentKit", null);
  const defaultDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
    return d.toISOString().slice(0, 10);
  })();
  const [storedMatch, setMatch] = window.useStore("matchInfo", {
    date: defaultDate,
    time: "21:30",
    venue: "Canchita Palermo",
    opponent: "Rival",
    myScore: null,
    theirScore: null
  });
  const match = sharedSnapshot?.match || storedMatch;
  const [include, setInclude] = window.useStore("shareInclude", {
    names: true,
    kit: true,
    venue: true,
    stats: false,
    watermark: true
  });
  const tog = k => setInclude(i => ({
    ...i,
    [k]: !i[k]
  }));
  const [shareKitMode, setShareKitMode] = React.useState(draft.activeKit === "alt" ? "alt" : "main");
  const mode = draft.mode || 7;
  const formIdx = draft.formIdx || 0;
  const formation = window.FORMATIONS[mode][formIdx];
  const size = formation.positions.length;
  const kit = shareKitMode === "alt" && draft.altKit ? draft.altKit : draft.kit || currentKit || {
    design: "stripes",
    primary: "#3b82f6",
    secondary: "#ffffff"
  };
  const freeKey = `${mode}:${formIdx}`;
  const overrides = draft.freePositions?.[freeKey] || null;
  const ids = draft.assignedIds || [];
  const players = [];
  for (let i = 0; i < size; i++) {
    const id = ids[i];
    const p = id != null ? roster.find(x => x.id === id) : null;
    players.push(p || null);
  }
  const captain = players.find(Boolean)?.name || "—";
  const slug = (draft.name || "equipo").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const sharedPlayerIds = new Set([...(draft.assignedIds || []), ...(draft.substituteIds || [])]);
  const sharePayload = {
    draft: {
      name: String(draft.name || "").slice(0, 80),
      mode,
      formIdx,
      kit: draft.kit,
      altKit: draft.altKit,
      activeKit: draft.activeKit,
      assignedIds: (draft.assignedIds || []).slice(0, 11),
      substituteIds: (draft.substituteIds || []).slice(0, 100),
      captainId: draft.captainId ?? null,
      freeMode: !!draft.freeMode,
      freePositions: draft.freePositions || {}
    },
    roster: roster.filter(player => sharedPlayerIds.has(player.id)).slice(0, 100).map(player => ({
      id: player.id,
      name: String(player.name || "").slice(0, 80),
      num: Number(player.num) || 0,
      pos: player.pos,
      photo: player.photo || null,
      secondaryPos: player.secondaryPos,
      preferredFoot: player.preferredFoot,
      active: player.active !== false
    })),
    match: {
      date: String(match.date || "").slice(0, 20),
      time: String(match.time || "").slice(0, 10),
      venue: String(match.venue || "").slice(0, 120),
      opponent: String(match.opponent || "").slice(0, 80),
      myScore: match.myScore ?? null,
      theirScore: match.theirScore ?? null
    }
  };
  let shareWasCompressed = false;
  let encodedSnapshot;
  try {
    encodedSnapshot = window.encodeLineupSnapshot(sharePayload);
  } catch (_) {
    shareWasCompressed = true;
    encodedSnapshot = window.encodeLineupSnapshot({
      ...sharePayload,
      roster: sharePayload.roster.map(player => ({
        ...player,
        photo: null
      }))
    });
  }
  const shareURL = `${location.origin}${location.pathname}#share=${encodedSnapshot}`;
  const shareText = `Alineación ${draft.name} (${formation.name}) · ${match.date} ${match.time} · ${match.venue}`;
  const cardRef = React.useRef(null);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareURL);
      window.__toast?.("Link copiado");
    } catch (_) {
      window.__toast?.("No pude copiar");
    }
  };
  const waitForLib = key => new Promise(res => {
    if (window[key]) return res(window[key]);
    let tries = 0;
    const iv = setInterval(() => {
      if (window[key] || tries++ > 30) {
        clearInterval(iv);
        res(window[key]);
      }
    }, 100);
  });
  const captureCanvas = async () => {
    const h2c = await waitForLib("html2canvas");
    if (!h2c || !cardRef.current) throw new Error("export no disponible");
    return await h2c(cardRef.current, {
      backgroundColor: "#0e1210",
      scale: 2,
      useCORS: true,
      logging: false
    });
  };
  const downloadPNG = async () => {
    try {
      window.__toast?.("Generando imagen...");
      const canvas = await captureCanvas();
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${slug}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        window.__toast?.("PNG descargado");
      }, "image/png");
    } catch (e) {
      window.__toast?.("Error al exportar PNG");
    }
  };
  const downloadPDF = async () => {
    try {
      window.__toast?.("Generando PDF...");
      const canvas = await captureCanvas();
      const {
        jsPDF
      } = window.jspdf || {};
      if (!jsPDF) throw new Error("jsPDF no cargó");
      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let w = pageW - 20,
        h = w / ratio;
      if (h > pageH - 20) {
        h = pageH - 20;
        w = h * ratio;
      }
      pdf.addImage(imgData, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);
      pdf.save(`${slug}.pdf`);
      window.__toast?.("PDF descargado");
    } catch (e) {
      window.__toast?.("Error al exportar PDF");
    }
  };
  const downloadICS = () => {
    try {
      const pad = n => String(n).padStart(2, "0");
      const dt = match.date.replace(/-/g, "") + "T" + match.time.replace(":", "") + "00";
      const [y, mo, d] = match.date.split("-").map(Number);
      const [hh, mm] = match.time.split(":").map(Number);
      const end = new Date(y, mo - 1, d, hh, mm + 90);
      const dtEnd = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`;
      const now = new Date();
      const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
      const esc = s => String(s || "").replace(/[\\,;]/g, "\\$&").replace(/\n/g, "\\n");
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//futbolClub//ES", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${Date.now()}@futbolclub`, `DTSTAMP:${stamp}`, `DTSTART:${dt}`, `DTEND:${dtEnd}`, `SUMMARY:${esc(`${draft.name} vs ${match.opponent}`)}`, `LOCATION:${esc(match.venue)}`, `DESCRIPTION:${esc(`Formación ${formation.name} · Fut ${mode} · ${players.filter(Boolean).length}/${size} jugadores`)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      const blob = new Blob([ics], {
        type: "text/calendar;charset=utf-8"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      window.__toast?.("Evento .ics descargado");
    } catch (e) {
      window.__toast?.("Error al exportar .ics");
    }
  };
  const nativeShare = async () => {
    const text = `${shareText}\n${shareURL}`;
    if (navigator.share) {
      try {
        const canvas = await captureCanvas();
        const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
        const file = new File([blob], `${slug}.png`, {
          type: "image/png"
        });
        if (navigator.canShare && navigator.canShare({
          files: [file]
        })) {
          await navigator.share({
            title: draft.name,
            text,
            files: [file]
          });
          return;
        }
        await navigator.share({
          title: draft.name,
          text,
          url: shareURL
        });
      } catch (_) {}
    } else {
      copyLink();
    }
  };
  const openExternal = url => window.open(url, "_blank", "noopener,noreferrer");
  const openWA = () => openExternal(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareURL)}`);
  const openTW = () => openExternal(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareURL)}`);
  const openTG = () => openExternal(`https://t.me/share/url?url=${encodeURIComponent(shareURL)}&text=${encodeURIComponent(shareText)}`);
  const openIG = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareURL}`);
    } catch (_) {}
    window.__toast?.("Texto copiado · abrí Instagram y pegá");
    openExternal("https://instagram.com");
  };
  const kicker = (() => {
    try {
      const d = new Date(match.date + "T" + match.time);
      const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
      return `${days[d.getDay()]} · ${match.venue.toUpperCase()} · ${match.time}`;
    } catch (_) {
      return `${match.venue} · ${match.time}`;
    }
  })();
  return React.createElement("div", null, React.createElement("div", {
    className: "page-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Compartir"), React.createElement("h1", {
    className: "page-title"
  }, "Mand\xE1 la alineaci\xF3n"), React.createElement("div", {
    className: "page-sub"
  }, "Descarg\xE1 como imagen, PDF o evento de calendario \xB7 link directo o deep-link a redes.")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement("button", {
    className: "btn",
    onClick: copyLink
  }, React.createElement(Icon, {
    name: "link",
    size: 13
  }), " Copiar link"), React.createElement("button", {
    className: "btn",
    onClick: downloadPNG
  }, React.createElement(Icon, {
    name: "download",
    size: 13
  }), " Descargar PNG"), React.createElement("button", {
    className: "btn primary",
    onClick: nativeShare
  }, React.createElement(Icon, {
    name: "send",
    size: 13
  }), " Compartir"))), shareWasCompressed && React.createElement("div", {
    className: "share-size-note"
  }, "Para que el enlace funcione bien en m\xF3viles y mensajer\xEDa, se compartir\xE1 sin las fotos de jugadores."), React.createElement("div", {
    className: "share-layout"
  }, React.createElement("div", {
    className: "share-preview"
  }, React.createElement("div", {
    className: "share-style-tabs"
  }, React.createElement("button", {
    className: styleTab === "card" ? "on" : "",
    onClick: () => setStyleTab("card")
  }, "Card"), React.createElement("button", {
    className: styleTab === "list" ? "on" : "",
    onClick: () => setStyleTab("list")
  }, "Lista"), React.createElement("button", {
    className: styleTab === "stories" ? "on" : "",
    onClick: () => setStyleTab("stories")
  }, "Stories 9:16")), React.createElement("div", {
    className: "share-capture-wrap"
  }, styleTab === "card" && React.createElement("div", {
    className: "share-card",
    ref: cardRef
  }, React.createElement("div", {
    className: "share-card-head"
  }, React.createElement("div", null, include.venue && React.createElement("div", {
    className: "share-kicker"
  }, kicker), React.createElement("div", {
    className: "share-title"
  }, (draft.name || "MI EQUIPO").toUpperCase())), include.kit && React.createElement(Kit, {
    design: kit.design,
    primary: kit.primary,
    secondary: kit.secondary,
    number: 10,
    size: 70,
    showNumber: true
  })), React.createElement("div", {
    className: "share-card-pitch"
  }, React.createElement(Pitch, {
    mode: mode,
    formationIndex: formIdx,
    players: players,
    kit: kit,
    interactive: false,
    style: "classic",
    showNames: include.names,
    freeMode: !!draft.freeMode,
    positionOverrides: overrides
  })), React.createElement("div", {
    className: "share-card-foot"
  }, React.createElement("div", {
    className: "share-meta-item"
  }, React.createElement("span", null, "Formaci\xF3n"), React.createElement("strong", null, formation.name)), React.createElement("div", {
    className: "share-meta-item"
  }, React.createElement("span", null, "Fut"), React.createElement("strong", null, mode, "v", mode)), React.createElement("div", {
    className: "share-meta-item"
  }, React.createElement("span", null, "Capit\xE1n"), React.createElement("strong", null, captain)), include.venue ? React.createElement("div", {
    className: "share-meta-item"
  }, React.createElement("span", null, match.venue), React.createElement("strong", null, match.time)) : React.createElement("div", {
    className: "share-meta-item"
  }, React.createElement("span", null, "Jugadores"), React.createElement("strong", null, players.filter(Boolean).length, "/", size))), include.stats && match.myScore != null && React.createElement("div", {
    className: "share-stats-row"
  }, React.createElement("span", null, "\xDALTIMO"), React.createElement("strong", {
    style: {
      color: match.myScore > match.theirScore ? "var(--accent)" : match.myScore < match.theirScore ? "var(--accent-2)" : "var(--fg-mute)"
    }
  }, match.myScore, "\u2013", match.theirScore), React.createElement("span", null, "vs ", match.opponent)), include.watermark && React.createElement("div", {
    className: "share-watermark"
  }, "futbolClub.app")), styleTab === "list" && React.createElement("div", {
    className: "share-card list",
    ref: cardRef
  }, React.createElement("div", {
    className: "share-card-head"
  }, React.createElement("div", null, include.venue && React.createElement("div", {
    className: "share-kicker"
  }, kicker), React.createElement("div", {
    className: "share-title"
  }, (draft.name || "MI EQUIPO").toUpperCase())), include.kit && React.createElement(Kit, {
    design: kit.design,
    primary: kit.primary,
    secondary: kit.secondary,
    number: 10,
    size: 70,
    showNumber: true
  })), React.createElement("div", {
    className: "share-list-grid"
  }, players.filter(Boolean).map(p => React.createElement("div", {
    key: p.id,
    className: "share-list-item"
  }, React.createElement("div", {
    className: "share-list-num"
  }, "#", p.num), React.createElement("div", null, include.names && React.createElement("div", {
    className: "share-list-name"
  }, p.name), React.createElement("div", {
    className: "share-list-pos"
  }, p.pos))))), include.watermark && React.createElement("div", {
    className: "share-watermark"
  }, "futbolClub.app")), styleTab === "stories" && React.createElement("div", {
    className: "share-card stories",
    ref: cardRef
  }, React.createElement("div", {
    style: {
      padding: "20px 24px",
      flex: 1,
      display: "flex",
      flexDirection: "column"
    }
  }, include.venue && React.createElement("div", {
    className: "share-kicker"
  }, kicker), React.createElement("div", {
    className: "share-title",
    style: {
      fontSize: 48
    }
  }, (draft.name || "MI EQUIPO").toUpperCase()), React.createElement("div", {
    style: {
      marginTop: 20,
      flex: 1,
      display: "flex"
    }
  }, React.createElement(Pitch, {
    mode: mode,
    formationIndex: formIdx,
    players: players,
    kit: kit,
    interactive: false,
    style: "classic",
    showNames: include.names,
    freeMode: !!draft.freeMode,
    positionOverrides: overrides
  })), include.watermark && React.createElement("div", {
    className: "share-watermark",
    style: {
      position: "static",
      marginTop: 10
    }
  }, "futbolClub.app"))))), React.createElement("div", {
    className: "share-side"
  }, React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Camiseta"), React.createElement("div", {
    className: "share-kit-row"
  }, React.createElement("span", null, "Ver en cancha"), React.createElement("div", {
    className: "seg"
  }, React.createElement("button", {
    className: playerStyle === "photo" ? "on" : "",
    onClick: () => window.fcSetTweak("playerStyle", "photo")
  }, "Foto"), React.createElement("button", {
    className: playerStyle === "shirt" ? "on" : "",
    onClick: () => window.fcSetTweak("playerStyle", "shirt")
  }, "Camiseta"))), draft.altKit && React.createElement("div", {
    className: "seg",
    style: {
      width: "100%",
      marginTop: 10
    }
  }, React.createElement("button", {
    style: {
      flex: 1
    },
    className: shareKitMode === "main" ? "on" : "",
    onClick: () => setShareKitMode("main")
  }, "Titular"), React.createElement("button", {
    style: {
      flex: 1
    },
    className: shareKitMode === "alt" ? "on" : "",
    onClick: () => setShareKitMode("alt")
  }, "Alternativa"))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Partido"), React.createElement("div", {
    className: "match-fields"
  }, React.createElement("label", null, React.createElement("span", null, "Fecha"), React.createElement("input", {
    type: "date",
    value: match.date,
    onChange: e => setMatch(m => ({
      ...m,
      date: e.target.value
    }))
  })), React.createElement("label", null, React.createElement("span", null, "Hora"), React.createElement("input", {
    type: "time",
    value: match.time,
    onChange: e => setMatch(m => ({
      ...m,
      time: e.target.value
    }))
  })), React.createElement("label", null, React.createElement("span", null, "Cancha"), React.createElement("input", {
    type: "text",
    value: match.venue,
    onChange: e => setMatch(m => ({
      ...m,
      venue: e.target.value
    }))
  })), React.createElement("label", null, React.createElement("span", null, "Rival"), React.createElement("input", {
    type: "text",
    value: match.opponent,
    onChange: e => setMatch(m => ({
      ...m,
      opponent: e.target.value
    }))
  })))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "V\xEDnculos"), React.createElement("div", {
    className: "share-link-row"
  }, React.createElement("input", {
    value: shareURL,
    readOnly: true,
    onClick: e => e.target.select()
  }), React.createElement("button", {
    className: "btn sm",
    onClick: copyLink
  }, "Copiar")), React.createElement("div", {
    className: "share-socials"
  }, React.createElement("button", {
    className: "social wa",
    onClick: openWA
  }, "WhatsApp"), React.createElement("button", {
    className: "social ig",
    onClick: openIG
  }, "Instagram"), React.createElement("button", {
    className: "social tw",
    onClick: openTW
  }, "X / Twitter"), React.createElement("button", {
    className: "social tg",
    onClick: openTG
  }, "Telegram"))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Incluir"), React.createElement("label", {
    className: "toggle-row"
  }, React.createElement("input", {
    type: "checkbox",
    checked: include.names,
    onChange: () => tog("names")
  }), " ", React.createElement("span", null, "Nombres de jugadores")), React.createElement("label", {
    className: "toggle-row"
  }, React.createElement("input", {
    type: "checkbox",
    checked: include.kit,
    onChange: () => tog("kit")
  }), " ", React.createElement("span", null, "Camiseta")), React.createElement("label", {
    className: "toggle-row"
  }, React.createElement("input", {
    type: "checkbox",
    checked: include.venue,
    onChange: () => tog("venue")
  }), " ", React.createElement("span", null, "Cancha y horario")), React.createElement("label", {
    className: "toggle-row"
  }, React.createElement("input", {
    type: "checkbox",
    checked: include.stats,
    onChange: () => tog("stats")
  }), " ", React.createElement("span", null, "Estad\xEDsticas \xFAltimo partido")), React.createElement("label", {
    className: "toggle-row"
  }, React.createElement("input", {
    type: "checkbox",
    checked: include.watermark,
    onChange: () => tog("watermark")
  }), " ", React.createElement("span", null, "Marca de agua"))), React.createElement("div", {
    className: "panel"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Exportar como"), React.createElement("div", {
    className: "export-grid"
  }, React.createElement("button", {
    className: "export-opt",
    onClick: downloadPNG
  }, "PNG", React.createElement("br", null), React.createElement("span", null, "1080\xD71350")), React.createElement("button", {
    className: "export-opt",
    onClick: downloadPDF
  }, "PDF", React.createElement("br", null), React.createElement("span", null, "A4")), React.createElement("button", {
    className: "export-opt",
    onClick: downloadICS
  }, ".ics", React.createElement("br", null), React.createElement("span", null, "Calendario")), React.createElement("button", {
    className: "export-opt",
    onClick: copyLink
  }, "Link", React.createElement("br", null), React.createElement("span", null, "Vista web")))))));
}
window.mountPage("page-share", React.createElement(SharePage, null));
//# sourceURL=src/page-share.jsx
