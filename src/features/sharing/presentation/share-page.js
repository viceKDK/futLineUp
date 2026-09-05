import { buildShareModel } from "../domain/share-model.js";
import { createSharePreview } from "./share-preview.js";
import { createShareControls } from "./share-controls.js";

/** React is injected; neither the module nor its components reads application globals. */
export function createSharePage({
  React,
  useStore,
  defaults,
  formations,
  snapshots,
  services,
  address,
  tweaks,
  notify,
  Pitch,
  Kit,
  Icon,
  prepareNativeImage = false,
}) {
  const h = React.createElement;
  const preview = createSharePreview({ React, Pitch, Kit });
  const Controls = createShareControls(React);
  function readRoute() {
    const hash = address.hash();
    try {
      return {
        hash,
        visible: address.visible(),
        snapshot: hash.startsWith("#share=")
          ? snapshots.decode(hash.slice(7))
          : null,
        error: null,
      };
    } catch (error) {
      return {
        hash,
        visible: address.visible(),
        snapshot: null,
        error: error.message,
      };
    }
  }
  return function SharePage() {
    const [style, setStyle] = React.useState("card");
    const [playerStyle, setPlayerStyle] = React.useState(
      () => tweaks.read().playerStyle || "photo",
    );
    const [route, setRoute] = React.useState(readRoute);
    const [edits, setEdits] = React.useState({});
    const [storedRoster] = useStore("roster", defaults.roster);
    const [storedDraft] = useStore("editor", defaults.draft);
    const [currentKit] = useStore("currentKit", null);
    const [storedMatch, setStoredMatch] = useStore("matchInfo", defaults.match);
    const [storedInclude, setStoredInclude] = useStore(
      "shareInclude",
      defaults.include,
    );
    const sourceDraft = route.snapshot?.draft || storedDraft || defaults.draft;
    const roster = route.snapshot?.roster || storedRoster || defaults.roster;
    const [kitMode, setKitMode] = React.useState(
      sourceDraft.activeKit === "alt" ? "alt" : "main",
    );
    const [busy, setBusy] = React.useState(false);
    const captureRef = React.useRef(null),
      fileRef = React.useRef(null),
      running = React.useRef(false),
      alive = React.useRef(true);
    React.useEffect(() => {
      alive.current = true;
      return () => {
        alive.current = false;
      };
    }, []);
    React.useEffect(() => address.subscribe(() => setRoute(readRoute())), []);
    React.useEffect(
      () =>
        tweaks.subscribe(() =>
          setPlayerStyle(tweaks.read().playerStyle || "photo"),
        ),
      [],
    );
    React.useEffect(() => {
      setEdits({});
    }, [route.hash]);
    React.useEffect(() => {
      setKitMode(sourceDraft.activeKit === "alt" ? "alt" : "main");
    }, [sourceDraft.teamId, sourceDraft.activeKit, route.hash]);
    const derived = React.useMemo(() => {
      try {
        return {
          model: buildShareModel(
            {
              draft: { ...sourceDraft, kit: sourceDraft.kit || currentKit },
              roster,
              kitMode,
              match: {
                ...defaults.match,
                ...(route.snapshot?.match || storedMatch),
                ...edits.match,
              },
              include: {
                ...defaults.include,
                ...storedInclude,
                ...route.snapshot?.include,
                ...edits.include,
              },
            },
            formations,
          ),
          error: null,
        };
      } catch (error) {
        return { model: null, error: error.message };
      }
    }, [
      sourceDraft,
      roster,
      kitMode,
      currentKit,
      storedMatch,
      storedInclude,
      route.snapshot,
      edits,
    ]);
    const model = derived.model;
    const link = React.useMemo(() => {
      if (!model) return { url: "", error: null };
      try {
        return services.createLink(model.payload, address.baseUrl());
      } catch (error) {
        return { url: "", error: error.message };
      }
    }, [model]);
    const captureKey = React.useMemo(
      () => ({}),
      [model, style, playerStyle, route.visible],
    );
    React.useEffect(() => {
      let active = true;
      fileRef.current = null;
      if (prepareNativeImage && model && route.visible) {
        services
          .prepareImage({ element: captureRef.current, model })
          .then((file) => {
            if (active) fileRef.current = { key: captureKey, file };
          })
          .catch(() => {
            /* Link sharing remains available when image capture is unsupported. */
          });
      }
      return () => {
        active = false;
      };
    }, [captureKey]);
    async function run(action, message) {
      if (running.current) return;
      running.current = true;
      setBusy(true);
      try {
        const result = await action();
        if (message)
          notify(typeof message === "function" ? message(result) : message);
      } catch (error) {
        notify(error.message || "No se pudo completar la operación");
      } finally {
        running.current = false;
        if (alive.current) setBusy(false);
      }
    }
    const actions = {
      setKitMode,
      setPlayerStyle: (value) => tweaks.set("playerStyle", value),
      setMatch(key, value) {
        if (route.snapshot)
          setEdits((old) => ({
            ...old,
            match: { ...old.match, [key]: value },
          }));
        else
          setStoredMatch((old) => ({
            ...(old || defaults.match),
            [key]: value,
          }));
      },
      toggleInclude(key) {
        if (route.snapshot)
          setEdits((old) => ({
            ...old,
            include: { ...old.include, [key]: !model.include[key] },
          }));
        else
          setStoredInclude((old) => ({
            ...(old || defaults.include),
            [key]: !model.include[key],
          }));
      },
      copyLink: () => run(() => services.copyLink(link.url), "Link copiado"),
      exportFile: (format) =>
        run(
          () =>
            services.exportFile(format, { element: captureRef.current, model }),
          `${format.toUpperCase()} descargado`,
        ),
      openChannel: (channel) =>
        run(() =>
          services.openChannel(channel, { text: model.text, url: link.url }),
        ),
    };
    const share = () =>
      run(
        () =>
          services.share({
            title: model.draft.name,
            text: model.text,
            url: link.url,
            file:
              fileRef.current?.key === captureKey ? fileRef.current.file : null,
          }),
        (result) => {
          if (result === "copied")
            return "Compartir no está disponible: link copiado";
          return result === "shared"
            ? "Alineación compartida"
            : "Compartir cancelado";
        },
      );
    if (derived.error)
      return h("section", { className: "panel", role: "alert" }, derived.error);
    return h(
      "div",
      null,
      h(
        "div",
        { className: "page-head" },
        h(
          "div",
          null,
          h("div", { className: "page-kicker" }, "Compartir"),
          h("h1", { className: "page-title" }, "Mandá la alineación"),
          h(
            "div",
            { className: "page-sub" },
            "Imagen, PDF, calendario o enlace. Elegí qué datos incluir.",
          ),
        ),
        h(
          "div",
          { style: { display: "flex", gap: 8 } },
          h(
            "button",
            {
              className: "btn",
              onClick: actions.copyLink,
              disabled: busy || !link.url,
            },
            h(Icon, { name: "link", size: 13 }),
            " Copiar link",
          ),
          h(
            "button",
            {
              className: "btn",
              onClick: () => actions.exportFile("png"),
              disabled: busy,
            },
            h(Icon, { name: "download", size: 13 }),
            " Descargar PNG",
          ),
          h(
            "button",
            {
              className: "btn primary",
              onClick: share,
              disabled: busy || !link.url,
            },
            h(Icon, { name: "send", size: 13 }),
            " Compartir",
          ),
        ),
      ),
      route.error &&
        h(
          "div",
          { role: "alert", className: "share-size-note" },
          `El enlace recibido no es válido: ${route.error}`,
        ),
      link.error &&
        h(
          "div",
          { role: "alert", className: "share-size-note" },
          `Enlace no disponible: ${link.error}. Las exportaciones siguen disponibles.`,
        ),
      link.withoutPhotos &&
        h(
          "div",
          { className: "share-size-note" },
          "El enlace se compartirá sin fotos para reducir su tamaño.",
        ),
      route.snapshot &&
        h(
          "div",
          { className: "share-size-note" },
          "Vista compartida: tus ajustes aquí no modifican los datos guardados en este dispositivo.",
        ),
      h(
        "div",
        { className: "share-layout", "aria-busy": busy },
        h(
          "div",
          { className: "share-preview" },
          h(
            "div",
            { className: "share-style-tabs" },
            preview.options.map(({ id, label }) =>
              h(
                "button",
                {
                  key: id,
                  className: style === id ? "on" : "",
                  "aria-pressed": style === id,
                  disabled: busy,
                  onClick: () => setStyle(id),
                },
                label,
              ),
            ),
          ),
          h(
            "div",
            { className: "share-capture-wrap" },
            h(preview.Component, { model, style, captureRef }),
          ),
        ),
        h(Controls, {
          model,
          hasAltKit: !!sourceDraft.altKit,
          kitMode,
          playerStyle,
          link: link.url,
          busy,
          formats: services.formats(),
          actions,
        }),
      ),
    );
  };
}
