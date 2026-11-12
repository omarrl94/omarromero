import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface Row { uid: string; name?: string; jobs: number; best: number; money: number; comps: number; updated: string }

/** Panel del superadmin: lista de usuarios con su progreso. Solo funciona si las reglas de Firestore lo permiten (correo verificado). */
export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!db) { setErr('Firebase no está configurado en esta copia.'); return; }
    getDocs(collection(db, 'users')).then((snap) => {
      setRows(snap.docs.map((d) => {
        const x = d.data() as { name?: string; career?: { jobs?: number; best?: number; money?: number }; project?: string; updatedAt?: { toDate?: () => Date } };
        let comps = 0; try { comps = x.project ? (JSON.parse(x.project).components?.length ?? 0) : 0; } catch { /* ignorar */ }
        return { uid: d.id, name: x.name, jobs: x.career?.jobs ?? 0, best: x.career?.best ?? 0, money: x.career?.money ?? 0, comps, updated: x.updatedAt?.toDate ? x.updatedAt.toDate().toLocaleString('es-ES') : '—' };
      }));
    }).catch(() => setErr('No se pudo leer la lista: revisa que las reglas de Firestore con isAdmin() estén publicadas y que tu correo esté verificado.'));
  }, []);
  return (
    <div className="solve-overlay admin" role="dialog" aria-label="Panel de administración" style={{ gridTemplateColumns: '1fr' }}>
      <main className="solve-main">
        <article className="report">
          <header className="rhead"><div><h1>Usuarios</h1><p>Panel de superadmin</p></div><button className="x" onClick={onClose} style={{ minHeight: 34, padding: '0 14px', cursor: 'pointer' }}>Cerrar</button></header>
          {err && <p className="rwarn">{err}</p>}
          {!rows && !err && <p>Cargando…</p>}
          {rows && (
            <table className="rtab"><thead><tr><th>Usuario</th><th>Obras del juego</th><th>Mejor nota</th><th>Cobrado (€)</th><th>Componentes en su proyecto</th><th>Última actividad</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r.uid}><td>{r.name || r.uid.slice(0, 8)}</td><td>{r.jobs}</td><td>{r.best}</td><td>{r.money}</td><td>{r.comps}</td><td>{r.updated}</td></tr>)}</tbody></table>
          )}
          <p className="rnote">{rows ? `${rows.length} usuarios con datos guardados.` : ''} Los correos los gestiona Firebase Authentication (consola de Firebase → Authentication → Usuarios).</p>
        </article>
      </main>
    </div>
  );
}
