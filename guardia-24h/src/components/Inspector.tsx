import { useMemo, useState } from 'react';
import { items } from '../data/content';
import { hashSemilla } from '../game/rng';
import { citaValida, type Cita } from '../library/search';
import { CitaSelector } from './CitaSelector';
import { Icon } from './Icon';

/** Inspección sorpresa: el inspector pide justificar una decisión citando el REBT. No afecta a la nota. */
export function Inspector({ semilla, onFin }: { semilla: string; onFin: (ok: boolean) => void }) {
  const item = useMemo(() => {
    const banco = items.filter((i) => i.citas_validas.length > 0 && i.tipo !== 'selector_cita');
    return banco[hashSemilla(semilla) % banco.length]!;
  }, [semilla]);
  const [cita, setCita] = useState<Cita | null>(null);
  const [res, setRes] = useState<boolean | null>(null);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="insp-t" className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4">
      <div className="card max-w-lg animate-fade space-y-3 !border-acc/60 !bg-panel p-5">
        <div className="eyebrow flex items-center gap-2 !text-acct"><Icon n="alert" className="h-4 w-4" />Inspección sorpresa</div>
        <h2 id="insp-t" className="text-lg">El inspector solicita justificación normativa</h2>
        <p className="text-sm text-tx/90">«{item.enunciado.replace('JEFE · ', '')}»</p>
        <p className="text-sm text-mute">¿Qué apartado del REBT respalda la decisión correcta? Cítalo (documento y ITC).</p>
        <CitaSelector onChange={setCita} />
        {res !== null && (
          <p role="status" className={`rounded border p-2 text-sm ${res ? 'border-ok/50 bg-ok/10 text-ok' : 'border-bad/50 bg-bad/10 text-bad'}`}>
            {res ? 'Justificación aceptada: +5 de reputación y +20 XP.' : `Justificación no válida: −5 de reputación. Cita esperada: ${item.citas_validas.map((c) => `${c.doc} ${c.ref}`).join(' / ')}.`}
          </p>
        )}
        <div className="flex gap-2">
          {res === null
            ? <><button className="btn" disabled={!cita} onClick={() => setRes(citaValida(cita!, item.citas_validas))}>Responder</button><button className="btn btn-ghost" onClick={() => onFin(false)}>Sin respuesta (−5)</button></>
            : <button className="btn" onClick={() => onFin(res)}>Continuar</button>}
        </div>
        <p className="text-xs text-mute">La inspección es parte del juego y no modifica tu nota académica.</p>
      </div>
    </div>
  );
}
