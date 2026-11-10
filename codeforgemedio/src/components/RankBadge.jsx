import { RANKS } from '../core/progress.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** Insignia hexagonal del rango de ingeniero. */
export default function RankBadge({ rank, size = 44 }) {
  const color = rank.color;
  const idx = RANKS.findIndex((r) => r.name === rank.name);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-label={`Rango ${rank.name}`} role="img">
      <defs>
        <linearGradient id={`rb-${idx}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill={`url(#rb-${idx})`} stroke={color} strokeWidth="2" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <polygon points="24,9 38,17 38,31 24,39 10,31 10,17" fill="none" stroke={color} strokeOpacity="0.4" />
      <text x="24" y="28.5" textAnchor="middle" fontSize="12" fontWeight="800" fill={color} fontFamily="JetBrains Mono, monospace">{ROMAN[idx]}</text>
    </svg>
  );
}
