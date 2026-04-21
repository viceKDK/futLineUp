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

      {showNumber && number !== undefined && (
        <text x="50" y="72" textAnchor="middle"
              fontFamily="'Bebas Neue', 'Archivo Narrow', sans-serif"
              fontSize="38" fill="rgba(255,255,255,.95)"
              style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.4)", strokeWidth: 1 }}>
          {number}
        </text>
      )}
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

window.KIT_DESIGNS = [
  { id: "solid",   label: "Lisa" },
  { id: "stripes", label: "Rayada" },
  { id: "sash",    label: "Banda" },
  { id: "halves",  label: "Mitades" },
];
