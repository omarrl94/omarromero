// Pruebas de las reglas de seguridad de Firestore (se ejecutan contra el emulador):
//   npm run test:reglas
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

const DIRECCION = 'omar.romero@jrotero.es';
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-master-ia',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 }
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const alumno = (uid, email, verificado = true) => env.authenticatedContext(uid, { email, email_verified: verificado }).firestore();
const direccion = (verificado = true) => env.authenticatedContext('dir', { email: DIRECCION, email_verified: verificado }).firestore();
const anonimo = () => env.unauthenticatedContext().firestore();

function perfil(email, extra = {}) {
  return Object.assign({
    email, nombre: 'Lucía Pérez Gómez', dni: '12345678Z', rol: 'alumno', plaza: 'externo', via: 'DAM', promocion: '2028',
    centro: '', nacimiento: '2001-03-04', estado: 'pendiente', admision: 'dominio', codigo: null,
    consentimientos: { datos: { aceptado: true } }, creado: '2029-06-01T10:00:00Z', progreso: {}, pfm: null, oposicion: null, limitacion: null
  }, extra);
}
async function matricular(fs, uid, datos) {
  const lote = fs.batch();
  lote.set(fs.doc('dnis/' + datos.dni), { uid });
  if (datos.codigo) lote.update(fs.doc('codigos/' + datos.codigo), { usadoPor: uid, fechaUso: '2029-06-01' });
  lote.set(fs.doc('usuarios/' + uid), datos);
  return lote.commit();
}
async function sembrar(fn) { await env.withSecurityRulesDisabled(ctx => fn(ctx.firestore())); }
const entrega = (uid, email, extra = {}) => Object.assign({
  uid, email, sesion: 1, tipo: 'semanal', hito: null, repo: 'https://github.com/x/y', video: null,
  commit: 'main', notas: '', fecha: '2029-10-03T10:00:00Z', estado: 'pendiente', nota: null, feedback: ''
}, extra);

describe('Matrícula', () => {
  it('un alumno puede matricularse como pendiente', async () => {
    await assertSucceeds(matricular(alumno('a1', 'lucia@gmail.com'), 'a1', perfil('lucia@gmail.com')));
  });
  it('no puede autoadmitirse sin código', async () => {
    await assertFails(matricular(alumno('a1', 'lucia@gmail.com'), 'a1', perfil('lucia@gmail.com', { estado: 'admitido' })));
  });
  it('se admite directamente con un código válido y vía DAM', async () => {
    await sembrar(fs => fs.doc('codigos/MIA-AAAA-BBBB').set({ creado: 'x', nota: '', usadoPor: null, revocado: null }));
    await assertSucceeds(matricular(alumno('a1', 'lucia@gmail.com'), 'a1', perfil('lucia@gmail.com', { estado: 'admitido', admision: 'codigo', codigo: 'MIA-AAAA-BBBB' })));
  });
  it('un código ya usado no sirve', async () => {
    await sembrar(fs => fs.doc('codigos/MIA-AAAA-BBBB').set({ creado: 'x', nota: '', usadoPor: 'otro', revocado: null }));
    await assertFails(matricular(alumno('a1', 'lucia@gmail.com'), 'a1', perfil('lucia@gmail.com', { estado: 'admitido', admision: 'codigo', codigo: 'MIA-AAAA-BBBB' })));
  });
  it('con vía distinta de DAM el código no admite directamente', async () => {
    await sembrar(fs => fs.doc('codigos/MIA-AAAA-BBBB').set({ creado: 'x', nota: '', usadoPor: null, revocado: null }));
    await assertFails(matricular(alumno('a1', 'lucia@gmail.com'), 'a1', perfil('lucia@gmail.com', { via: 'DAW', estado: 'admitido', admision: 'codigo', codigo: 'MIA-AAAA-BBBB' })));
  });
  it('el DNI no puede repetirse', async () => {
    await assertSucceeds(matricular(alumno('a1', 'lucia@gmail.com'), 'a1', perfil('lucia@gmail.com')));
    await assertFails(matricular(alumno('a2', 'otra@gmail.com'), 'a2', perfil('otra@gmail.com')));
  });
  it('la plaza del centro exige correo @jrotero.es', async () => {
    await assertFails(matricular(alumno('a1', 'lucia@gmail.com'), 'a1', perfil('lucia@gmail.com', { plaza: 'centro' })));
    await assertSucceeds(matricular(alumno('a2', 'ana@jrotero.es'), 'a2', perfil('ana@jrotero.es', { plaza: 'centro', dni: '87654321X' })));
  });
  it('nadie puede crear un perfil con el correo de otra persona ni hacerse Dirección', async () => {
    await assertFails(matricular(alumno('a1', 'lucia@gmail.com'), 'a1', perfil('otra@gmail.com')));
    await assertFails(alumno('a1', 'lucia@gmail.com').doc('usuarios/a1').set({ email: 'lucia@gmail.com', rol: 'director' }));
  });
});

describe('Perfil y privacidad', () => {
  beforeEach(async () => { await sembrar(fs => Promise.all([
    fs.doc('usuarios/a1').set(perfil('lucia@gmail.com')), fs.doc('usuarios/a2').set(perfil('otra@gmail.com', { dni: '87654321X' }))])); });
  it('el alumno actualiza su progreso y su Proyecto Final', async () => {
    await assertSucceeds(alumno('a1', 'lucia@gmail.com').doc('usuarios/a1').update({ progreso: { 1: 'x' }, pfm: { titulo: 'RAG' } }));
  });
  it('el alumno no puede cambiar su estado, su rol ni su DNI', async () => {
    const fs = alumno('a1', 'lucia@gmail.com');
    await assertFails(fs.doc('usuarios/a1').update({ estado: 'admitido' }));
    await assertFails(fs.doc('usuarios/a1').update({ rol: 'director' }));
    await assertFails(fs.doc('usuarios/a1').update({ dni: '00000000T' }));
  });
  it('un alumno no lee el perfil de otro', async () => {
    await assertFails(alumno('a1', 'lucia@gmail.com').doc('usuarios/a2').get());
    await assertFails(alumno('a1', 'lucia@gmail.com').collection('usuarios').get());
  });
  it('la Dirección verificada lee y matricula; sin verificar, no', async () => {
    await assertSucceeds(direccion().collection('usuarios').get());
    await assertSucceeds(direccion().doc('usuarios/a1').update({ estado: 'admitido' }));
    await assertFails(direccion(false).doc('usuarios/a1').update({ estado: 'admitido' }));
  });
  it('sin sesión no se lee nada', async () => {
    await assertFails(anonimo().doc('usuarios/a1').get());
  });
});

describe('Entregas y calificaciones', () => {
  it('el alumno verificado entrega; sin verificar, no', async () => {
    await assertSucceeds(alumno('a1', 'lucia@gmail.com').doc('entregas/e1').set(entrega('a1', 'lucia@gmail.com')));
    await assertFails(alumno('a2', 'otra@gmail.com', false).doc('entregas/e2').set(entrega('a2', 'otra@gmail.com')));
  });
  it('no se puede entregar ya calificado ni en nombre de otro', async () => {
    const fs = alumno('a1', 'lucia@gmail.com');
    await assertFails(fs.doc('entregas/e1').set(entrega('a1', 'lucia@gmail.com', { nota: 10, estado: 'evaluada' })));
    await assertFails(fs.doc('entregas/e2').set(entrega('a2', 'otra@gmail.com')));
    await assertFails(fs.doc('entregas/e3').set(entrega('a1', 'lucia@gmail.com', { repo: 'javascript:alert(1)' })));
  });
  it('el alumno no puede ponerse nota; la Dirección sí', async () => {
    await sembrar(fs => fs.doc('entregas/e1').set(entrega('a1', 'lucia@gmail.com')));
    await assertFails(alumno('a1', 'lucia@gmail.com').doc('entregas/e1').update({ nota: 10, estado: 'evaluada' }));
    await assertSucceeds(direccion().doc('entregas/e1').update({ nota: 8.5, estado: 'evaluada', feedback: 'Bien' }));
  });
  it('cada alumno solo lee sus entregas', async () => {
    await sembrar(fs => fs.doc('entregas/e1').set(entrega('a1', 'lucia@gmail.com')));
    await assertSucceeds(alumno('a1', 'lucia@gmail.com').collection('entregas').where('uid', '==', 'a1').get());
    await assertFails(alumno('a2', 'otra@gmail.com').doc('entregas/e1').get());
  });
  it('actas, asistencia y tribunal: solo la Dirección escribe; el alumno lee las suyas', async () => {
    await assertFails(alumno('a1', 'lucia@gmail.com').doc('evaluaciones/a1').set({ tribunal: { acta: 'apto' } }));
    await assertSucceeds(direccion().doc('evaluaciones/a1').set({ modulos: { M1: { examen: 7 } } }));
    await assertSucceeds(alumno('a1', 'lucia@gmail.com').doc('evaluaciones/a1').get());
    await assertFails(alumno('a2', 'otra@gmail.com').doc('evaluaciones/a1').get());
  });
});

describe('Títulos, verificación, códigos y auditoría', () => {
  it('el registro de títulos es solo de la Dirección', async () => {
    await assertFails(alumno('a1', 'lucia@gmail.com').doc('titulos/MIA-1').set({ numero: 'MIA-1' }));
    await assertSucceeds(direccion().doc('titulos/MIA-1').set({ numero: 'MIA-1' }));
    await assertFails(alumno('a1', 'lucia@gmail.com').doc('titulos/MIA-1').get());
  });
  it('la verificación es pública por código pero no se puede listar', async () => {
    await sembrar(fs => fs.doc('verificaciones/ABCD-1234').set({ tipo: 'diploma', nombre: 'Lucía' }));
    await assertSucceeds(anonimo().doc('verificaciones/ABCD-1234').get());
    await assertFails(anonimo().collection('verificaciones').get());
    await assertFails(alumno('a1', 'lucia@gmail.com').doc('verificaciones/FALSO').set({ tipo: 'diploma' }));
  });
  it('los códigos: el alumno consulta uno concreto y solo puede reclamarlo para sí', async () => {
    await sembrar(fs => fs.doc('codigos/MIA-AAAA-BBBB').set({ creado: 'x', nota: '', usadoPor: null, revocado: null }));
    const fs = alumno('a1', 'lucia@gmail.com');
    await assertSucceeds(fs.doc('codigos/MIA-AAAA-BBBB').get());
    await assertFails(fs.collection('codigos').get());
    await assertFails(fs.doc('codigos/MIA-AAAA-BBBB').update({ usadoPor: 'otro' }));
    await assertFails(fs.doc('codigos/NUEVO').set({ usadoPor: null }));
  });
  it('la auditoría: cada uno anota sus acciones y solo la Dirección la lee', async () => {
    await assertSucceeds(alumno('a1', 'lucia@gmail.com').doc('auditoria/x1').set({ fecha: 'f', accion: 'Inicio de sesión', uid: 'a1' }));
    await assertFails(alumno('a1', 'lucia@gmail.com').doc('auditoria/x2').set({ fecha: 'f', accion: 'falso', uid: 'a2' }));
    await assertFails(alumno('a1', 'lucia@gmail.com').collection('auditoria').get());
    await assertSucceeds(direccion().collection('auditoria').get());
    await assertFails(direccion().doc('auditoria/x1').delete());
  });
});
