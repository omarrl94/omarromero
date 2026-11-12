import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'guardia24h-test',
    firestore: { rules: readFileSync('firebase/firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), 'guardia_classes/ABCD'), { profesorUid: 'prof' });
  });
});

const perfil = { alias: 'Ana', aliasLower: 'ana', claseCodigo: 'ABCD', creado: new Date() };

describe('reglas guardia_*', () => {
  it('un alumno crea su perfil en una clase existente', async () => {
    const db = env.authenticatedContext('a1', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertSucceeds(setDoc(doc(db, 'guardia_students/a1'), perfil));
  });
  it('no puede crear perfil en una clase inexistente', async () => {
    const db = env.authenticatedContext('a1', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertFails(setDoc(doc(db, 'guardia_students/a1'), { ...perfil, claseCodigo: 'NOPE' }));
  });
  it('no puede añadir campos extra ni escribir en el perfil de otro', async () => {
    const db = env.authenticatedContext('a1', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertFails(setDoc(doc(db, 'guardia_students/a1'), { ...perfil, nota: 10 }));
    await assertFails(setDoc(doc(db, 'guardia_students/a2'), perfil));
  });
  it('un alumno no lee los datos privados de otro; sin sesión no se lee nada', async () => {
    await env.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), 'guardia_students/a2/private/estado'), { xp: 5 });
    });
    const a1 = env.authenticatedContext('a1', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertFails(getDoc(doc(a1, 'guardia_students/a2/private/estado')));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'guardia_classes/ABCD')));
  });
  it('solo el profesor de la clase lee a sus alumnos', async () => {
    await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'guardia_students/a2'), perfil); });
    const prof = env.authenticatedContext('prof', { firebase: { sign_in_provider: 'password' } }).firestore();
    const otro = env.authenticatedContext('prof2', { firebase: { sign_in_provider: 'password' } }).firestore();
    await assertSucceeds(getDoc(doc(prof, 'guardia_students/a2')));
    await assertFails(getDoc(doc(otro, 'guardia_students/a2')));
  });
});
