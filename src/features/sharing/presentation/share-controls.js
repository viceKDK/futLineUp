/** Presentation-only controls; file formats, persistence and I/O are supplied by the caller. */
export function createShareControls(React) {
  const h = React.createElement;
  const button = (label, onClick, props = {}) =>
    h("button", { type: "button", onClick, ...props }, label);
  function Panel({ title, children }) {
    return h(
      "section",
      { className: "panel" },
      h("div", { className: "panel-head" }, title),
      children,
    );
  }
  function MatchFields({ match, onChange, disabled }) {
    return h(
      "div",
      { className: "match-fields" },
      [
        ["date", "Fecha", "date"],
        ["time", "Hora", "time"],
        ["venue", "Cancha", "text"],
        ["opponent", "Rival", "text"],
      ].map(([key, label, type]) =>
        h(
          "label",
          { key },
          h("span", null, label),
          h("input", {
            type,
            disabled,
            value: match[key],
            onChange: (event) => onChange(key, event.target.value),
          }),
        ),
      ),
    );
  }
  function Controls({
    model,
    hasAltKit,
    kitMode,
    playerStyle,
    link,
    busy,
    formats,
    actions,
  }) {
    const disabled = busy || !link;
    return h(
      "div",
      { className: "share-side" },
      h(
        Panel,
        { title: "Camiseta" },
        h(
          "div",
          { className: "share-kit-row" },
          h("span", null, "Ver en cancha"),
          h(
            "div",
            { className: "seg" },
            [
              ["photo", "Foto"],
              ["shirt", "Camiseta"],
            ].map(([id, label]) =>
              button(label, () => actions.setPlayerStyle(id), {
                key: id,
                className: playerStyle === id ? "on" : "",
                "aria-pressed": playerStyle === id,
                disabled: busy,
              }),
            ),
          ),
        ),
        hasAltKit &&
          h(
            "div",
            { className: "seg", style: { width: "100%", marginTop: 10 } },
            [
              ["main", "Titular"],
              ["alt", "Alternativa"],
            ].map(([id, label]) =>
              button(label, () => actions.setKitMode(id), {
                key: id,
                style: { flex: 1 },
                className: kitMode === id ? "on" : "",
                "aria-pressed": kitMode === id,
                disabled: busy,
              }),
            ),
          ),
      ),
      h(
        Panel,
        { title: "Partido" },
        h(MatchFields, {
          match: model.match,
          onChange: actions.setMatch,
          disabled: busy,
        }),
      ),
      h(
        Panel,
        { title: "Vínculos" },
        h(
          "div",
          { className: "share-link-row" },
          h("input", {
            value: link || "",
            readOnly: true,
            "aria-label": "Enlace de alineación",
            onClick: (event) => event.target.select(),
          }),
          button("Copiar", actions.copyLink, { className: "btn sm", disabled }),
        ),
        h(
          "div",
          { className: "share-socials" },
          [
            ["whatsapp", "WhatsApp", "wa"],
            ["instagram", "Instagram", "ig"],
            ["twitter", "X / Twitter", "tw"],
            ["telegram", "Telegram", "tg"],
          ].map(([id, label, css]) =>
            button(label, () => actions.openChannel(id), {
              key: id,
              className: `social ${css}`,
              disabled,
            }),
          ),
        ),
      ),
      h(
        Panel,
        { title: "Incluir" },
        [
          ["names", "Nombres de jugadores"],
          ["kit", "Camiseta"],
          ["venue", "Cancha y horario"],
          ["stats", "Estadísticas último partido"],
          ["watermark", "Marca de agua"],
        ].map(([id, label]) =>
          h(
            "label",
            { key: id, className: "toggle-row" },
            h("input", {
              type: "checkbox",
              checked: model.include[id],
              disabled: busy,
              onChange: () => actions.toggleInclude(id),
            }),
            h("span", null, label),
          ),
        ),
      ),
      h(
        Panel,
        { title: "Exportar como" },
        h(
          "div",
          { className: "export-grid" },
          formats.map((format) =>
            button(
              format === "ics" ? ".ics" : format.toUpperCase(),
              () => actions.exportFile(format),
              { key: format, className: "export-opt", disabled: busy },
            ),
          ),
          button("Link", actions.copyLink, {
            className: "export-opt",
            disabled,
          }),
        ),
        h(
          "p",
          { className: "muted-note" },
          "El calendario usa la zona horaria de este dispositivo.",
        ),
      ),
    );
  }
  return Controls;
}
