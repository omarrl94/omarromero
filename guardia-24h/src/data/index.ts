import { crearRepoFirebase, firebaseConfigurado } from './firebase';
import { repoLocal } from './local';
import type { Repo } from './repo';

/** Firebase si hay variables VITE_FIREBASE_*; si no, modo local (IndexedDB). */
export const repo: Repo = firebaseConfigurado ? crearRepoFirebase() : repoLocal;
export * from './repo';
