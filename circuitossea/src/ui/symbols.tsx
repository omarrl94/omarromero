/** Símbolos del esquema con aspecto «vivo»: brillos, giro, humo, estados de avería. */
import type { Component } from '../model/types';
import type { Live } from '../model/netlist';

interface P { c: Component; live?: Live }
const LED_HUE = ['#ff3b30', '#2ecc71', '#3b82f6', '#ffd60a'];

export function Symbol({ c, live }: P) {
  const sw = { stroke: 'var(--ink)', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const par = c.params;
  const dead = live?.state; // 'blown' | 'tripped' | 'burnt'
  const p = live?.p ?? 0;
  const lead = <path d="M-40 0H-26M26 0H40" />;

  switch (c.type) {
    case 'battery':
      return (
        <g {...sw}>
          <path d="M-40 0H-8M8 0H40" />
          <path d="M-8 -16V16" strokeWidth={3.5} /><path d="M8 -9V9" strokeWidth={3.5} />
          <path d="M-8 -16V16M8 -9V9" stroke="var(--terracota)" strokeWidth={1} opacity={0.6} />
          <text x={-34} y={-8} fontSize={13} fill="var(--ink)" stroke="none" fontWeight={700}>+</text>
          <text x={26} y={-8} fontSize={13} fill="var(--ink)" stroke="none" fontWeight={700}>−</text>
        </g>
      );
    case 'acsource':
      return (<g {...sw}><path d="M-40 0H-18M18 0H40" /><circle r={18} fill="var(--fill-b)" /><path d="M-10 0q5 -12 10 0t10 0" strokeWidth={2.5} stroke="var(--accent)" />
        <text x={-34} y={-8} fontSize={9} fill="var(--ink)" stroke="none">L</text><text x={26} y={-8} fontSize={9} fill="var(--ink)" stroke="none">N</text></g>);
    case 'isource':
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle r={16} fill="var(--fill-b)" /><path d="M-8 0H8M3 -5L8 0L3 5" /></g>);
    case 'resistor': {
      const hot = p > Number(par.pmax);
      return (<g {...sw}>{lead}<rect x={-26} y={-8} width={52} height={16} fill={hot ? 'var(--err)' : 'var(--fill-a)'} className={hot ? 'pulse' : ''} /></g>);
    }
    case 'pot': {
      const x = (Number(par.pos) - 0.5) * 48;
      return (<g {...sw}>{lead}<rect x={-26} y={-8} width={52} height={16} fill="var(--fill-a)" />
        <path d={`M0 20V14`} /><path d={`M${x} 20V10`} transform="" strokeWidth={0} />
        <path d={`M${x} 22V9M${x - 4} 14L${x} 9L${x + 4} 14`} stroke="var(--accent)" strokeWidth={2.5} />
        <path d={`M0 20H${x}`} stroke="var(--accent)" /></g>);
    }
    case 'capacitor':
      return (<g {...sw}><path d="M-40 0H-6M6 0H40" /><path d="M-6 -16V16M6 -16V16" strokeWidth={3.5} />
        <rect x={-6} y={-16} width={12} height={32} fill="var(--fill-b)" stroke="none" opacity={0.7} /></g>);
    case 'inductor':
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" /><path d="M-26 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0a6.5 8 0 0 1 13 0" /></g>);
    case 'ntc': case 'ptc':
      return (<g {...sw}>{lead}<rect x={-26} y={-8} width={52} height={16} fill="var(--fill-a)" />
        <path d={c.type === 'ntc' ? 'M-30 14L-16 14L22 -14' : 'M-30 14L8 14L22 -14'} stroke="var(--accent)" />
        <text x={-8} y={-12} fontSize={9} fill="var(--ink)" stroke="none">{c.type === 'ntc' ? 't° −' : 't° +'}</text></g>);
    case 'ldr': {
      const lux = Math.min(1, Number(par.lux) / 1000);
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" /><circle r={18} fill="var(--fill-a)" /><rect x={-14} y={-6} width={28} height={12} fill="var(--panel)" />
        <g stroke="var(--mostaza)" strokeWidth={2.5} opacity={0.35 + 0.65 * lux}><path d="M-26 -22L-14 -12M-18 -26L-6 -16" /><path d="M-14 -12l-1 -5M-14 -12l5 1M-6 -16l-1 -5M-6 -16l5 1" /></g></g>);
    }
    case 'diode':
      return (<g {...sw}><path d="M-40 0H-12M12 0H40" /><path d="M-12 -14L12 0L-12 14Z" fill={live?.on ? 'var(--mostaza)' : 'var(--fill-a)'} /><path d="M12 -14V14" strokeWidth={3} /></g>);
    case 'zener':
      return (<g {...sw}><path d="M-40 0H-12M12 0H40" /><path d="M-12 -14L12 0L-12 14Z" fill={live?.on || p > 0.01 ? 'var(--salvia)' : 'var(--fill-a)'} /><path d="M7 -14H12V14H17" strokeWidth={3} /></g>);
    case 'led': {
      const hue = LED_HUE[Number(par.color)] ?? LED_HUE[0];
      const imax = Number(par.imax) / 1000;
      const k = live?.on && !dead ? Math.min(1, Math.abs(live.i) / (imax * 0.6)) : 0;
      return (<g {...sw}>
        {k > 0.01 && <circle cx={0} cy={-6} r={18 + 14 * k} fill={hue} opacity={0.15 + 0.5 * k} style={{ filter: 'blur(7px)' }} stroke="none" />}
        <path d="M-40 0H-12M12 0H40" />
        <path d="M-12 -14L12 0L-12 14Z" fill={dead ? '#444' : k > 0.01 ? hue : 'var(--fill-a)'} />
        <path d="M12 -14V14" strokeWidth={3} />
        <path d="M2 -16L12 -28M10 -12L20 -24M12 -28l-6 1M12 -28l-1 6M20 -24l-6 1M20 -24l-1 6" stroke={hue} strokeWidth={1.6} />
        {dead && <path d="M-9 -9L9 9M-9 9L9 -9" stroke="var(--err)" strokeWidth={3} />}
      </g>);
    }
    case 'switch': {
      const closed = Boolean(par.closed);
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle cx={-16} r={3} fill="var(--ink)" /><circle cx={16} r={3} fill="var(--ink)" />
        <path d={closed ? 'M-16 0L16 0' : 'M-16 0L10 -17'} strokeWidth={3.5} stroke={closed ? 'var(--accent)' : 'var(--ink)'} style={{ transition: 'all .15s' }} /></g>);
    }
    case 'pushNO': case 'pushNC': {
      const pressed = Boolean(par.pressed);
      const closed = c.type === 'pushNO' ? pressed : !pressed;
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle cx={-16} r={3} fill="var(--ink)" /><circle cx={16} r={3} fill="var(--ink)" />
        <path d={closed ? 'M-16 0L16 0' : 'M-16 0L12 -12'} strokeWidth={3} stroke={closed ? 'var(--accent)' : 'var(--ink)'} />
        <path d={`M0 ${pressed ? -6 : -16}V-6`} strokeDasharray="3 3" />
        <rect x={-9} y={pressed ? -14 : -24} width={18} height={8} rx={3} fill={pressed ? 'var(--terracota)' : 'var(--fill-a)'} />
        {c.type === 'pushNC' && <path d="M-6 -6L6 6" strokeWidth={0} />}</g>);
    }
    case 'spdt': {
      const up = Number(par.pos) < 0.5;
      return (<g {...sw}><path d="M-40 0H-16M16 -20H40M16 20H40" /><circle cx={-16} r={3} fill="var(--ink)" /><circle cx={16} cy={-20} r={3} fill="var(--ink)" /><circle cx={16} cy={20} r={3} fill="var(--ink)" />
        <path d={up ? 'M-16 0L16 -20' : 'M-16 0L16 20'} strokeWidth={3.5} stroke="var(--accent)" style={{ transition: 'all .15s' }} /></g>);
    }
    case 'fuse':
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" /><rect x={-26} y={-9} width={52} height={18} rx={3} fill="var(--fill-a)" />
        {dead ? (<><path d="M-26 0H-6M6 0H26" stroke="var(--err)" /><path d="M-6 0L-2 -6L2 6L6 0" stroke="var(--err)" opacity={0.5} />
          {[0, 1, 2].map((k) => <circle key={k} cx={-6 + 6 * k} cy={-10} r={4} className="smoke" style={{ animationDelay: `${k * 0.5}s` }} />)}</>) : <path d="M-26 0H26" strokeWidth={1.6} />}</g>);
    case 'breaker':
      return (<g {...sw}><path d="M-40 0H-20M20 0H40" /><rect x={-20} y={-20} width={40} height={40} rx={4} fill="var(--fill-b)" />
        <circle cx={-10} cy={6} r={2.5} fill="var(--ink)" /><circle cx={10} cy={6} r={2.5} fill="var(--ink)" />
        <path d={dead ? 'M-10 6L8 -2' : 'M-10 6L10 6'} strokeWidth={3} stroke={dead ? 'var(--err)' : 'var(--accent)'} />
        <path d="M-8 -12L-2 -6M-2 -12L-8 -6" strokeWidth={1.4} /><text x={4} y={-8} fontSize={8} fill="var(--ink)" stroke="none">{dead ? 'OFF' : 'ON'}</text></g>);
    case 'lamp': {
      const pn = Number(par.pn);
      const k = dead ? 0 : Math.min(1.2, p / pn);
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" />
        {k > 0.02 && <circle r={18 + 14 * Math.min(1, k)} fill="var(--lamp)" opacity={Math.min(0.9, 0.2 + k * 0.7)} style={{ filter: 'blur(7px)' }} stroke="none" />}
        <circle r={16} fill={dead ? '#4a4540' : k > 0.02 ? 'var(--lamp)' : 'var(--fill-a)'} fillOpacity={k > 0.02 ? 0.35 + 0.6 * Math.min(1, k) : 1} />
        <path d="M-11 -11L11 11M-11 11L11 -11" stroke={dead ? 'var(--err)' : 'var(--ink)'} /></g>);
    }
    case 'heater': {
      const k = Math.min(1, p / Number(par.pn));
      return (<g {...sw}><path d="M-40 0H-26M26 0H40" />
        {k > 0.02 && <rect x={-30} y={-18} width={60} height={36} rx={8} fill="#ff5a1f" opacity={0.15 + 0.5 * k} style={{ filter: 'blur(6px)' }} stroke="none" />}
        <rect x={-26} y={-14} width={52} height={28} rx={3} fill={k > 0.02 ? `color-mix(in srgb, #ff5a1f ${Math.round(100 * k)}%, var(--fill-a))` : 'var(--fill-a)'} />
        <path d="M-20 8L-14 -8L-6 8L2 -8L10 8L16 -8" /></g>);
    }
    case 'buzzer': {
      const on = !dead && p > 0.2 * Number(par.pn);
      return (<g {...sw}><path d="M-40 0H-16M16 0H40" /><circle r={16} fill={on ? 'var(--mostaza)' : 'var(--fill-a)'} />
        <path d="M-6 -5H-2L5 -10V10L-2 5H-6Z" fill="var(--ink)" />
        {on && [0, 1].map((k) => <path key={k} d={`M${10 + 5 * k} -6Q${14 + 5 * k} 0 ${10 + 5 * k} 6`} className="wave" style={{ animationDelay: `${k * 0.25}s` }} />)}</g>);
    }
    case 'motor': {
      const k = Math.min(1.5, Math.abs(live?.v ?? 0) / Number(par.vn));
      const dir = (live?.i ?? 0) >= 0 ? 'normal' : 'reverse';
      return (<g {...sw}><path d="M-40 0H-22M22 0H40" /><circle r={22} fill="var(--fill-b)" />
        <g className={k > 0.03 ? 'spin' : ''} style={{ animationDuration: `${Math.max(0.15, 1.6 / Math.max(0.05, k))}s`, animationDirection: dir }}>
          <path d="M0 -16V16M-16 0H16" strokeWidth={2.5} stroke="var(--accent)" /><circle r={3} fill="var(--ink)" /></g>
        <circle r={22} fill="none" /><text x={-6} y={-24} fontSize={11} fill="var(--ink)" stroke="none" fontWeight={700} transform="">M</text></g>);
    }
    case 'ground':
      return (<g {...sw}><path d="M0 -20V0M-14 0H14M-9 6H9M-4 12H4" /></g>);
    case 'junction':
      return <circle r={4.5} fill="var(--ink)" />;
    default:
      return <rect x={-20} y={-10} width={40} height={20} {...sw} />;
  }
}
