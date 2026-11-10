// Arte de la marca CodeForge en SVG: icono (capas adaptativas), splash y gráficos de Google Play.
const glow = (id, sd) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

/** Logotipo (triángulo de neón + núcleo + órbita) en un lienzo de 108×108 (unidades dp del icono adaptativo). */
export function mark({ mono = false } = {}) {
  if (mono) {
    return `<path d="M54 29 77 71H31z" fill="none" stroke="#fff" stroke-width="5.5" stroke-linejoin="round"/>
      <circle cx="54" cy="58" r="6.5" fill="#fff"/>
      <ellipse cx="54" cy="58" rx="27" ry="8" fill="none" stroke="#fff" stroke-width="2.2" transform="rotate(-18 54 58)"/>`;
  }
  return `<defs>${glow('g1', 2.2)}${glow('g2', 3)}
      <linearGradient id="tri" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ff3ff"/><stop offset="1" stop-color="#22e4ff"/></linearGradient></defs>
    <ellipse cx="54" cy="58" rx="27" ry="8" fill="none" stroke="#9d7bff" stroke-opacity="0.85" stroke-width="2" transform="rotate(-18 54 58)" filter="url(#g1)"/>
    <path d="M54 29 77 71H31z" fill="rgba(34,228,255,0.07)" stroke="url(#tri)" stroke-width="5" stroke-linejoin="round" filter="url(#g1)"/>
    <circle cx="54" cy="58" r="6.5" fill="#ff3df0" filter="url(#g2)"/>
    <circle cx="52" cy="56" r="2" fill="#ffd1fb"/>`;
}

/** Fondo del icono: negro profundo con rejilla y resplandor. */
export function background() {
  return `<defs><radialGradient id="rg" cx="50%" cy="48%" r="60%"><stop offset="0" stop-color="#22e4ff" stop-opacity="0.22"/><stop offset="0.55" stop-color="#9d7bff" stop-opacity="0.08"/><stop offset="1" stop-color="#05060a" stop-opacity="0"/></radialGradient>
    <pattern id="gr" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M9 0H0V9" fill="none" stroke="#22e4ff" stroke-opacity="0.09" stroke-width="0.5"/></pattern></defs>
    <rect width="108" height="108" fill="#070912"/><rect width="108" height="108" fill="url(#gr)"/><rect width="108" height="108" fill="url(#rg)"/>`;
}

export const svg = (w, h, inner, vb = '0 0 108 108') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${inner}</svg>`;
