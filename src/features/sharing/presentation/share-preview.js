import { createRegistry } from "../../../shared/domain/registry.js";

/** Stateless layout strategies. An extra layout is registered without editing the page. */
export function createSharePreview({ React, Pitch, Kit, layouts = {} }) {
  const h = React.createElement;
  function Heading({ model }) {
    return h(
      "div",
      { className: "share-card-head" },
      h(
        "div",
        null,
        model.include.venue &&
          h("div", { className: "share-kicker" }, model.kicker),
        h("div", { className: "share-title" }, model.draft.name.toUpperCase()),
      ),
      model.include.kit &&
        h(Kit, { ...model.kit, number: 10, size: 70, showNumber: true }),
    );
  }
  function Field({ model }) {
    return h(Pitch, {
      mode: model.mode,
      formationIndex: model.formIdx,
      players: model.players,
      kit: model.kit,
      interactive: false,
      style: "classic",
      showNames: model.include.names,
      freeMode: model.draft.freeMode,
      positionOverrides: model.overrides,
    });
  }
  function Watermark({ model }) {
    return (
      model.include.watermark &&
      h("div", { className: "share-watermark" }, "futbolClub.app")
    );
  }
  const meta = (label, value) =>
    h(
      "div",
      { className: "share-meta-item" },
      h("span", null, label),
      h("strong", null, value),
    );
  function Card({ model, captureRef }) {
    const match = model.match;
    return h(
      "div",
      { className: "share-card", ref: captureRef },
      h(Heading, { model }),
      h("div", { className: "share-card-pitch" }, h(Field, { model })),
      h(
        "div",
        { className: "share-card-foot" },
        meta("Formación", model.formation.name),
        meta("Fut", `${model.mode}v${model.mode}`),
        meta("Capitán", model.captain),
        model.include.venue
          ? meta(match.venue, match.time)
          : meta(
              "Jugadores",
              `${model.players.filter(Boolean).length}/${model.size}`,
            ),
      ),
      model.include.stats &&
        match.myScore != null &&
        match.theirScore != null &&
        h(
          "div",
          { className: "share-stats-row" },
          h("span", null, "ÚLTIMO"),
          h("strong", null, `${match.myScore}–${match.theirScore}`),
          h("span", null, `vs ${match.opponent}`),
        ),
      h(Watermark, { model }),
    );
  }
  function List({ model, captureRef }) {
    return h(
      "div",
      { className: "share-card list", ref: captureRef },
      h(Heading, { model }),
      h(
        "div",
        { className: "share-list-grid" },
        model.players
          .filter(Boolean)
          .map((player) =>
            h(
              "div",
              { key: player.id, className: "share-list-item" },
              h("div", { className: "share-list-num" }, `#${player.num}`),
              h(
                "div",
                null,
                model.include.names &&
                  h("div", { className: "share-list-name" }, player.name),
                h("div", { className: "share-list-pos" }, player.pos),
              ),
            ),
          ),
      ),
      h(Watermark, { model }),
    );
  }
  function Stories({ model, captureRef }) {
    return h(
      "div",
      { className: "share-card stories", ref: captureRef },
      h(
        "div",
        {
          style: {
            padding: "20px 24px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          },
        },
        model.include.venue &&
          h("div", { className: "share-kicker" }, model.kicker),
        h(
          "div",
          { className: "share-title", style: { fontSize: 48 } },
          model.draft.name.toUpperCase(),
        ),
        h(
          "div",
          { style: { marginTop: 20, flex: 1, display: "flex" } },
          h(Field, { model }),
        ),
        h(Watermark, { model }),
      ),
    );
  }
  const registry = createRegistry(
    { card: Card, list: List, stories: Stories },
    layouts,
  );
  const labels = { card: "Card", list: "Lista", stories: "Stories 9:16" };
  function Preview({ style, model, captureRef }) {
    const Layout = registry.get(style);
    if (!Layout) throw new Error("Diseño de exportación no disponible");
    return h(Layout, { model, captureRef });
  }
  return Object.freeze({
    Component: Preview,
    options: registry.keys().map((id) => ({ id, label: labels[id] || id })),
  });
}
