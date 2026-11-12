/** Guardado en la nube del progreso de cada usuario: users/{uid} en Firestore (solo lo puede leer su dueño). */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Project } from './model/types';
import type { Career } from './game/store';

export interface Profile { name?: string; career?: Career; project?: string; updatedAt?: unknown }

export async function loadProfile(uid: string): Promise<Profile | null> {
  if (!db) return null;
  try { const s = await getDoc(doc(db, 'users', uid)); return s.exists() ? (s.data() as Profile) : null; } catch { return null; }
}

export async function saveProfile(uid: string, p: { name?: string; career?: Career; project?: Project }) {
  if (!db) return;
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (p.name !== undefined) data.name = p.name;
  if (p.career) data.career = p.career;
  if (p.project) data.project = JSON.stringify(p.project); // cadena: evita problemas con arrays anidados en Firestore
  try { await setDoc(doc(db, 'users', uid), data, { merge: true }); } catch { /* sin conexión: se reintenta en el siguiente guardado */ }
}
