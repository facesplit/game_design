import type { TileType } from '../../types/board'

// Hand-drawn tile illustrations (SVG, not cropped). Each tile has a unified frame
// and a unique scene that matches its mechanic. Designed to read at small sizes
// (~80–120px) but stay crisp at any zoom.
interface TileArtProps {
  type: TileType
  label: string
  className?: string
}

export function TileArt({ type, label, className }: TileArtProps) {
  const palette = TILE_PALETTES[type]
  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={`bg-${type}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.bgFrom} />
          <stop offset="100%" stopColor={palette.bgTo} />
        </linearGradient>
        <radialGradient id={`glow-${type}`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor={palette.glow} stopOpacity="0.85" />
          <stop offset="60%" stopColor={palette.glow} stopOpacity="0.15" />
          <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
        <filter id={`drop-${type}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="200" height="200" fill={`url(#bg-${type})`} />
      <rect x="0" y="0" width="200" height="200" fill={`url(#glow-${type})`} />

      {/* Decorative speed lines (anime-style) */}
      <g opacity="0.18" stroke={palette.line} strokeLinecap="round">
        <line x1="-10" y1="20" x2="40" y2="50" strokeWidth="3" />
        <line x1="180" y1="14" x2="220" y2="44" strokeWidth="2" />
        <line x1="-10" y1="60" x2="30" y2="84" strokeWidth="2" />
        <line x1="170" y1="44" x2="220" y2="74" strokeWidth="3" />
      </g>

      {/* Core illustration */}
      <g transform="translate(100 88)" filter={`url(#drop-${type})`}>
        <Scene type={type} />
      </g>

      {/* Label band */}
      <g>
        <rect x="6" y="146" width="188" height="46" rx="9" fill="rgba(0,0,0,0.55)" />
        <rect x="6" y="146" width="188" height="46" rx="9" fill="none" stroke={palette.label} strokeOpacity="0.45" />
        <text
          x="100"
          y="178"
          textAnchor="middle"
          fontFamily="'Segoe UI', system-ui, sans-serif"
          fontWeight="900"
          fontSize={label.length > 12 ? 18 : 22}
          fill="white"
          letterSpacing="1.2"
          style={{ textTransform: 'uppercase' }}
        >
          {label}
        </text>
      </g>

      {/* Outer frame */}
      <rect x="2" y="2" width="196" height="196" rx="14" fill="none" stroke={palette.frame} strokeOpacity="0.55" strokeWidth="2" />
      <rect x="6" y="6" width="188" height="188" rx="11" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
    </svg>
  )
}

const TILE_PALETTES: Record<TileType, {
  bgFrom: string; bgTo: string; glow: string; line: string; frame: string; label: string
}> = {
  'start': { bgFrom: '#fb923c', bgTo: '#7c2d12', glow: '#fde047', line: '#fed7aa', frame: '#fcd34d', label: '#fde68a' },
  'buy-pack': { bgFrom: '#1e3a8a', bgTo: '#0c0a1f', glow: '#60a5fa', line: '#bfdbfe', frame: '#3b82f6', label: '#bfdbfe' },
  'sell-cards': { bgFrom: '#b45309', bgTo: '#3f1d05', glow: '#fbbf24', line: '#fde68a', frame: '#fbbf24', label: '#fde68a' },
  'tax': { bgFrom: '#166534', bgTo: '#052e16', glow: '#86efac', line: '#bbf7d0', frame: '#22c55e', label: '#bbf7d0' },
  'raid-zone': { bgFrom: '#991b1b', bgTo: '#1f0606', glow: '#fca5a5', line: '#fecaca', frame: '#ef4444', label: '#fecaca' },
  'chance': { bgFrom: '#581c87', bgTo: '#1e0a3c', glow: '#d8b4fe', line: '#e9d5ff', frame: '#a855f7', label: '#e9d5ff' },
  'auction': { bgFrom: '#9d174d', bgTo: '#1f0815', glow: '#f9a8d4', line: '#fbcfe8', frame: '#ec4899', label: '#fbcfe8' },
  'black-market': { bgFrom: '#1e293b', bgTo: '#020617', glow: '#94a3b8', line: '#cbd5e1', frame: '#64748b', label: '#cbd5e1' },
  'insurance-office': { bgFrom: '#0e7490', bgTo: '#042430', glow: '#67e8f9', line: '#a5f3fc', frame: '#06b6d4', label: '#a5f3fc' },
  'parking': { bgFrom: '#581c87', bgTo: '#1e0a3c', glow: '#d8b4fe', line: '#e9d5ff', frame: '#a855f7', label: '#e9d5ff' },
}

function Scene({ type }: { type: TileType }) {
  switch (type) {
    case 'start':
      return (
        <g>
          {/* sun rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <rect
              key={angle}
              x="-3"
              y="-72"
              width="6"
              height="32"
              fill="#fcd34d"
              opacity="0.85"
              transform={`rotate(${angle})`}
            />
          ))}
          {/* checkered flag */}
          <g transform="translate(-32 -34)">
            <rect width="64" height="40" rx="3" fill="white" />
            <g fill="#1f1f1f">
              {Array.from({ length: 8 }).map((_, i) =>
                Array.from({ length: 5 }).map((_, j) =>
                  (i + j) % 2 === 0 ? <rect key={`${i}-${j}`} x={i * 8} y={j * 8} width="8" height="8" /> : null
                )
              )}
            </g>
            <rect x="-2" y="-4" width="3" height="56" fill="#7c2d12" rx="1" />
          </g>
        </g>
      )
    case 'buy-pack':
      return (
        <g>
          {/* booster envelope */}
          <g transform="rotate(-8)">
            <rect x="-36" y="-46" width="72" height="92" rx="6" fill="#1d4ed8" stroke="#dbeafe" strokeWidth="2" />
            <rect x="-36" y="-46" width="72" height="34" fill="#3b82f6" />
            <text x="0" y="-22" textAnchor="middle" fontFamily="'Segoe UI'" fontWeight="900" fontSize="14" fill="#bfdbfe">
              BOOSTER
            </text>
            <polygon points="-30,2 0,28 30,2" fill="#172554" stroke="#dbeafe" strokeWidth="1.5" opacity="0.55" />
            <circle cx="0" cy="14" r="6" fill="#fde047" />
          </g>
          {/* sparkles */}
          <g fill="#fde047">
            <polygon points="-50,-30 -47,-22 -39,-21 -45,-16 -43,-8 -50,-13 -57,-8 -55,-16 -61,-21 -53,-22" opacity="0.9" />
            <polygon points="48,30 50,36 56,37 51,40 53,46 48,42 43,46 45,40 40,37 46,36" opacity="0.9" />
          </g>
        </g>
      )
    case 'sell-cards':
      return (
        <g>
          {/* dollar sign */}
          <circle cx="0" cy="-6" r="36" fill="#f59e0b" stroke="#fde68a" strokeWidth="3" />
          <text
            x="0"
            y="9"
            textAnchor="middle"
            fontFamily="'Segoe UI'"
            fontWeight="900"
            fontSize="56"
            fill="#7c2d12"
          >
            $
          </text>
          {/* sparkle coins */}
          <g fill="#fbbf24" stroke="#92400e" strokeWidth="1.5">
            <ellipse cx="-44" cy="38" rx="14" ry="6" />
            <ellipse cx="44" cy="38" rx="14" ry="6" />
            <ellipse cx="0" cy="46" rx="18" ry="7" />
          </g>
        </g>
      )
    case 'tax':
      return (
        <g>
          {/* clipboard */}
          <rect x="-32" y="-44" width="64" height="78" rx="6" fill="#dcfce7" />
          <rect x="-22" y="-50" width="44" height="14" rx="3" fill="#166534" stroke="#bbf7d0" strokeWidth="1.5" />
          <line x1="-22" y1="-22" x2="22" y2="-22" stroke="#166534" strokeWidth="2" />
          <line x1="-22" y1="-8" x2="14" y2="-8" stroke="#166534" strokeWidth="2" />
          <line x1="-22" y1="6" x2="22" y2="6" stroke="#166534" strokeWidth="2" />
          <line x1="-22" y1="20" x2="6" y2="20" stroke="#166534" strokeWidth="2" />
          {/* coin stack */}
          <g transform="translate(0 50)">
            <ellipse cx="0" cy="0" rx="22" ry="6" fill="#fcd34d" stroke="#92400e" strokeWidth="1.5" />
            <ellipse cx="0" cy="-8" rx="22" ry="6" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
            <text x="0" y="-5" textAnchor="middle" fontFamily="'Segoe UI'" fontWeight="900" fontSize="11" fill="#7c2d12">$</text>
          </g>
        </g>
      )
    case 'raid-zone':
      return (
        <g>
          {/* crossed swords */}
          <g stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round">
            <line x1="-44" y1="-44" x2="44" y2="44" />
            <line x1="44" y1="-44" x2="-44" y2="44" />
          </g>
          <g fill="#9ca3af" stroke="#1f2937" strokeWidth="1.5">
            <rect x="-46" y="-48" width="10" height="22" rx="2" transform="rotate(-45 -41 -37)" />
            <rect x="36" y="-48" width="10" height="22" rx="2" transform="rotate(45 41 -37)" />
          </g>
          {/* skull */}
          <g transform="translate(0 -6)">
            <ellipse cx="0" cy="0" rx="22" ry="22" fill="#f8fafc" />
            <rect x="-12" y="14" width="24" height="14" rx="2" fill="#f8fafc" />
            <circle cx="-9" cy="-2" r="5" fill="#1f2937" />
            <circle cx="9" cy="-2" r="5" fill="#1f2937" />
            <polygon points="-2,8 2,8 0,18" fill="#1f2937" />
            <line x1="-6" y1="22" x2="-6" y2="28" stroke="#1f2937" strokeWidth="1.5" />
            <line x1="0" y1="22" x2="0" y2="28" stroke="#1f2937" strokeWidth="1.5" />
            <line x1="6" y1="22" x2="6" y2="28" stroke="#1f2937" strokeWidth="1.5" />
          </g>
        </g>
      )
    case 'chance':
    case 'parking':
      return (
        <g>
          {/* spinning ring */}
          <circle cx="0" cy="0" r="44" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="6 5" opacity="0.55" />
          <circle cx="0" cy="0" r="32" fill="#581c87" stroke="#d8b4fe" strokeWidth="2" />
          {/* big '?' */}
          <text x="0" y="14" textAnchor="middle" fontFamily="'Segoe UI'" fontWeight="900" fontSize="50" fill="#fde047">
            ?
          </text>
          {/* sparkles */}
          <g fill="#fde047">
            <polygon points="-50,-30 -47,-22 -39,-21 -45,-16 -43,-8 -50,-13 -57,-8 -55,-16 -61,-21 -53,-22" opacity="0.85" />
            <polygon points="50,28 52,34 58,35 53,38 55,44 50,40 45,44 47,38 42,35 48,34" opacity="0.85" />
          </g>
        </g>
      )
    case 'auction':
      return (
        <g>
          {/* gavel */}
          <g transform="rotate(-22)">
            <rect x="-14" y="-44" width="28" height="42" rx="4" fill="#92400e" stroke="#fbbf24" strokeWidth="2" />
            <rect x="-26" y="-30" width="52" height="14" rx="3" fill="#a16207" stroke="#fde68a" strokeWidth="1.5" />
            <rect x="-2" y="0" width="4" height="48" fill="#7c2d12" />
            <rect x="-12" y="42" width="24" height="6" rx="2" fill="#7c2d12" />
          </g>
          {/* impact stars */}
          <g fill="#fbbf24" opacity="0.95">
            <polygon points="40,-30 44,-18 56,-18 46,-10 50,2 40,-6 30,2 34,-10 24,-18 36,-18" />
          </g>
        </g>
      )
    case 'black-market':
      return (
        <g>
          {/* hooded figure silhouette */}
          <ellipse cx="0" cy="-6" rx="26" ry="34" fill="#0f172a" />
          <ellipse cx="0" cy="-6" rx="22" ry="30" fill="#1e293b" />
          <ellipse cx="0" cy="-2" rx="14" ry="18" fill="#020617" />
          <circle cx="-6" cy="-4" r="3" fill="#a855f7" />
          <circle cx="6" cy="-4" r="3" fill="#a855f7" />
          <path d="M -16 32 Q 0 46 16 32 L 14 50 L -14 50 Z" fill="#0f172a" />
          {/* coin */}
          <circle cx="32" cy="36" r="8" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" />
          <text x="32" y="40" textAnchor="middle" fontFamily="'Segoe UI'" fontWeight="900" fontSize="10" fill="#7c2d12">$</text>
        </g>
      )
    case 'insurance-office':
      return (
        <g>
          {/* shield */}
          <path
            d="M 0 -50 L 38 -34 L 38 6 Q 38 36 0 50 Q -38 36 -38 6 L -38 -34 Z"
            fill="#0e7490"
            stroke="#67e8f9"
            strokeWidth="3"
          />
          <path
            d="M 0 -36 L 24 -24 L 24 4 Q 24 26 0 36 Q -24 26 -24 4 L -24 -24 Z"
            fill="#155e75"
            stroke="#a5f3fc"
            strokeWidth="1.5"
          />
          {/* cross */}
          <rect x="-4" y="-22" width="8" height="40" rx="2" fill="#fff" />
          <rect x="-18" y="-8" width="36" height="8" rx="2" fill="#fff" />
        </g>
      )
  }
}
