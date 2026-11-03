// Galería de avatares: pilotos y droides dibujados en SVG (sin imágenes externas).
// Cada avatar se identifica por un id corto que se guarda en el perfil del jugador.

export const AVATARS = [
  { id: 'nova', name: 'Nova', bg: '#0f2a3a', helmet: '#22e4ff', visor: '#ff3df0', shape: 'round', top: 'antenna' },
  { id: 'byte', name: 'Byte', bg: '#2a1036', helmet: '#ff3df0', visor: '#22e4ff', shape: 'square', top: 'ears' },
  { id: 'kraken', name: 'Kraken', bg: '#102a1a', helmet: '#a3ff3d', visor: '#0d1019', shape: 'round', top: 'fin' },
  { id: 'ember', name: 'Ember', bg: '#33180c', helmet: '#ff6b4a', visor: '#ffe066', shape: 'hex', top: 'none' },
  { id: 'glitch', name: 'Glitch', bg: '#1a1a2e', helmet: '#9d7bff', visor: '#a3ff3d', shape: 'square', top: 'antenna' },
  { id: 'aurora', name: 'Aurora', bg: '#0c2430', helmet: '#7fffd4', visor: '#ff3df0', shape: 'round', top: 'crown' },
  { id: 'vector', name: 'Vector', bg: '#2e2a10', helmet: '#ffb534', visor: '#22e4ff', shape: 'hex', top: 'fin' },
  { id: 'cipher', name: 'Cipher', bg: '#121624', helmet: '#d6dcff', visor: '#ff4767', shape: 'square', top: 'none' },
  { id: 'pulsar', name: 'Pulsar', bg: '#240c2a', helmet: '#ff9de2', visor: '#22e4ff', shape: 'round', top: 'ears' },
  { id: 'atlas', name: 'Atlas', bg: '#0e2018', helmet: '#3ddc97', visor: '#ffb534', shape: 'hex', top: 'antenna' },
  { id: 'rune', name: 'Rune', bg: '#20101a', helmet: '#f74c00', visor: '#d6dcff', shape: 'round', top: 'fin' },
  { id: 'quark', name: 'Quark', bg: '#101c34', helmet: '#5c9dff', visor: '#ffe066', shape: 'square', top: 'crown' },
  { id: 'spectra', name: 'Spectra', bg: '#1f1030', helmet: '#c792ea', visor: '#7fffd4', shape: 'hex', top: 'ears' },
  { id: 'bolt', name: 'Bolt', bg: '#2a2408', helmet: '#f7df1e', visor: '#0d1019', shape: 'round', top: 'antenna' },
  { id: 'echo', name: 'Echo', bg: '#0a2226', helmet: '#00add8', visor: '#ff3df0', shape: 'square', top: 'fin' },
  { id: 'onyx', name: 'Onyx', bg: '#16161c', helmet: '#7a83ad', visor: '#a3ff3d', shape: 'hex', top: 'crown' },
];

export const avatarById = (id) => AVATARS.find((a) => a.id === id) || AVATARS[0];

const shapePath = {
  round: 'M32 12c11 0 19 8 19 19v9c0 7-6 12-13 12H26c-7 0-13-5-13-12v-9c0-11 8-19 19-19z',
  square: 'M17 15h30a4 4 0 0 1 4 4v24a8 8 0 0 1-8 8H21a8 8 0 0 1-8-8V19a4 4 0 0 1 4-4z',
  hex: 'M32 11l18 9v20l-18 12-18-12V20z',
};

/** Avatar circular con casco, visor y adorno superior. */
export default function Avatar({ id, size = 40, ring = null, title }) {
  const a = avatarById(id);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title || `Avatar ${a.name}`} className="shrink-0">
      <defs>
        <radialGradient id={`av-bg-${a.id}`} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor={a.helmet} stopOpacity="0.35" />
          <stop offset="100%" stopColor={a.bg} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#av-bg-${a.id})`} stroke={ring || a.helmet} strokeWidth={ring ? 3 : 1.5} />
      {a.top === 'antenna' && (<><line x1="32" y1="12" x2="32" y2="4" stroke={a.helmet} strokeWidth="2" /><circle cx="32" cy="4" r="2.5" fill={a.visor} /></>)}
      {a.top === 'ears' && (<><path d="M16 22l-4-10 9 6z" fill={a.helmet} /><path d="M48 22l4-10-9 6z" fill={a.helmet} /></>)}
      {a.top === 'fin' && <path d="M28 12c2-6 6-8 8-8-1 4-1 6 0 9z" fill={a.helmet} />}
      {a.top === 'crown' && <path d="M22 14l4-6 6 5 6-5 4 6z" fill="#ffd34d" stroke="#b8860b" strokeWidth="0.8" />}
      <path d={shapePath[a.shape]} fill={a.helmet} opacity="0.92" />
      <path d={shapePath[a.shape]} fill="none" stroke="#05060a" strokeOpacity="0.35" strokeWidth="1.2" />
      <rect x="19" y="25" width="26" height="11" rx="5.5" fill="#05060a" />
      <rect x="21" y="27" width="22" height="7" rx="3.5" fill={a.visor} opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.55;0.9" dur="3.2s" repeatCount="indefinite" />
      </rect>
      <rect x="23" y="28" width="6" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="26" y="41" width="12" height="3" rx="1.5" fill="#05060a" opacity="0.45" />
    </svg>
  );
}

/** Rejilla para elegir avatar. */
export function AvatarPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8" role="radiogroup" aria-label="Elige tu avatar">
      {AVATARS.map((a) => {
        const active = a.id === value;
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(a.id)}
            className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-transform hover:-translate-y-0.5 ${active ? 'bg-white/5' : 'border-transparent'}`}
            style={active ? { borderColor: a.helmet, boxShadow: `0 0 16px -6px ${a.helmet}` } : {}}
          >
            <Avatar id={a.id} size={44} />
            <span className={`text-[10px] ${active ? 'text-white' : 'text-slate-500'}`}>{a.name}</span>
          </button>
        );
      })}
    </div>
  );
}
