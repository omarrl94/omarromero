// Pruebas de las reglas de Firestore contra el emulador oficial.
// Uso: npm run test:rules   (arranca el emulador, ejecuta esto y lo apaga)
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { setLogLevel } from 'firebase/firestore';

setLogLevel('silent');
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy, limit, runTransaction, writeBatch, serverTimestamp } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-codeforge',
  firestore: { rules: readFileSync('firebase/firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
});

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${name}\n    ${e.message.split('\n')[0]}`);
  }
}

const stats = { gold: 0, xp: 0, worlds: 0, conquered: 0 };
const player = (nick, extra = {}) => ({ nick, nickLower: nick.toLowerCase(), avatar: 'nova', ...stats, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...extra });

/** Registro tal como lo hace la app: reserva de nick + perfil + progreso en una transacción. */
async function registerAs(db, uid, nick) {
  await runTransaction(db, async (tx) => {
    const nickRef = doc(db, 'codeforge_nicks', nick.toLowerCase());
    const taken = await tx.get(nickRef);
    if (taken.exists()) throw new Error('nick cogido');
    tx.set(nickRef, { uid });
    tx.set(doc(db, 'codeforge_players', uid), player(nick));
    tx.set(doc(db, 'codeforge_players', uid, 'private', 'progress'), { email: `${uid}@test.dev`, state: '', updatedAt: serverTimestamp() });
  });
}

await env.clearFirestore();
const alice = env.authenticatedContext('alice').firestore();
const bob = env.authenticatedContext('bob').firestore();
const anon = env.unauthenticatedContext().firestore();

await test('registro completo en una transacción (nick + perfil + progreso)', () => assertSucceeds(registerAs(alice, 'alice', 'NovaRider')));
await test('un anónimo puede comprobar si un nick está libre', () => assertSucceeds(getDoc(doc(anon, 'codeforge_nicks', 'novarider'))));
await test('nadie puede listar todos los nicks', () => assertFails(getDocs(collection(anon, 'codeforge_nicks'))));
await test('otro jugador NO puede sobrescribir un nick ya reservado', () => assertFails(setDoc(doc(bob, 'codeforge_nicks', 'novarider'), { uid: 'bob' })));
await test('no se puede crear un perfil con un nick que no has reservado', () => assertFails(setDoc(doc(bob, 'codeforge_players', 'bob'), player('NovaRider'))));
await test('no se puede reservar un nick a nombre de otro', () => assertFails(setDoc(doc(bob, 'codeforge_nicks', 'impostor'), { uid: 'alice' })));
await test('nick con caracteres no válidos → rechazado', () => assertFails(registerAs(bob, 'bob', 'mal nick!')));
await test('segundo jugador se registra con otro nick', () => assertSucceeds(registerAs(bob, 'bob', 'ByteQueen')));

await test('el perfil público es visible para jugadores con sesión (ranking)', () => assertSucceeds(getDoc(doc(bob, 'codeforge_players', 'alice'))));
await test('el perfil público NO es visible sin sesión', () => assertFails(getDoc(doc(anon, 'codeforge_players', 'alice'))));
await test('ranking: consulta ordenada por oro', () => assertSucceeds(getDocs(query(collection(bob, 'codeforge_players'), orderBy('gold', 'desc'), limit(20)))));

await test('el progreso privado lo lee su dueño', () => assertSucceeds(getDoc(doc(alice, 'codeforge_players', 'alice', 'private', 'progress'))));
await test('el progreso privado (y el correo) NO lo lee otro jugador', () => assertFails(getDoc(doc(bob, 'codeforge_players', 'alice', 'private', 'progress'))));
await test('sincronizar progreso + estadísticas en un batch', async () => {
  const batch = writeBatch(alice);
  batch.set(doc(alice, 'codeforge_players', 'alice', 'private', 'progress'), { email: 'alice@test.dev', state: JSON.stringify({ xp: { python: 120 } }), updatedAt: serverTimestamp() });
  batch.update(doc(alice, 'codeforge_players', 'alice'), { gold: 75, xp: 120, worlds: 0, conquered: 1, updatedAt: serverTimestamp() });
  await assertSucceeds(batch.commit());
});
await test('NO se puede escribir el progreso de otro jugador', () => assertFails(setDoc(doc(bob, 'codeforge_players', 'alice', 'private', 'progress'), { email: 'x', state: '{}', updatedAt: serverTimestamp() })));
await test('NO se puede modificar el perfil de otro jugador', () => assertFails(updateDoc(doc(bob, 'codeforge_players', 'alice'), { gold: 0 })));
await test('oro imposible (más de 8000) → rechazado', () => assertFails(updateDoc(doc(alice, 'codeforge_players', 'alice'), { gold: 999999 })));
await test('campos extra en el perfil → rechazados', () => assertFails(updateDoc(doc(alice, 'codeforge_players', 'alice'), { admin: true })));
await test('cambiar el avatar', () => assertSucceeds(updateDoc(doc(alice, 'codeforge_players', 'alice'), { avatar: 'kraken', updatedAt: serverTimestamp() })));
await test('cambiar de nick (reserva el nuevo y libera el antiguo)', () => assertSucceeds(runTransaction(alice, async (tx) => {
  const newRef = doc(alice, 'codeforge_nicks', 'novaprime');
  const taken = await tx.get(newRef);
  if (taken.exists()) throw new Error('cogido');
  tx.set(newRef, { uid: 'alice' });
  tx.delete(doc(alice, 'codeforge_nicks', 'novarider'));
  tx.update(doc(alice, 'codeforge_players', 'alice'), { nick: 'NovaPrime', nickLower: 'novaprime', updatedAt: serverTimestamp() });
})));
await test('NO se puede robar el nick de otro al cambiar', () => assertFails(updateDoc(doc(alice, 'codeforge_players', 'alice'), { nick: 'ByteQueen', nickLower: 'bytequeen' })));
await test('NO se puede borrar la reserva de nick de otro', () => assertFails(deleteDoc(doc(alice, 'codeforge_nicks', 'bytequeen'))));
await test('nadie puede borrar perfiles', () => assertFails(deleteDoc(doc(alice, 'codeforge_players', 'alice'))));

await env.cleanup();
console.log(`\n${passed}/${passed + failed} reglas verificadas`);
process.exit(failed ? 1 : 0);
