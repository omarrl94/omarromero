import { useState } from 'react';
import { formatDay } from '../utils/format';
import { clampExpiry, fromDateInput, maxExpiry, RETENTION_PRESETS, toDateInput } from '../utils/retention';

/**
 * Elige cuándo se borra la sala y todo su contenido.
 * value: fecha de borrado en ms · onChange(ms)
 */
export default function RetentionPicker({ id, value, onChange }) {
  const [mode, setMode] = useState(() => {
    const now = Date.now();
    return RETENTION_PRESETS.find((p) => Math.abs(p.at(now) - value) < 60000)?.id ?? 'fecha';
  });
  const now = Date.now();

  const pick = (next) => {
    setMode(next);
    const preset = RETENTION_PRESETS.find((p) => p.id === next);
    if (preset) onChange(clampExpiry(preset.at(Date.now())));
  };

  return (
    <div>
      <label className="label" htmlFor={id}>Borrar la sala y su contenido</label>
      <select id={id} className="input" value={mode} onChange={(e) => pick(e.target.value)} aria-describedby={`${id}-help`}>
        {RETENTION_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
        <option value="fecha">Elegir fecha…</option>
      </select>
      {mode === 'fecha' && (
        <input
          type="date"
          className="input mt-2"
          aria-label="Fecha de borrado"
          min={toDateInput(now + 24 * 3600 * 1000)}
          max={toDateInput(maxExpiry(now))}
          value={toDateInput(value)}
          onChange={(e) => e.target.value && onChange(clampExpiry(fromDateInput(e.target.value)))}
        />
      )}
      <p id={`${id}-help`} className="mt-1.5 text-xs text-stone-600 dark:text-stone-400">
        Se borrará el <strong>{formatDay(value)}</strong>. Podrás cambiarlo después (máximo 1 año).
      </p>
    </div>
  );
}
