/** Compatibility adapter for existing React pages; no persistence implementation here. */
export function installReactHelpers(target, React, ReactDOM) {
  target.useStore = function (key, initial) {
    const initialRef = React.useRef();
    // A new key must not inherit the previous key's default value.
    if (!initialRef.current || initialRef.current.key !== key) {
      initialRef.current = { key, value: typeof initial === "function" ? initial() : initial };
    }
    const subscribe = React.useCallback((fn) => target.db.subscribe(key, fn), [key]);
    const getSnapshot = React.useCallback(() => target.db.load(key, initialRef.current.value), [key]);
    const value = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    const set = React.useCallback((updater) => {
      const previous = target.db.load(key, initialRef.current.value);
      target.db.save(key, typeof updater === "function" ? updater(previous) : updater);
    }, [key]);
    return [value, set];
  };
  target.useDialogAccessibility = function (open, onClose) {
    const ref = React.useRef(null);
    const closeRef = React.useRef(onClose);
    closeRef.current = onClose;
    React.useEffect(() => {
      if (!open || !ref.current)
        return;
      const dialog = ref.current;
      const previous = target.document.activeElement;
      const selector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
      const focusable = () => [...dialog.querySelectorAll(selector)].filter((el) => !el.hidden && el.offsetParent !== null);
      (focusable()[0] || dialog).focus();
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeRef.current?.();
          return;
        }
        if (event.key !== "Tab")
          return;
        const items = focusable();
        if (!items.length) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && target.document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        else if (!event.shiftKey && target.document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      target.document.addEventListener("keydown", onKeyDown);
      return () => {
        target.document.removeEventListener("keydown", onKeyDown);
        if (previous instanceof target.HTMLElement)
          previous.focus();
      };
    }, [open]);
    return ref;
  };
  class PageErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { failed: false }; }
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error) { target.console.error("[futbolClub] Error al renderizar una pantalla", error); }
    render() {
      if (!this.state.failed)
        return this.props.children;
      return React.createElement("section", { className: "panel", role: "alert", style: { maxWidth: 620 } }, React.createElement("div", { className: "panel-title" }, "No pudimos mostrar esta pantalla"), React.createElement("p", { style: { color: "var(--fg-mute)", margin: "10px 0 16px" } }, "Tus datos siguen guardados. Recargá la aplicación para volver a intentarlo."), React.createElement("button", { className: "btn primary", onClick: () => target.location.reload() }, "Recargar aplicación"));
    }
  }
  target.mountPage = (elementId, content) => {
    const element = target.document.getElementById(elementId);
    if (!element)
      throw new Error(`No existe el contenedor #${elementId}`);
    ReactDOM.createRoot(element).render(React.createElement(PageErrorBoundary, null, content));
  };
}
