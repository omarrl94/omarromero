#!/usr/bin/env node
/**
 * Prueba las reglas de Firestore contra el emulador:
 *
 *   npm run probar:reglas
 *
 * Comprueba lo que de verdad importa: quién puede registrarse, que nadie se
 * nombra profesor, que un alumno no se pone nota ni toca lo ajeno, que el
 * título solo se emite con el Proyecto Final aprobado y que la verificación
 * pública no permite listar títulos.
 */
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where,
  serverTimestamp, writeBatch, deleteField, setLogLevel
} from "firebase/firestore";

setLogLevel("silent");   // los PERMISSION_DENIED esperados no ensucian la salida

const ADMIN = "omar.romero@jrotero.es";
const env = await initializeTestEnvironment({
  projectId: "demo-jrotero",
  firestore: { rules: readFileSync(new URL("../firebase/firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 }
});

const como = (uid, email, verificado = true) => env.authenticatedContext(uid, { email, email_verified: verificado }).firestore();
const anonimo = () => env.unauthenticatedContext().firestore();

const perfil = (extra = {}) => ({
  nombre: "Lucía Pérez", email: "lucia@jrotero.es", role: "alumno", ciclo: "ASIR", curso: "2º",
  createdAt: serverTimestamp(), consents: { privacidad: serverTimestamp(), iaAct: serverTimestamp() }, progreso: {}, ...extra
});
const entrega = (uid, n, extra = {}) => ({
  userId: uid, sesion: n, enlace: "https://github.com/x/y", pareja: "", comentario: "ok",
  ts: serverTimestamp(), estado: "pendiente", nombre: "Lucía Pérez", ciclo: "ASIR", curso: "2º", ...extra
});

let ok = 0, ko = 0;
async function caso(nombre, fn) {
  try { await fn(); ok++; console.log("  ✔", nombre); }
  catch (e) { ko++; console.log("  ✖", nombre, "\n     ", e.message.split("\n")[0]); }
}

await env.clearFirestore();
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "config", "aula"), { codigo: "AULA-SECRETA" });
});

const lucia = como("lucia", "lucia@jrotero.es");
const luciaSinVerificar = como("lucia", "lucia@jrotero.es", false);
const pablo = como("pablo", "pablo@gmail.com");
const admin = como("admin", ADMIN);

console.log("Registro");
await caso("alumna con correo institucional crea su perfil (sin verificar aún)", () =>
  assertSucceeds(setDoc(doc(luciaSinVerificar, "usuarios", "lucia"), perfil())));
await caso("correo externo sin código de aula → rechazado", () =>
  assertFails(setDoc(doc(pablo, "usuarios", "pablo"), perfil({ email: "pablo@gmail.com" }))));
await caso("correo externo con código incorrecto → rechazado", () =>
  assertFails(setDoc(doc(pablo, "usuarios", "pablo"), perfil({ email: "pablo@gmail.com", codigoAula: "MAL-MAL" }))));
await caso("correo externo con código de aula correcto → permitido", () =>
  assertSucceeds(setDoc(doc(pablo, "usuarios", "pablo"), perfil({ email: "pablo@gmail.com", nombre: "Pablo Ruiz", ciclo: "DAM", codigoAula: "AULA-SECRETA" }))));
await caso("nadie se registra como admin con otro correo", () =>
  assertFails(setDoc(doc(como("eva", "eva@jrotero.es"), "usuarios", "eva"), perfil({ email: "eva@jrotero.es", role: "admin", ciclo: null, curso: null }))));
await caso("el correo del profesor sin verificar no crea perfil de admin", () =>
  assertFails(setDoc(doc(como("admin", ADMIN, false), "usuarios", "admin"), perfil({ email: ADMIN, role: "admin", ciclo: null, curso: null }))));
await caso("el profesor con correo verificado crea su perfil de admin", () =>
  assertSucceeds(setDoc(doc(admin, "usuarios", "admin"), perfil({ email: ADMIN, nombre: "Omar Romero", role: "admin", ciclo: null, curso: null }))));
await caso("no se puede falsear la fecha del consentimiento", () =>
  assertFails(setDoc(doc(como("ana", "ana@jrotero.es"), "usuarios", "ana"), perfil({ email: "ana@jrotero.es", consents: { privacidad: new Date(2020, 1, 1), iaAct: serverTimestamp() } }))));

console.log("Perfiles y progreso");
await caso("una alumna no lee el perfil de otro", () => assertFails(getDoc(doc(lucia, "usuarios", "pablo"))));
await caso("el profesor lee todos los perfiles", () => assertSucceeds(getDocs(collection(admin, "usuarios"))));
await caso("marcar una sesión completada", () => assertSucceeds(updateDoc(doc(lucia, "usuarios", "lucia"), { "progreso.3": serverTimestamp() })));
await caso("desmarcarla", () => assertSucceeds(updateDoc(doc(lucia, "usuarios", "lucia"), { "progreso.3": deleteField() })));
await caso("sesión inexistente en el progreso → rechazado", () => assertFails(updateDoc(doc(lucia, "usuarios", "lucia"), { "progreso.99": serverTimestamp() })));
await caso("la alumna no puede cambiarse el rol", () => assertFails(updateDoc(doc(lucia, "usuarios", "lucia"), { role: "admin" })));
await caso("la alumna no puede cambiarse de ciclo", () => assertFails(updateDoc(doc(lucia, "usuarios", "lucia"), { ciclo: "DAM" })));
await caso("nadie lee el código de aula salvo el profesor", () => assertFails(getDoc(doc(lucia, "config", "aula"))));
await caso("el profesor lee y cambia el código de aula", async () => {
  await assertSucceeds(getDoc(doc(admin, "config", "aula")));
  await assertSucceeds(setDoc(doc(admin, "config", "aula"), { codigo: "AULA-SECRETA", actualizado: serverTimestamp() }));
});

console.log("Entregas");
await caso("sin correo verificado no se entrega", () =>
  assertFails(setDoc(doc(luciaSinVerificar, "entregas", "lucia_12"), entrega("lucia", 12))));
await caso("entrega válida de la Sesión 12", () =>
  assertSucceeds(setDoc(doc(lucia, "entregas", "lucia_12"), entrega("lucia", 12))));
await caso("no se entrega ya aprobada", () =>
  assertFails(setDoc(doc(lucia, "entregas", "lucia_11"), entrega("lucia", 11, { estado: "aprobada" }))));
await caso("no se entrega en nombre de otro", () =>
  assertFails(setDoc(doc(lucia, "entregas", "pablo_5"), entrega("pablo", 5))));
await caso("el id debe coincidir con la sesión", () =>
  assertFails(setDoc(doc(lucia, "entregas", "lucia_4"), entrega("lucia", 5))));
await caso("el nombre debe ser el del perfil", () =>
  assertFails(setDoc(doc(lucia, "entregas", "lucia_6"), entrega("lucia", 6, { nombre: "Otra Persona" }))));
await caso("enlace que no es http(s) → rechazado", () =>
  assertFails(setDoc(doc(lucia, "entregas", "lucia_7"), entrega("lucia", 7, { enlace: "javascript:alert(1)" }))));
await caso("la alumna no se pone nota", () =>
  assertFails(updateDoc(doc(lucia, "entregas", "lucia_12"), { nota: 10, estado: "aprobada" })));
await caso("otro alumno no lee la entrega", () => assertFails(getDoc(doc(pablo, "entregas", "lucia_12"))));
await caso("la alumna consulta sus entregas", () =>
  assertSucceeds(getDocs(query(collection(lucia, "entregas"), where("userId", "==", "lucia")))));
await caso("la alumna no puede listar todas las entregas", () => assertFails(getDocs(collection(lucia, "entregas"))));

console.log("Altas aprobadas por el profesor");
await caso("anotar correoVerificado igual que la sesión", () =>
  assertSucceeds(updateDoc(doc(luciaSinVerificar, "usuarios", "lucia"), { correoVerificado: false })));
await caso("no se puede anotar verificado si la sesión no lo está", () =>
  assertFails(updateDoc(doc(luciaSinVerificar, "usuarios", "lucia"), { correoVerificado: true })));
await caso("la alumna no puede aprobarse a sí misma", () =>
  assertFails(setDoc(doc(luciaSinVerificar, "aprobaciones", "lucia"), { aprobado: true, aprobadoEn: serverTimestamp(), por: "lucia@jrotero.es" })));
await caso("el profesor aprueba la cuenta", () =>
  assertSucceeds(setDoc(doc(admin, "aprobaciones", "lucia"), { aprobado: true, aprobadoEn: serverTimestamp(), por: ADMIN })));
await caso("aprobada, entrega aunque su correo no esté verificado", () =>
  assertSucceeds(setDoc(doc(luciaSinVerificar, "entregas", "lucia_3"), entrega("lucia", 3))));
await caso("la alumna lee su aprobación", () => assertSucceeds(getDoc(doc(luciaSinVerificar, "aprobaciones", "lucia"))));
await caso("otro alumno no la lee", () => assertFails(getDoc(doc(pablo, "aprobaciones", "lucia"))));
await caso("el profesor lista las aprobaciones", () => assertSucceeds(getDocs(collection(admin, "aprobaciones"))));
await caso("nadie lee el registro de correos (mail_log)", () => assertFails(getDoc(doc(admin, "mail_log", "x"))));

const evaluar = (extra) => ({ feedback: "Bien", revisadoEn: serverTimestamp(), revisadoPor: ADMIN, ...extra });
console.log("Evaluación y títulos");
await caso("título sin Proyecto Final aprobado → rechazado", async () => {
  const b = writeBatch(admin);
  b.set(doc(admin, "titulos", "lucia"), { userId: "lucia", codigo: "JRO-IA-2026-ABC123", emitidoEn: serverTimestamp(), emitidoPor: ADMIN, nota: 8, nombre: "Lucía Pérez", ciclo: "ASIR", curso: "2º" });
  b.set(doc(admin, "verificaciones", "JRO-IA-2026-ABC123"), { userId: "lucia", codigo: "JRO-IA-2026-ABC123", nombre: "Lucía Pérez", ciclo: "ASIR", curso: "2º", emitidoEn: serverTimestamp() });
  await assertFails(b.commit());
});
await caso("aprobar con un 3 → rechazado", () => assertFails(updateDoc(doc(admin, "entregas", "lucia_12"), evaluar({ estado: "aprobada", nota: 3 }))));
await caso("pedir cambios sin nota", () => assertSucceeds(updateDoc(doc(admin, "entregas", "lucia_12"), evaluar({ estado: "revision", nota: null }))));
await caso("la alumna reenvía tras los cambios", () =>
  assertSucceeds(updateDoc(doc(lucia, "entregas", "lucia_12"), { enlace: "https://github.com/x/v2", pareja: "Pablo (DAM)", comentario: "corregido", ts: serverTimestamp(), estado: "pendiente" })));
await caso("el profesor aprueba con un 8,5", () => assertSucceeds(updateDoc(doc(admin, "entregas", "lucia_12"), evaluar({ estado: "aprobada", nota: 8.5 }))));
await caso("una entrega aprobada ya no se modifica", () =>
  assertFails(updateDoc(doc(lucia, "entregas", "lucia_12"), { enlace: "https://github.com/x/v3", pareja: "", comentario: "", ts: serverTimestamp(), estado: "pendiente" })));
await caso("la alumna no se emite su propio título", () =>
  assertFails(setDoc(doc(lucia, "titulos", "lucia"), { userId: "lucia", codigo: "JRO-IA-2026-ABC123", emitidoEn: serverTimestamp(), emitidoPor: ADMIN, nota: 10, nombre: "Lucía Pérez", ciclo: "ASIR", curso: "2º" })));
await caso("el profesor emite el título con su verificación", async () => {
  const b = writeBatch(admin);
  b.set(doc(admin, "titulos", "lucia"), { userId: "lucia", codigo: "JRO-IA-2026-ABC123", emitidoEn: serverTimestamp(), emitidoPor: ADMIN, nota: 8.5, nombre: "Lucía Pérez", ciclo: "ASIR", curso: "2º" });
  b.set(doc(admin, "verificaciones", "JRO-IA-2026-ABC123"), { userId: "lucia", codigo: "JRO-IA-2026-ABC123", nombre: "Lucía Pérez", ciclo: "ASIR", curso: "2º", emitidoEn: serverTimestamp() });
  await assertSucceeds(b.commit());
});
await caso("una verificación falsa sin título → rechazada", () =>
  assertFails(setDoc(doc(admin, "verificaciones", "JRO-IA-2026-FFFFFF"), { userId: "pablo", codigo: "JRO-IA-2026-FFFFFF", nombre: "Pablo", ciclo: "DAM", curso: "2º", emitidoEn: serverTimestamp() })));
await caso("la alumna ve su título", () => assertSucceeds(getDoc(doc(lucia, "titulos", "lucia"))));
await caso("otro alumno no ve el título", () => assertFails(getDoc(doc(pablo, "titulos", "lucia"))));
await caso("cualquiera verifica un título por su código", () => assertSucceeds(getDoc(doc(anonimo(), "verificaciones", "JRO-IA-2026-ABC123"))));
await caso("nadie puede listar los títulos verificables", () => assertFails(getDocs(collection(anonimo(), "verificaciones"))));

console.log("Supresión (RGPD)");
await caso("otro alumno no borra datos ajenos", () => assertFails(deleteDoc(doc(pablo, "usuarios", "lucia"))));
await caso("la alumna borra entregas, título, verificación y perfil", async () => {
  const b = writeBatch(lucia);
  b.delete(doc(lucia, "entregas", "lucia_12"));
  b.delete(doc(lucia, "entregas", "lucia_3"));
  b.delete(doc(lucia, "aprobaciones", "lucia"));
  b.delete(doc(lucia, "titulos", "lucia"));
  b.delete(doc(lucia, "verificaciones", "JRO-IA-2026-ABC123"));
  b.delete(doc(lucia, "usuarios", "lucia"));
  await assertSucceeds(b.commit());
});

await env.cleanup();
console.log(`\n${ok} correctas, ${ko} fallidas`);
process.exit(ko ? 1 : 0);
