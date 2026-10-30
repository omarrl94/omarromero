#!/usr/bin/env node
/**
 * Prueba las reglas de Firestore del campus contra el emulador:   npm run probar:reglas
 * Lo que de verdad importa: nadie se da acceso a una formación de pago, nadie se nombra
 * administrador, cada uno ve solo lo suyo y los códigos y pedidos no se tocan desde el navegador.
 */
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, getDocs, query, where, serverTimestamp, setLogLevel } from "firebase/firestore";
import { CATALOGO_INICIAL, CAMPOS_FORMACION } from "../src/catalogo.js";

setLogLevel("silent");

const ADMIN = "omar.romero@jrotero.es";
const env = await initializeTestEnvironment({
  projectId: "demo-campus",
  firestore: { rules: readFileSync(new URL("../firebase/firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 }
});

const como = (uid, email, verificado = true) => env.authenticatedContext(uid, { email, email_verified: verificado }).firestore();
const anonimo = () => env.unauthenticatedContext().firestore();
const limpia = (f) => Object.fromEntries(CAMPOS_FORMACION.map(k => [k, f[k] ?? null]));
const perfil = (email, role = "alumno") => ({ nombre: "Lucía Pérez", email, role, createdAt: serverTimestamp(), consents: { privacidad: serverTimestamp() } });
const gratuita = (uid, formacionId, extra = {}) => ({ uid, formacionId, origen: "gratuita", estado: "activa", importe: 0, fecha: serverTimestamp(), nombre: "Lucía Pérez", email: "lucia@jrotero.es", ...extra });

let ok = 0, ko = 0;
async function caso(nombre, fn) {
  try { await fn(); ok++; console.log("  ✔", nombre); }
  catch (e) { ko++; console.log("  ✖", nombre, "\n     ", e.message); }
}

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  for (const f of CATALOGO_INICIAL) await setDoc(doc(db, "formaciones", f.id), limpia(f));
  await setDoc(doc(db, "formaciones", "taller-gratis"), limpia({ ...CATALOGO_INICIAL[0], tipo: "taller", precio: 0, estado: "abierta" }));
  await setDoc(doc(db, "formaciones", "gratis-cerrado"), limpia({ ...CATALOGO_INICIAL[0], precio: 0, estado: "cerrada" }));
  await setDoc(doc(db, "usuarios", "otra"), perfil("otra@gmail.com"));
  await setDoc(doc(db, "matriculas", "otra_curso-claude"), { ...gratuita("otra", "curso-claude"), origen: "compra" });
  await setDoc(doc(db, "pedidos", "cs_1"), { uid: "otra", formacionId: "curso-claude", importe: 149 });
  await setDoc(doc(db, "codigos", "JRO-AAAA-BBBB"), { formacionId: "master-ia-dam", usos: 0, usosMax: 1 });
});

const lucia = como("lucia", "lucia@jrotero.es");
const sinVerificar = como("nuevo", "nuevo@gmail.com", false);
const admin = como("admin", ADMIN);

console.log("Catálogo");
await caso("cualquiera lee el catálogo sin sesión", () => assertSucceeds(getDocs(collection(anonimo(), "formaciones"))));
await caso("un alumno no edita el catálogo", () => assertFails(updateDoc(doc(lucia, "formaciones", "curso-claude"), { precio: 0 })));
await caso("la administración crea una formación válida", () => assertSucceeds(setDoc(doc(admin, "formaciones", "nuevo-curso"), limpia({ ...CATALOGO_INICIAL[0], titulo: "Nuevo" }))));
await caso("la administración no guarda precios negativos", () => assertFails(setDoc(doc(admin, "formaciones", "malo"), limpia({ ...CATALOGO_INICIAL[0], precio: -5 }))));
await caso("la dirección de la plataforma debe ser https", () => assertFails(setDoc(doc(admin, "formaciones", "malo2"), limpia({ ...CATALOGO_INICIAL[0], url: "javascript:alert(1)" }))));
await caso("el admin sin correo verificado no es admin", () => assertFails(updateDoc(doc(como("admin", ADMIN, false), "formaciones", "curso-claude"), { precio: 1 })));

console.log("Perfiles");
await caso("un alumno crea su perfil", () => assertSucceeds(setDoc(doc(lucia, "usuarios", "lucia"), perfil("lucia@jrotero.es"))));
await caso("nadie se nombra administrador", () => assertFails(setDoc(doc(sinVerificar, "usuarios", "nuevo"), perfil("nuevo@gmail.com", "admin"))));
await caso("no se registra con un correo ajeno", () => assertFails(setDoc(doc(sinVerificar, "usuarios", "nuevo"), perfil("otro@gmail.com"))));
await caso("solo cambia su nombre, no su rol", () => assertFails(updateDoc(doc(lucia, "usuarios", "lucia"), { role: "admin" })));
await caso("no lee el perfil de otra persona", () => assertFails(getDoc(doc(lucia, "usuarios", "otra"))));
await caso("la administración lee todos los perfiles", () => assertSucceeds(getDocs(collection(admin, "usuarios"))));

console.log("Matrículas");
await caso("se matricula gratis en una formación gratuita y abierta", () => assertSucceeds(setDoc(doc(lucia, "matriculas", "lucia_taller-gratis"), gratuita("lucia", "taller-gratis"))));
await caso("NO se matricula sola en una formación de pago", () => assertFails(setDoc(doc(lucia, "matriculas", "lucia_curso-claude"), gratuita("lucia", "curso-claude"))));
await caso("NO se matricula como «compra» falseando el origen", () => assertFails(setDoc(doc(lucia, "matriculas", "lucia_curso-claude"), gratuita("lucia", "curso-claude", { origen: "compra" }))));
await caso("NO se matricula en una gratuita cerrada", () => assertFails(setDoc(doc(lucia, "matriculas", "lucia_gratis-cerrado"), gratuita("lucia", "gratis-cerrado"))));
await caso("NO se matricula sin verificar el correo", () => assertFails(setDoc(doc(sinVerificar, "matriculas", "nuevo_taller-gratis"), gratuita("nuevo", "taller-gratis", { email: "nuevo@gmail.com" }))));
await caso("NO matricula a otra persona", () => assertFails(setDoc(doc(lucia, "matriculas", "otra_taller-gratis"), gratuita("otra", "taller-gratis"))));
await caso("no cambia el estado de su propia matrícula", () => assertFails(updateDoc(doc(lucia, "matriculas", "lucia_taller-gratis"), { estado: "activa" })));
await caso("lee sus matrículas", () => assertSucceeds(getDocs(query(collection(lucia, "matriculas"), where("uid", "==", "lucia")))));
await caso("no lista las de otros", () => assertFails(getDocs(collection(lucia, "matriculas"))));
await caso("la administración da acceso a mano", () => assertSucceeds(setDoc(doc(admin, "matriculas", "otra_master-ia-dam"), { ...gratuita("otra", "master-ia-dam"), origen: "asignada" })));

console.log("Solicitudes, pedidos, códigos y avisos");
const sol = { uid: "lucia", formacionId: "master-ia-dam", mensaje: "Pago por transferencia", estado: "pendiente", fecha: serverTimestamp(), nombre: "Lucía Pérez", email: "lucia@jrotero.es" };
await caso("envía una solicitud", () => assertSucceeds(addDoc(collection(lucia, "solicitudes"), sol)));
await caso("no envía una solicitud ya aceptada", () => assertFails(addDoc(collection(lucia, "solicitudes"), { ...sol, estado: "aceptada" })));
await caso("no ve los pedidos ajenos", () => assertFails(getDoc(doc(lucia, "pedidos", "cs_1"))));
await caso("nadie crea pedidos desde el navegador (ni la administración)", () => assertFails(setDoc(doc(admin, "pedidos", "cs_falso"), { uid: "admin" })));
await caso("el alumnado no puede leer los códigos", () => assertFails(getDoc(doc(lucia, "codigos", "JRO-AAAA-BBBB"))));
await caso("nadie suma usos a un código desde el navegador", () => assertFails(updateDoc(doc(admin, "codigos", "JRO-AAAA-BBBB"), { usos: 0, usosMax: 99 })));
await caso("la administración crea códigos", () => assertSucceeds(setDoc(doc(admin, "codigos", "JRO-CCCC-DDDD"), { formacionId: "curso-claude", usos: 0, usosMax: 10, caduca: null, nota: "", creadoEn: serverTimestamp() })));
await caso("el alumnado lee los avisos pero no publica", async () => {
  await assertSucceeds(getDocs(collection(lucia, "avisos")));
  await assertFails(addDoc(collection(lucia, "avisos"), { titulo: "x", texto: "y" }));
});
await caso("sin sesión no se leen los avisos", () => assertFails(getDocs(collection(anonimo(), "avisos"))));
await caso("borra su propia matrícula al eliminar la cuenta", () => assertSucceeds(deleteDoc(doc(lucia, "matriculas", "lucia_taller-gratis"))));

await env.cleanup();
console.log(`\n${ok} pruebas correctas, ${ko} fallidas`);
process.exit(ko ? 1 : 0);
