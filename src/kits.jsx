// Camisetas SVG — 4 diseños: sólida, rayas verticales, banda diagonal, mitades
// Cada kit acepta {primary, secondary, number, size}

function Kit({ design = "solid", primary = "#e11d48", secondary = "#0f172a", number, name, size = 72, showNumber = true }) {
  const w = size, h = size * 1.05;
  const id = React.useId().replace(/:/g,'');
  return (
    <svg width={w} height={h} viewBox="0 0 100 105" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={`clip-${id}`}>
          {/* Camiseta shape */}
          <path d="M20,10 L35,4 C40,12 60,12 65,4 L80,10 L95,22 L82,38 L78,32 L78,95 C78,97 76,99 74,99 L26,99 C24,99 22,97 22,95 L22,32 L18,38 L5,22 Z" />
        </clipPath>
        <linearGradient id={`shade-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,.08)"/>
          <stop offset="1" stopColor="rgba(0,0,0,.15)"/>
        </linearGradient>
      </defs>

      <g clipPath={`url(#clip-${id})`}>
        <rect x="0" y="0" width="100" height="105" fill={primary}/>

        {design === "stripes" && (
          <g>
            {[0,1,2,3,4,5].map(i => (
              <rect key={i} x={i * 18} y="0" width="9" height="105" fill={secondary} opacity=".95"/>
            ))}
          </g>
        )}

        {design === "sash" && (
          <polygon points="-5,40 60,-5 105,25 25,95" fill={secondary}/>
        )}

        {design === "halves" && (
          <rect x="50" y="0" width="55" height="105" fill={secondary}/>
        )}

        {design === "hoops" && (
          <g>
            {[0,1,2,3].map(i => (
              <rect key={i} x="0" y={20 + i*22} width="100" height="11" fill={secondary}/>
            ))}
          </g>
        )}

        {/* subtle shading overlay */}
        <rect x="0" y="0" width="100" height="105" fill={`url(#shade-${id})`}/>
      </g>

      {/* Stitching / seams */}
      <path d="M20,10 L35,4 C40,12 60,12 65,4 L80,10 L95,22 L82,38"
            fill="none" stroke="rgba(0,0,0,.25)" strokeWidth=".6"/>
      <path d="M20,10 L5,22 L18,38"
            fill="none" stroke="rgba(0,0,0,.25)" strokeWidth=".6"/>
      <path d="M35,4 C40,12 60,12 65,4" fill="none" stroke="rgba(0,0,0,.3)" strokeWidth=".8"/>

      {/* Outline */}
      <path d="M20,10 L35,4 C40,12 60,12 65,4 L80,10 L95,22 L82,38 L78,32 L78,95 C78,97 76,99 74,99 L26,99 C24,99 22,97 22,95 L22,32 L18,38 L5,22 Z"
            fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1"/>

      {showNumber && number !== undefined && (() => {
        const light = window.contrastTextMixed(primary, secondary, design) === '#ffffff';
        return (
          <text x="50" y="72" textAnchor="middle"
                fontFamily="'Bebas Neue', 'Archivo Narrow', sans-serif"
                fontSize="38" fill={light ? "rgba(255,255,255,.95)" : "rgba(18,24,26,.95)"}
                style={{ paintOrder: "stroke", stroke: light ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.65)", strokeWidth: 1.6 }}>
            {number}
          </text>
        );
      })()}
      {name && (
        <text x="50" y="42" textAnchor="middle"
              fontFamily="'Archivo Narrow', sans-serif"
              fontWeight="700" fontSize="8" letterSpacing="1" fill="rgba(255,255,255,.9)">
          {name.toUpperCase()}
        </text>
      )}
    </svg>
  );
}

window.Kit = Kit;

// Escudo de equipo — opcional. photo='none' => no renderiza nada.
// photo=dataURL => imagen recortada dentro del contorno. Si no hay foto,
// se genera un escudo simple con los colores/diseño del equipo e iniciales.
const CREST_PATH = "M50,3 L92,15 C92,55 78,86 50,101 C22,86 8,55 8,15 Z";

function Crest({ name, design = "solid", primary = "#3b82f6", secondary = "#0f172a", photo, initials, size = 40 }) {
  const id = React.useId().replace(/:/g,'');
  if (photo === 'none') return null;
  const label = (initials && initials.trim()) ? initials.trim().toUpperCase().slice(0,4) : window.initials(name || "?");
  const labelSize = label.length > 2 ? 30 - (label.length - 2) * 5 : 30;

  return (
    <svg width={size} height={size * 1.06} viewBox="0 0 100 106" style={{ flex: "none" }}>
      <defs>
        <clipPath id={`crest-clip-${id}`}><path d={CREST_PATH} /></clipPath>
      </defs>
      <g clipPath={`url(#crest-clip-${id})`}>
        {photo ? (
          <image href={photo} x="0" y="0" width="100" height="106" preserveAspectRatio="xMidYMid slice"/>
        ) : (
          <>
            <rect x="0" y="0" width="100" height="106" fill={primary}/>
            {design === "stripes" && [0,1,2,3,4,5].map(i => (
              <rect key={i} x={i*18} y="0" width="9" height="106" fill={secondary} opacity=".95"/>
            ))}
            {design === "sash" && <polygon points="-5,42 60,-5 105,26 25,96" fill={secondary}/>}
            {design === "halves" && <rect x="50" y="0" width="55" height="106" fill={secondary}/>}
            <rect x="0" y="0" width="100" height="106" fill="rgba(0,0,0,.12)"/>
            <text x="50" y="62" textAnchor="middle" fontFamily="'Archivo Narrow', sans-serif"
                  fontWeight="700" fontSize={labelSize} fill={window.contrastTextMixed(primary, secondary, design)}
                  style={{ paintOrder: "stroke", stroke: window.contrastTextMixed(primary, secondary, design)==='#ffffff' ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.6)', strokeWidth: 1.2 }}>
              {label}
            </text>
          </>
        )}
      </g>
      <path d={CREST_PATH} fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="2"/>
    </svg>
  );
}
window.Crest = Crest;

window.KIT_DESIGNS = [
  { id: "solid",   label: "Lisa" },
  { id: "stripes", label: "Rayada" },
  { id: "sash",    label: "Banda" },
  { id: "halves",  label: "Mitades" },
];

window.KIT_COLOR_SWATCHES = ["#dc2626","#ea580c","#eab308","#16a34a","#06b6d4","#3b82f6","#8b5cf6","#ec4899","#ffffff","#0f172a"];

// Combinaciones de escudo prearmadas, listas para elegir sin tocar colores.
window.CREST_PRESETS = [
  { name: "Blaugrana",      design: "stripes", primary: "#1e3a8a", secondary: "#991b1b" },
  { name: "Real",           design: "solid",   primary: "#ffffff", secondary: "#1e3a8a" },
  { name: "Rojo y blanco",  design: "halves",  primary: "#dc2626", secondary: "#ffffff" },
  { name: "Azul y oro",     design: "sash",    primary: "#1e3a8a", secondary: "#eab308" },
  { name: "Verde bosque",   design: "solid",   primary: "#166534", secondary: "#fef3c7" },
  { name: "Celeste rayado", design: "stripes", primary: "#3b82f6", secondary: "#ffffff" },
  { name: "Granate",        design: "solid",   primary: "#7f1d1d", secondary: "#fbbf24" },
  { name: "Naranja y negro", design: "sash",   primary: "#0f172a", secondary: "#ea580c" },
  { name: "Violeta",        design: "halves",  primary: "#6d28d9", secondary: "#ffffff" },
  { name: "Negro y blanco", design: "stripes", primary: "#0f172a", secondary: "#ffffff" },
];
