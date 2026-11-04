// Pruebas de las reglas de Firestore contra el emulador oficial.
// Uso: npm run test:rules   (arranca el emulador, ejecuta esto y lo apaga)
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { setLogLevel } from 'firebase/firestore';

setLogLevel('silent');
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, orderBy, limit, runTransaction, writeBatch, serverTimestamp } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-cyberops',
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

const stats = { team: 'blue', xp: 0, stars: 0, missions: 0 };
const player = (nick, extra = {}) => ({ nick, nickLower: nick.toLowerCase(), avatar: 'nova', ...stats, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...extra });

/** Registro tal como lo hace la app: reserva de nick + perfil + progreso en una transacción. */
async function registerAs(db, uid, nick) {
  await runTransaction(db, async (tx) => {
    const nickRef = doc(db, 'cyberops_nicks', nick.toLowerCase());
    const taken = await tx.get(nickRef);
    if (taken.exists()) throw new Error('nick cogido');
    tx.set(nickRef, { uid });
    tx.set(doc(db, 'cyberops_players', uid), player(nick));
    tx.set(doc(db, 'cyberops_players', uid, 'private', 'progress'), { email: `${uid}@test.dev`, state: '', updatedAt: serverTimestamp() });
  });
}

await env.clearFirestore();
const alice = env.authenticatedContext('alice').firestore();
const bob = env.authenticatedContext('bob').firestore();
const anon = env.unauthenticatedContext().firestore();

await test('registro completo en una transacción (nick + perfil + progreso)', () => assertSucceeds(registerAs(alice, 'alice', 'NovaRider')));
await test('un anónimo puede comprobar si un nick está libre', () => assertSucceeds(getDoc(doc(anon, 'cyberops_nicks', 'novarider'))));
await test('nadie puede listar todos los nicks', () => assertFails(getDocs(collection(anon, 'cyberops_nicks'))));
await test('otro jugador NO puede sobrescribir un nick ya reservado', () => assertFails(setDoc(doc(bob, 'cyberops_nicks', 'novarider'), { uid: 'bob' })));
await test('no se puede crear un perfil con un nick que no has reservado', () => assertFails(setDoc(doc(bob, 'cyberops_players', 'bob'), player('NovaRider'))));
await test('no se puede reservar un nick a nombre de otro', () => assertFails(setDoc(doc(bob, 'cyberops_nicks', 'impostor'), { uid: 'alice' })));
await test('nick con caracteres no válidos → rechazado', () => assertFails(registerAs(bob, 'bob', 'mal nick!')));
await test('segundo jugador se registra con otro nick', () => assertSucceeds(registerAs(bob, 'bob', 'ByteQueen')));

await test('el perfil público es visible para jugadores con sesión (ranking)', () => assertSucceeds(getDoc(doc(bob, 'cyberops_players', 'alice'))));
await test('el perfil público NO es visible sin sesión', () => assertFails(getDoc(doc(anon, 'cyberops_players', 'alice'))));
await test('ranking: consulta ordenada por XP', () => assertSucceeds(getDocs(query(collection(bob, 'cyberops_players'), orderBy('xp', 'desc'), limit(20)))));

await test('el progreso privado lo lee su dueño', () => assertSucceeds(getDoc(doc(alice, 'cyberops_players', 'alice', 'private', 'progress'))));
await test('el progreso privado (y el correo) NO lo lee otro jugador', () => assertFails(getDoc(doc(bob, 'cyberops_players', 'alice', 'private', 'progress'))));
await test('sincronizar progreso + estadísticas en un batch', async () => {
  const batch = writeBatch(alice);
  batch.set(doc(alice, 'cyberops_players', 'alice', 'private', 'progress'), { email: 'alice@test.dev', state: JSON.stringify({ team: 'red' }), updatedAt: serverTimestamp() });
  batch.update(doc(alice, 'cyberops_players', 'alice'), { team: 'red', xp: 150, stars: 3, missions: 1, updatedAt: serverTimestamp() });
  await assertSucceeds(batch.commit());
});
await test('NO se puede escribir el progreso de otro jugador', () => assertFails(setDoc(doc(bob, 'cyberops_players', 'alice', 'private', 'progress'), { email: 'x', state: '{}', updatedAt: serverTimestamp() })));
await test('NO se puede modificar el perfil de otro jugador', () => assertFails(updateDoc(doc(bob, 'cyberops_players', 'alice'), { xp: 0 })));
await test('XP imposible (más de 30000) → rechazada', () => assertFails(updateDoc(doc(alice, 'cyberops_players', 'alice'), { xp: 999999 })));
await test('equipo inexistente → rechazado', () => assertFails(updateDoc(doc(alice, 'cyberops_players', 'alice'), { team: 'verde' })));
await test('campos extra en el perfil → rechazados', () => assertFails(updateDoc(doc(alice, 'cyberops_players', 'alice'), { admin: true })));
await test('cambiar el avatar', () => assertSucceeds(updateDoc(doc(alice, 'cyberops_players', 'alice'), { avatar: 'kraken', updatedAt: serverTimestamp() })));
await test('cambiar de nick (reserva el nuevo y libera el antiguo)', () => assertSucceeds(runTransaction(alice, async (tx) => {
  const newRef = doc(alice, 'cyberops_nicks', 'novaprime');
  const taken = await tx.get(newRef);
  if (taken.exists()) throw new Error('cogido');
  tx.set(newRef, { uid: 'alice' });
  tx.delete(doc(alice, 'cyberops_nicks', 'novarider'));
  tx.update(doc(alice, 'cyberops_players', 'alice'), { nick: 'NovaPrime', nickLower: 'novaprime', updatedAt: serverTimestamp() });
})));
await test('NO se puede robar el nick de otro al cambiar', () => assertFails(updateDoc(doc(alice, 'cyberops_players', 'alice'), { nick: 'ByteQueen', nickLower: 'bytequeen' })));
await test('NO se puede borrar la reserva de nick de otro', () => assertFails(deleteDoc(doc(alice, 'cyberops_nicks', 'bytequeen'))));
await test('nadie puede borrar perfiles', () => assertFails(deleteDoc(doc(alice, 'cyberops_players', 'alice'))));

await env.cleanup();
console.log(`\n${passed}/${passed + failed} reglas verificadas`);
process.exit(failed ? 1 : 0);
