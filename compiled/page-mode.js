function ModePage() {
  const [selected, setSelected] = React.useState(7);
  const [name, setName] = React.useState("");
  const [, setDraft] = window.useStore("editor", null);
  const modes = [{
    n: 5,
    label: "Fut 5",
    sub: "Papi / fútbol sala",
    per: "5 vs 5",
    size: "15×25m"
  }, {
    n: 6,
    label: "Fut 6",
    sub: "Cancha chica",
    per: "6 vs 6",
    size: "20×30m"
  }, {
    n: 7,
    label: "Fut 7",
    sub: "El clásico entre semana",
    per: "7 vs 7",
    size: "30×50m"
  }, {
    n: 8,
    label: "Fut 8",
    sub: "Cancha mediana",
    per: "8 vs 8",
    size: "40×60m"
  }, {
    n: 11,
    label: "Fut 11",
    sub: "Cancha grande / oficial",
    per: "11 vs 11",
    size: "68×105m"
  }];
  return React.createElement("div", null, React.createElement("div", {
    className: "page-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Paso 1 de 3 \xB7 Modo"), React.createElement("h1", {
    className: "page-title"
  }, "\xBFCu\xE1ntos por lado?"), React.createElement("div", {
    className: "page-sub"
  }, "Eleg\xED el modo de cancha. Despu\xE9s vas a poder cambiar la formaci\xF3n y los jugadores.")), React.createElement("button", {
    className: "btn",
    onClick: () => window.go("home")
  }, "\u2190 Volver")), React.createElement("div", {
    className: "mode-grid"
  }, modes.map(m => React.createElement("button", {
    key: m.n,
    className: `mode-card ${selected === m.n ? "selected" : ""}`,
    onClick: () => setSelected(m.n)
  }, React.createElement("div", {
    className: "mode-num"
  }, React.createElement("span", {
    className: "mode-num-big"
  }, m.n), React.createElement("span", {
    className: "mode-num-v"
  }, "v"), React.createElement("span", {
    className: "mode-num-big"
  }, m.n)), React.createElement("div", {
    className: "mode-label"
  }, m.label), React.createElement("div", {
    className: "mode-sub"
  }, m.sub), React.createElement("div", {
    className: "mode-meta"
  }, React.createElement("span", null, m.per), React.createElement("span", {
    className: "dot"
  }, "\xB7"), React.createElement("span", null, m.size)), React.createElement("div", {
    className: "mode-check"
  }, selected === m.n ? "✓" : "")))), React.createElement("div", {
    className: "mode-foot"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Paso 2 \xB7 Nombre"), React.createElement("input", {
    className: "mode-input",
    type: "text",
    placeholder: "Los Pibes del Viernes",
    value: name,
    onChange: e => setName(e.target.value)
  })), React.createElement("button", {
    className: "btn primary lg",
    onClick: () => {
      setDraft({
        teamId: null,
        name: name.trim() || "Mi equipo",
        mode: selected,
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
      window.go("editor");
    }
  }, "Siguiente \xB7 Armar alineaci\xF3n \u2192")));
}
window.mountPage("page-mode", React.createElement(ModePage, null));
//# sourceURL=src/page-mode.jsx
