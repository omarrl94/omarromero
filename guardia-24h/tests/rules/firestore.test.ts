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

const perfil = { alias: 'Ana', aliasLower: 'ana', claseCodigo: 'ABCD', profesorUid: 'prof', creado: new Date() };

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
  it('no puede declarar otro profesor distinto al de la clase', async () => {
    const db = env.authenticatedContext('a1', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertFails(setDoc(doc(db, 'guardia_students/a1'), { ...perfil, profesorUid: 'otro' }));
  });
  it('el alumno no puede escribir sus propios ajustes de profesor, pero sí leerlos', async () => {
    await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'guardia_students/a1'), perfil); await setDoc(doc(c.firestore(), 'guardia_students/a1/teacher/overrides'), { a: 0.4 }); });
    const a1 = env.authenticatedContext('a1', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertSucceeds(getDoc(doc(a1, 'guardia_students/a1/teacher/overrides')));
    await assertFails(setDoc(doc(a1, 'guardia_students/a1/teacher/overrides'), { a: 1 }));
  });
  it('el profesor de la clase escribe ajustes y lee las respuestas; otro profesor no', async () => {
    await env.withSecurityRulesDisabled(async (c) => { await setDoc(doc(c.firestore(), 'guardia_students/a1'), perfil); await setDoc(doc(c.firestore(), 'guardia_students/a1/answers/x'), { pe: 1 }); });
    const prof = env.authenticatedContext('prof', { firebase: { sign_in_provider: 'password' } }).firestore();
    const otro = env.authenticatedContext('prof2', { firebase: { sign_in_provider: 'password' } }).firestore();
    await assertSucceeds(setDoc(doc(prof, 'guardia_students/a1/teacher/overrides'), { taller: { RA1: 8 } }));
    await assertSucceeds(getDoc(doc(prof, 'guardia_students/a1/answers/x')));
    await assertFails(setDoc(doc(otro, 'guardia_students/a1/teacher/overrides'), { taller: { RA1: 10 } }));
    await assertFails(getDoc(doc(otro, 'guardia_students/a1/answers/x')));
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
