// Shared SVG icon set (trazo 1.8, cabos redondeados) — reemplaza los emojis del producto.
window.ICON_PATHS = {
  // Sidebar / experiencias
  friends:  ['M12 3l7 2.5v5.5c0 4.6-3 7.9-7 10-4-2.1-7-5.4-7-10V5.5L12 3z'],
  newteam:  ['M12 3a9 9 0 100 18 9 9 0 000-18', 'M12 8v8M8 12h8'],
  editorNav:['M3 5h18v14H3V5', 'M12 5v14M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5'],
  shuffle:  ['M16 4h4v4M20 4l-6.2 6.2M4 20l5.2-5.2M16 20h4v-4M20 20l-6.2-6.2M4 4l5.2 5.2'],
  jersey:   ['M8 4l4 2 4-2 5 4-2.5 3L16 9.5V20H8V9.5L5.5 11 3 8l5-4z'],
  target:   ['M12 4a8 8 0 100 16 8 8 0 000-16', 'M12 9a3 3 0 100 6 3 3 0 000-6'],
  shareNodes:['M18 4a2.2 2.2 0 100 4.4A2.2 2.2 0 0018 4M6 9.8a2.2 2.2 0 100 4.4 2.2 2.2 0 000-4.4M18 15.6a2.2 2.2 0 100 4.4 2.2 2.2 0 000-4.4', 'M8 11l8-4.2M8 13l8 4.2'],
  vest:     ['M9 4.5a3 3 0 016 0H18a1 1 0 011 1V20a1 1 0 01-1 1H6a1 1 0 01-1-1V5.5a1 1 0 011-1h3z', 'M9 12h6M9 16h4'],
  trophy:   ['M8 4h8v6a4 4 0 01-8 0V4z', 'M8 5H5a3 3 0 003 4.5M16 5h3a3 3 0 01-3 4.5M12 14v4M8 20h8'],
  account:  ['M12 5a3.2 3.2 0 100 6.4A3.2 3.2 0 0012 5', 'M5.5 20a6.5 6.5 0 0113 0'],
  // Iconografía general (mapa 1g)
  lock:     ['M6 11h12v9H6v-9z', 'M9 11V8a3 3 0 016 0v3'],
  refresh:  ['M20 12a8 8 0 11-2.4-5.7M20 4v5h-5'],
  camera:   ['M4 8h4l2-3h4l2 3h4v12H4V8z', 'M12 11a3 3 0 100 6 3 3 0 000-6'],
  link:     ['M9 9h10v12H9V9z', 'M15 5H5v12'],
  download: ['M12 4v10M8 10l4 4 4-4M5 19h14'],
  upload:   ['M12 14V4M8 8l4-4 4 4M5 19h14'],
  send:     ['M21 3L10 14M21 3l-7 18-3-7-7-3 17-8z'],
  gear:     ['M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7', 'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1'],
  // Extras usados en los rediseños de gestión
  plus:     ['M12 5v14M5 12h14'],
  check:    ['M5 13l4 4L19 7'],
  chevronR: ['M9 6l6 6-6 6'],
  session:  ['M5 6h14v14H5V6zM5 10h14M9 4v4M15 4v4'],
  warning:  ['M12 4l9 16H3L12 4z', 'M12 10v4M12 17.5h.01'],
  trash:    ['M5 7h14M9 7V5h6v2M8 7l1 13h6l1-13'],
  shield:   ['M12 3l7 2.6v5.4c0 4.7-2.9 8.2-7 10-4.1-1.8-7-5.3-7-10V5.6L12 3z'],
  google:   ['M7 18a4.5 4.5 0 01-.6-9A6 6 0 0118 10.6 4 4 0 0117 18H7z'],
};

function Icon({ name, size = 16, strokeWidth = 1.8, style, className }) {
  const paths = window.ICON_PATHS[name];
  if (!paths) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ flex: 'none', display: 'block', ...style }} className={className}>
      {paths.map((d, i) => <path key={i} d={d}></path>)}
    </svg>
  );
}
window.Icon = Icon;

// Logo oficial de Google (4 colores) — para el botón "Continuar con Google",
// que debe verse igual al estándar de todas las webs, no el ícono genérico de Icon.
function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flex: 'none', display: 'block' }}>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.1 17.7 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.8-9.8 6.8-17.4z"/>
      <path fill="#FBBC05" d="M10.5 19.3A14.5 14.5 0 009.8 24c0 1.7.3 3.3.7 4.7l-7.9 6.1A24 24 0 010 24c0-3.9.9-7.5 2.6-10.8l7.9 6.1z"/>
      <path fill="#34A853" d="M24 48c6.4 0 11.8-2.1 15.7-5.7l-7.3-5.7c-2 1.4-4.7 2.3-8.4 2.3-6.3 0-11.6-3.6-13.5-8.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
    </svg>
  );
}
window.GoogleG = GoogleG;
