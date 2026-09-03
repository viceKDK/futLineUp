// Shared state + data for futbolClub

// ---- Formations per mode ----
// Coordinates are % of pitch: x left→right (0-100), y own-goal(0) → rival-goal(100)
// Arquero siempre en y≈6.
const F = (name, positions) => ({ name, positions });

window.FORMATIONS = {
  5: [
    F("1-2-1", [
      [50, 8],
      [30, 30],
      [70, 30],
      [50, 55],
      [50, 78],
    ]),
    F("1-1-2", [
      [50, 8],
      [50, 30],
      [50, 52],
      [30, 76],
      [70, 76],
    ]),
    F("Rombo", [
      [50, 8],
      [50, 28],
      [30, 52],
      [70, 52],
      [50, 76],
    ]),
  ],
  6: [
    F("2-1-2", [
      [50, 8],
      [30, 24],
      [70, 24],
      [50, 48],
      [30, 72],
      [70, 72],
    ]),
    F("1-2-2", [
      [50, 8],
      [50, 24],
      [30, 46],
      [70, 46],
      [30, 72],
      [70, 72],
    ]),
    F("1-3-1", [
      [50, 8],
      [50, 24],
      [25, 50],
      [50, 50],
      [75, 50],
      [50, 76],
    ]),
  ],
  7: [
    F("2-3-1", [
      [50, 8],
      [32, 22],
      [68, 22],
      [22, 48],
      [50, 48],
      [78, 48],
      [50, 76],
    ]),
    F("3-2-1", [
      [50, 8],
      [22, 24],
      [50, 24],
      [78, 24],
      [35, 50],
      [65, 50],
      [50, 76],
    ]),
    F("2-1-2-1", [
      [50, 8],
      [32, 22],
      [68, 22],
      [50, 40],
      [30, 60],
      [70, 60],
      [50, 78],
    ]),
  ],
  8: [
    F("3-3-1", [
      [50, 8],
      [22, 22],
      [50, 22],
      [78, 22],
      [22, 48],
      [50, 48],
      [78, 48],
      [50, 76],
    ]),
    F("2-3-2", [
      [50, 8],
      [32, 22],
      [68, 22],
      [22, 46],
      [50, 46],
      [78, 46],
      [35, 72],
      [65, 72],
    ]),
    F("3-1-2-1", [
      [50, 8],
      [22, 22],
      [50, 22],
      [78, 22],
      [50, 42],
      [32, 62],
      [68, 62],
      [50, 80],
    ]),
  ],
  11: [
    F("4-4-2", [
      [50, 6],
      [14, 22],
      [38, 22],
      [62, 22],
      [86, 22],
      [14, 48],
      [38, 48],
      [62, 48],
      [86, 48],
      [38, 74],
      [62, 74],
    ]),
    F("4-3-3", [
      [50, 6],
      [14, 22],
      [38, 22],
      [62, 22],
      [86, 22],
      [28, 46],
      [50, 46],
      [72, 46],
      [20, 74],
      [50, 72],
      [80, 74],
    ]),
    F("3-5-2", [
      [50, 6],
      [26, 22],
      [50, 22],
      [74, 22],
      [10, 44],
      [30, 48],
      [50, 44],
      [70, 48],
      [90, 44],
      [38, 74],
      [62, 74],
    ]),
    F("4-2-3-1", [
      [50, 6],
      [14, 22],
      [38, 22],
      [62, 22],
      [86, 22],
      [34, 40],
      [66, 40],
      [18, 60],
      [50, 60],
      [82, 60],
      [50, 80],
    ]),
    F("5-3-2", [
      [50, 6],
      [10, 22],
      [30, 22],
      [50, 22],
      [70, 22],
      [90, 22],
      [28, 48],
      [50, 48],
      [72, 48],
      [38, 74],
      [62, 74],
    ]),
  ],
};

// ---- Persistence layer ----
const STORAGE_PREFIX = "fc.v1.";
const listeners = {};
const storageCache = new Map();

// Poné en true para que la app arranque LIMPIA (borra todo lo guardado en localStorage).
// Volvé a false para volver a persistir entre recargas.
// (Para override local sin tocar el repo, ver src/local-config.js — gitignored.)
if (typeof window.RESET_ON_BOOT === "undefined") window.RESET_ON_BOOT = false;
if (window.RESET_ON_BOOT) {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key);
    }
    console.info("[futbolClub] RESET_ON_BOOT activo — datos locales borrados.");
  } catch (_) {}
}

window.db = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      const cached = storageCache.get(key);
      if (raw == null) return cached?.value ?? fallback;
      if (cached?.raw === raw) return cached.value;
      const value = JSON.parse(raw);
      storageCache.set(key, { raw, value });
      return value;
    } catch (_) {
      return storageCache.get(key)?.value ?? fallback;
    }
  },
  save(key, value) {
    const raw = JSON.stringify(value);
    try {
      localStorage.setItem(STORAGE_PREFIX + key, raw);
      storageCache.set(key, { raw, value });
    } catch (error) {
      // Mantener la sesión utilizable aunque el navegador bloquee o llene localStorage.
      storageCache.set(key, { raw, value });
      window.dispatchEvent(
        new CustomEvent("fc:storage-error", { detail: { key, error } }),
      );
    }
    (listeners[key] || new Set()).forEach((fn) => {
      try {
        fn(value);
      } catch (_) {}
    });
    window.dispatchEvent(
      new CustomEvent("fc:data-changed", {
        detail: { key, operation: "save" },
      }),
    );
  },
  remove(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (_) {}
    storageCache.delete(key);
    (listeners[key] || new Set()).forEach((fn) => {
      try {
        fn(undefined);
      } catch (_) {}
    });
    window.dispatchEvent(
      new CustomEvent("fc:data-changed", {
        detail: { key, operation: "remove" },
      }),
    );
  },
  keys() {
    const result = new Set(storageCache.keys());
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX))
          result.add(key.slice(STORAGE_PREFIX.length));
      }
    } catch (_) {}
    return [...result].sort();
  },
  subscribe(key, fn) {
    if (!listeners[key]) listeners[key] = new Set();
    listeners[key].add(fn);
    return () => listeners[key].delete(fn);
  },
};

window.addEventListener("storage", (event) => {
  if (!event.key?.startsWith(STORAGE_PREFIX)) return;
  const key = event.key.slice(STORAGE_PREFIX.length);
  storageCache.delete(key);
  const next = window.db.load(key, undefined);
  (listeners[key] || new Set()).forEach((fn) => {
    try {
      fn(next);
    } catch (_) {}
  });
});

window.useStore = function (key, initial) {
  const initialRef = React.useRef();
  if (!initialRef.current) {
    initialRef.current = {
      value: typeof initial === "function" ? initial() : initial,
    };
  }
  const subscribe = React.useCallback(
    (fn) => window.db.subscribe(key, fn),
    [key],
  );
  const getSnapshot = React.useCallback(
    () => window.db.load(key, initialRef.current.value),
    [key],
  );
  const v = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const set = React.useCallback(
    (updater) => {
      const prev = window.db.load(key, initialRef.current.value);
      const next = typeof updater === "function" ? updater(prev) : updater;
      window.db.save(key, next);
    },
    [key],
  );
  return [v, set];
};

window.useDialogAccessibility = function (open, onClose) {
  const ref = React.useRef(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  React.useEffect(() => {
    if (!open || !ref.current) return;
    const dialog = ref.current;
    const previous = document.activeElement;
    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    const focusable = () =>
      [...dialog.querySelectorAll(focusableSelector)].filter(
        (el) => !el.hidden && el.offsetParent !== null,
      );
    (focusable()[0] || dialog).focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open]);
  return ref;
};

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("[futbolClub] Error al renderizar una pantalla", error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="panel" role="alert" style={{ maxWidth: 620 }}>
        <div className="panel-title">No pudimos mostrar esta pantalla</div>
        <p style={{ color: "var(--fg-mute)", margin: "10px 0 16px" }}>
          Tus datos siguen guardados. Recargá la aplicación para volver a
          intentarlo.
        </p>
        <button className="btn primary" onClick={() => location.reload()}>
          Recargar aplicación
        </button>
      </section>
    );
  }
}

window.mountPage = function (elementId, content) {
  const target = document.getElementById(elementId);
  if (!target) throw new Error(`No existe el contenedor #${elementId}`);
  ReactDOM.createRoot(target).render(
    <PageErrorBoundary>{content}</PageErrorBoundary>,
  );
};

// ---- Default Roster (nombres rioplatenses, sin marcas) ----
window.DEFAULT_ROSTER = [
  { id: 1, name: "Martín", num: 10, pos: "MED", photo: null },
  { id: 2, name: "Nahuel", num: 1, pos: "ARQ", photo: null },
  { id: 3, name: "Facu", num: 4, pos: "DEF", photo: null },
  { id: 4, name: "Tomi", num: 5, pos: "MED", photo: null },
  { id: 5, name: "Seba", num: 7, pos: "DEL", photo: null },
  { id: 6, name: "Juampi", num: 9, pos: "DEL", photo: null },
  { id: 7, name: "Lucho", num: 8, pos: "MED", photo: null },
  { id: 8, name: "Agus", num: 3, pos: "DEF", photo: null },
  { id: 9, name: "Pato", num: 2, pos: "DEF", photo: null },
  { id: 10, name: "Dieguito", num: 11, pos: "DEL", photo: null },
  { id: 11, name: "Rama", num: 6, pos: "DEF", photo: null },
  { id: 12, name: "Joaco", num: 14, pos: "MED", photo: null },
  { id: 13, name: "Fede", num: 17, pos: "DEL", photo: null },
  { id: 14, name: "Ema", num: 22, pos: "MED", photo: null },
  { id: 15, name: "Cami", num: 20, pos: "DEF", photo: null },
  { id: 16, name: "Brian", num: 13, pos: "MED", photo: null },
  { id: 17, name: "Iván", num: 19, pos: "DEL", photo: null },
  { id: 18, name: "Gonza", num: 21, pos: "DEF", photo: null },
  { id: 19, name: "Rodri", num: 16, pos: "MED", photo: null },
  { id: 20, name: "Lauti", num: 23, pos: "DEL", photo: null },
];

// Default saved teams
window.DEFAULT_SAVED_TEAMS = [
  {
    id: "t1",
    name: "Los Pibes del Viernes",
    mode: 7,
    formation: "2-3-1",
    formIdx: 0,
    kit: "solid",
    color: "#e11d48",
    secondary: "#0f172a",
    lastPlayed: "hace 3 días",
    players: 12,
  },
  {
    id: "t2",
    name: "La Banda del Asado",
    mode: 5,
    formation: "1-2-1",
    formIdx: 0,
    kit: "stripes",
    color: "#1e40af",
    secondary: "#ffffff",
    lastPlayed: "la semana pasada",
    players: 8,
  },
  {
    id: "t3",
    name: "FC Sobremesa",
    mode: 11,
    formation: "4-3-3",
    formIdx: 1,
    kit: "sash",
    color: "#0f172a",
    secondary: "#dc2626",
    lastPlayed: "hace 1 mes",
    players: 16,
  },
  {
    id: "t4",
    name: "Canchita Palermo",
    mode: 8,
    formation: "3-3-1",
    formIdx: 0,
    kit: "halves",
    color: "#16a34a",
    secondary: "#0f172a",
    lastPlayed: "ayer",
    players: 11,
  },
];

// Legacy read-through accessors — always return latest persisted value
Object.defineProperty(window, "ROSTER", {
  configurable: true,
  get() {
    return window.db.load("roster", window.DEFAULT_ROSTER);
  },
});
Object.defineProperty(window, "SAVED_TEAMS", {
  configurable: true,
  get() {
    return window.db.load("teams", window.DEFAULT_SAVED_TEAMS);
  },
});

// deterministic pseudo-color from name (for avatar bg)
window.colorFor = function (seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `oklch(0.55 0.12 ${hue})`;
};

// Color de texto legible (blanco o negro) según qué tan clara sea una camiseta.
// hex-only (los kits guardan colores en hex); si no puede parsear, asume blanco.
window.contrastText = function (hex) {
  if (typeof hex !== "string" || hex[0] !== "#") return "#ffffff";
  let h = hex.slice(1);
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length !== 6) return "#ffffff";
  const r = parseInt(h.slice(0, 2), 16),
    g = parseInt(h.slice(2, 4), 16),
    b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return "#ffffff";
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#12181a" : "#ffffff";
};

// Igual que contrastText, pero pensado para texto que puede caer sobre un
// diseño con dos colores (rayas, mitades, banda) — promedia la luminancia de
// ambos en vez de mirar solo el primario, para no quedar blanco-sobre-blanco
// (o negro-sobre-negro) en la franja del color secundario.
window.contrastTextMixed = function (primary, secondary, design) {
  if (!design || design === "solid") return window.contrastText(primary);
  const luminanceOf = (hex) => {
    if (typeof hex !== "string" || hex[0] !== "#") return 1;
    let h = hex.slice(1);
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    if (h.length !== 6) return 1;
    const r = parseInt(h.slice(0, 2), 16),
      g = parseInt(h.slice(2, 4), 16),
      b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return 1;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const avg = (luminanceOf(primary) + luminanceOf(secondary)) / 2;
  return avg > 0.6 ? "#12181a" : "#ffffff";
};

window.initials = function (name) {
  if (!name) return "??";
  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// File → dataURL (resized) for photo upload
window.fileToDataURL = function (file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!(file instanceof Blob) || !allowedTypes.has(file.type)) {
      reject(new Error("Usá una imagen JPG, PNG o WebP"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("La imagen no puede superar 8 MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!img.width || !img.height || img.width * img.height > 40_000_000) {
          reject(new Error("La imagen es demasiado grande"));
          return;
        }
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("El navegador no pudo procesar la imagen"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper: generate a new player id
window.nextPlayerId = function (roster) {
  return (roster.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
};

// Helper: pretty relative-date for saved teams
window.relDate = function (iso) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d < 1) return "hoy";
    if (d < 2) return "ayer";
    if (d < 7) return `hace ${d} días`;
    if (d < 30) return `hace ${Math.floor(d / 7)} sem`;
    return `hace ${Math.floor(d / 30)} meses`;
  } catch (_) {
    return "";
  }
};

// ---- Product profiles, backup and share snapshots ----
window.FC_SCHEMA_VERSION = 2;
window.FC_BACKUP_MAX_BYTES = 5 * 1024 * 1024;
window.FC_SHARE_MAX_CHARS = 60000;
const FC_ALLOWED_DATA_KEYS = new Set([
  "profile",
  "roster",
  "teams",
  "editor",
  "draw",
  "currentKit",
  "currentKitAlt",
  "teamCrests",
  "customCrestNames",
  "rival",
  "matches",
  "matchInfo",
  "shareInclude",
  "trainingSessions",
  "attendance",
  "evaluations",
  "objectives",
  "competitions",
  "activeCompetitionId",
  "league",
  "lastBackupAt",
]);
window.DEFAULT_PROFILE = {
  experience: "friends",
  displayName: "",
  season: "",
  onboardingDone: false,
};

window.exportFutbolClubData = function () {
  const data = {};
  for (const key of window.db.keys()) {
    if (FC_ALLOWED_DATA_KEYS.has(key)) data[key] = window.db.load(key, null);
  }
  return {
    app: "futbolClub",
    schemaVersion: window.FC_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
};

function validateJsonTree(value, state = { nodes: 0 }, depth = 0) {
  if (++state.nodes > 50000)
    throw new Error("El backup contiene demasiados datos");
  if (depth > 12)
    throw new Error("El backup tiene una estructura demasiado profunda");
  if (value == null || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new Error("El backup contiene números inválidos");
    return;
  }
  if (typeof value === "string") {
    if (value.length > 250000)
      throw new Error("El backup contiene un texto o imagen demasiado grande");
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 5000)
      throw new Error("El backup contiene listas demasiado grandes");
    value.forEach((item) => validateJsonTree(item, state, depth + 1));
    return;
  }
  if (typeof value !== "object")
    throw new Error("El backup contiene valores no admitidos");
  const entries = Object.entries(value);
  if (entries.length > 1000)
    throw new Error("El backup contiene objetos demasiado grandes");
  for (const [key, child] of entries) {
    if (key === "__proto__" || key === "prototype" || key === "constructor") {
      throw new Error("El backup contiene claves no admitidas");
    }
    validateJsonTree(child, state, depth + 1);
  }
}

window.validateFutbolClubData = function (payload) {
  if (
    !payload ||
    payload.app !== "futbolClub" ||
    !payload.data ||
    typeof payload.data !== "object" ||
    Array.isArray(payload.data)
  ) {
    throw new Error("El archivo no es un backup válido de futbolClub");
  }
  const version = Number(payload.schemaVersion || 1);
  if (
    !Number.isInteger(version) ||
    version < 1 ||
    version > window.FC_SCHEMA_VERSION
  ) {
    throw new Error("El backup usa una versión incompatible");
  }
  const validated = {};
  for (const [key, value] of Object.entries(payload.data)) {
    if (!FC_ALLOWED_DATA_KEYS.has(key)) continue;
    validateJsonTree(value);
    validated[key] = value;
  }
  if (!Object.keys(validated).length)
    throw new Error("El backup no contiene datos reconocidos");
  if (validated.roster && !Array.isArray(validated.roster))
    throw new Error("El plantel del backup no es válido");
  if (validated.roster?.length > 200)
    throw new Error("El backup supera el límite de 200 jugadores");
  if (validated.teams && !Array.isArray(validated.teams))
    throw new Error("Los equipos del backup no son válidos");
  if (validated.teams?.length > 200)
    throw new Error("El backup supera el límite de 200 equipos");
  if (validated.competitions && !Array.isArray(validated.competitions))
    throw new Error("Las competencias del backup no son válidas");
  if (validated.competitions?.length > 50)
    throw new Error("El backup supera el límite de 50 competencias");
  return { ...payload, schemaVersion: version, data: validated };
};

window.importFutbolClubData = function (payload, strategy = "replace") {
  if (JSON.stringify(payload).length > window.FC_BACKUP_MAX_BYTES)
    throw new Error("El backup no puede superar 5 MB");
  const validated = window.validateFutbolClubData(payload);
  if (!["replace", "merge"].includes(strategy))
    throw new Error("Estrategia de importación inválida");
  const previous = {};
  for (const key of window.db.keys()) previous[key] = window.db.load(key, null);
  try {
    if (strategy === "replace") {
      for (const key of window.db.keys()) window.db.remove(key);
    }
    for (const [key, value] of Object.entries(validated.data)) {
      window.db.save(key, value);
    }
  } catch (error) {
    for (const key of window.db.keys()) window.db.remove(key);
    for (const [key, value] of Object.entries(previous))
      window.db.save(key, value);
    throw new Error(
      `No se pudo importar; tus datos anteriores fueron restaurados. ${error.message || ""}`.trim(),
    );
  }
  return Object.keys(validated.data).length;
};

window.downloadJSON = function (value, filename) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

const utf8ToBase64Url = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};
const base64UrlToUtf8 = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(
    normalized + "=".repeat((4 - (normalized.length % 4)) % 4),
  );
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

window.encodeLineupSnapshot = function (snapshot) {
  const encoded = utf8ToBase64Url(JSON.stringify({ v: 1, ...snapshot }));
  if (encoded.length > window.FC_SHARE_MAX_CHARS)
    throw new Error(
      "La alineación es demasiado grande para compartirla como enlace",
    );
  return encoded;
};
window.decodeLineupSnapshot = function (encoded) {
  if (typeof encoded !== "string" || encoded.length > window.FC_SHARE_MAX_CHARS)
    throw new Error("El enlace compartido es demasiado grande");
  const snapshot = JSON.parse(base64UrlToUtf8(encoded));
  if (!snapshot || snapshot.v !== 1 || !snapshot.draft)
    throw new Error("Alineación compartida inválida");
  validateJsonTree(snapshot);
  const mode = Number(snapshot.draft.mode || 7);
  if (!window.FORMATIONS[mode])
    throw new Error("El modo compartido no es válido");
  if (
    snapshot.roster &&
    (!Array.isArray(snapshot.roster) || snapshot.roster.length > 100)
  )
    throw new Error("El plantel compartido no es válido");
  return snapshot;
};

window.fisherYates = function (items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
