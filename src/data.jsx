// Shared state + data for futbolClub

// ---- Formations per mode ----
// Coordinates are % of pitch: x left→right (0-100), y own-goal(0) → rival-goal(100)
// Arquero siempre en y≈6.
const F = (name, positions) => ({ name, positions });

window.FORMATIONS = {
  5: [
    F("1-2-1", [[50,8], [30,30],[70,30], [50,55], [50,78]]),
    F("1-1-2", [[50,8], [50,30], [50,52], [30,76],[70,76]]),
    F("Rombo", [[50,8], [50,28], [30,52],[70,52], [50,76]]),
  ],
  6: [
    F("2-1-2", [[50,8], [30,24],[70,24], [50,48], [30,72],[70,72]]),
    F("1-2-2", [[50,8], [50,24], [30,46],[70,46], [30,72],[70,72]]),
    F("1-3-1", [[50,8], [50,24], [25,50],[50,50],[75,50], [50,76]]),
  ],
  7: [
    F("2-3-1", [[50,8], [32,22],[68,22], [22,48],[50,48],[78,48], [50,76]]),
    F("3-2-1", [[50,8], [22,24],[50,24],[78,24], [35,50],[65,50], [50,76]]),
    F("2-1-2-1", [[50,8], [32,22],[68,22], [50,40], [30,60],[70,60], [50,78]]),
  ],
  8: [
    F("3-3-1", [[50,8], [22,22],[50,22],[78,22], [22,48],[50,48],[78,48], [50,76]]),
    F("2-3-2", [[50,8], [32,22],[68,22], [22,46],[50,46],[78,46], [35,72],[65,72]]),
    F("3-1-2-1", [[50,8], [22,22],[50,22],[78,22], [50,42], [32,62],[68,62], [50,80]]),
  ],
  11: [
    F("4-4-2", [
      [50,6],
      [14,22],[38,22],[62,22],[86,22],
      [14,48],[38,48],[62,48],[86,48],
      [38,74],[62,74]
    ]),
    F("4-3-3", [
      [50,6],
      [14,22],[38,22],[62,22],[86,22],
      [28,46],[50,46],[72,46],
      [20,74],[50,72],[80,74]
    ]),
    F("3-5-2", [
      [50,6],
      [26,22],[50,22],[74,22],
      [10,44],[30,48],[50,44],[70,48],[90,44],
      [38,74],[62,74]
    ]),
    F("4-2-3-1", [
      [50,6],
      [14,22],[38,22],[62,22],[86,22],
      [34,40],[66,40],
      [18,60],[50,60],[82,60],
      [50,80]
    ]),
    F("5-3-2", [
      [50,6],
      [10,22],[30,22],[50,22],[70,22],[90,22],
      [28,48],[50,48],[72,48],
      [38,74],[62,74]
    ]),
  ],
};

// ---- Persistence layer ----
const STORAGE_PREFIX = 'fc.v1.';
const listeners = {};

window.db = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (_) { return fallback; }
  },
  save(key, value) {
    try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch (_) {}
    (listeners[key] || new Set()).forEach(fn => { try { fn(value); } catch (_) {} });
  },
  subscribe(key, fn) {
    if (!listeners[key]) listeners[key] = new Set();
    listeners[key].add(fn);
    return () => listeners[key].delete(fn);
  }
};

window.useStore = function(key, initial) {
  const resolveInit = () => window.db.load(key, typeof initial === 'function' ? initial() : initial);
  const [v, setV] = React.useState(resolveInit);
  React.useEffect(() => window.db.subscribe(key, (next) => setV(next)), [key]);
  const set = React.useCallback((updater) => {
    setV(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      window.db.save(key, next);
      return next;
    });
  }, [key]);
  return [v, set];
};

// ---- Default Roster (nombres rioplatenses, sin marcas) ----
window.DEFAULT_ROSTER = [
  { id: 1,  name: "Martín",   num: 10, pos: "MED", photo: null },
  { id: 2,  name: "Nahuel",   num: 1,  pos: "ARQ", photo: null },
  { id: 3,  name: "Facu",     num: 4,  pos: "DEF", photo: null },
  { id: 4,  name: "Tomi",     num: 5,  pos: "MED", photo: null },
  { id: 5,  name: "Seba",     num: 7,  pos: "DEL", photo: null },
  { id: 6,  name: "Juampi",   num: 9,  pos: "DEL", photo: null },
  { id: 7,  name: "Lucho",    num: 8,  pos: "MED", photo: null },
  { id: 8,  name: "Agus",     num: 3,  pos: "DEF", photo: null },
  { id: 9,  name: "Pato",     num: 2,  pos: "DEF", photo: null },
  { id: 10, name: "Dieguito", num: 11, pos: "DEL", photo: null },
  { id: 11, name: "Rama",     num: 6,  pos: "DEF", photo: null },
  { id: 12, name: "Joaco",    num: 14, pos: "MED", photo: null },
  { id: 13, name: "Fede",     num: 17, pos: "DEL", photo: null },
  { id: 14, name: "Ema",      num: 22, pos: "MED", photo: null },
  { id: 15, name: "Cami",     num: 20, pos: "DEF", photo: null },
  { id: 16, name: "Brian",    num: 13, pos: "MED", photo: null },
  { id: 17, name: "Iván",     num: 19, pos: "DEL", photo: null },
  { id: 18, name: "Gonza",    num: 21, pos: "DEF", photo: null },
  { id: 19, name: "Rodri",    num: 16, pos: "MED", photo: null },
  { id: 20, name: "Lauti",    num: 23, pos: "DEL", photo: null },
];

// Default saved teams
window.DEFAULT_SAVED_TEAMS = [
  { id: "t1", name: "Los Pibes del Viernes",   mode: 7,  formation: "2-3-1", formIdx: 0, kit: "solid",   color: "#e11d48", secondary: "#0f172a", lastPlayed: "hace 3 días", players: 12 },
  { id: "t2", name: "La Banda del Asado",      mode: 5,  formation: "1-2-1", formIdx: 0, kit: "stripes", color: "#1e40af", secondary: "#ffffff", lastPlayed: "la semana pasada", players: 8 },
  { id: "t3", name: "FC Sobremesa",            mode: 11, formation: "4-3-3", formIdx: 1, kit: "sash",    color: "#0f172a", secondary: "#dc2626", lastPlayed: "hace 1 mes", players: 16 },
  { id: "t4", name: "Canchita Palermo",        mode: 8,  formation: "3-3-1", formIdx: 0, kit: "halves",  color: "#16a34a", secondary: "#0f172a", lastPlayed: "ayer", players: 11 },
];

// Legacy read-through accessors — always return latest persisted value
Object.defineProperty(window, 'ROSTER', {
  configurable: true,
  get() { return window.db.load('roster', window.DEFAULT_ROSTER); }
});
Object.defineProperty(window, 'SAVED_TEAMS', {
  configurable: true,
  get() { return window.db.load('teams', window.DEFAULT_SAVED_TEAMS); }
});

// deterministic pseudo-color from name (for avatar bg)
window.colorFor = function(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `oklch(0.55 0.12 ${hue})`;
};

window.initials = function(name) {
  if (!name) return "??";
  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// File → dataURL (resized) for photo upload
window.fileToDataURL = function(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper: generate a new player id
window.nextPlayerId = function(roster) {
  return (roster.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
};

// Helper: pretty relative-date for saved teams
window.relDate = function(iso) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d < 1) return 'hoy';
    if (d < 2) return 'ayer';
    if (d < 7) return `hace ${d} días`;
    if (d < 30) return `hace ${Math.floor(d/7)} sem`;
    return `hace ${Math.floor(d/30)} meses`;
  } catch (_) { return ''; }
};
