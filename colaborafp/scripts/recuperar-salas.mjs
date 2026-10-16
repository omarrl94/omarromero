// ColaboraFP · Recupera las salas antiguas cuyo contenido sigue en las colecciones "resources"/"fileChunks".
// Uso (Google Cloud Shell): node recuperar-salas.mjs ID_DEL_PROYECTO TU_UID
// Solo CREA las fichas de sala que faltan; no borra ni modifica nada. Al entrar en «Mis salas», la web
// mueve cada sala al formato nuevo (PIN nuevo y fecha de borrado que podrás cambiar).
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [projectId, uid] = process.argv.slice(2);
if (!projectId || !uid) {
  console.error('Uso: node recuperar-salas.mjs ID_DEL_PROYECTO TU_UID');
  process.exit(1);
}
initializeApp({ projectId });
const db = getFirestore();

const legacy = await db.collection('resources').get();
const byRoom = new Map();
for (const d of legacy.docs) {
  const r = d.data();
  if (!r.room_id) continue;
  if (!byRoom.has(r.room_id)) byRoom.set(r.room_id, []);
  byRoom.get(r.room_id).push(r);
}
console.log(`Recursos antiguos encontrados: ${legacy.size} · salas distintas: ${byRoom.size}\n`);

let created = 0;
for (const [roomId, items] of byRoom) {
  const room = await db.doc(`rooms/${roomId}`).get();
  if (room.exists) {
    console.log(`= ${roomId}: la sala ya existe, no se toca`);
    continue;
  }
  items.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const first = items[0];
  const fecha = new Date(first.timestamp || Date.now()).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  // Si queda el PIN antiguo, recupera el nombre original y su profesor
  const pin = (await db.collection('pins').where('room_id', '==', roomId).limit(1).get()).docs[0]?.data();
  const tema = (first.title || first.content || '').replace(/\s+/g, ' ').slice(0, 60);
  const name = (pin?.name || `Sala recuperada · ${fecha}${tema ? ' · ' + tema : ''}`).slice(0, 120);
  await db.doc(`rooms/${roomId}`).set({
    pin: '000000',
    name,
    module: null,
    teacher_id: pin?.teacher_id || uid,
    is_active: false,
    created_at: Math.round(first.timestamp || Date.now()),
  });
  created++;
  console.log(`+ ${name}  (${items.length} recursos)`);
}
console.log(`\nListo: ${created} salas recuperadas. Entra en ColaboraFP → Mis salas para terminar.`);
