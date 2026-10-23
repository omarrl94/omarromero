#!/usr/bin/env node
/**
 * Prueba las reglas de Firestore contra el emulador.
 *
 *   npm i -D firebase-tools @firebase/rules-unit-testing
 *   npx firebase-tools emulators:exec --only firestore "node scripts/probar-reglas.mjs"
 *
 * Comprueba lo que de verdad importa: que leer es libre, que escribir
 * exige sesión, que nadie firma en nombre de otro ni toca partes ajenos,
 * y que un bar fichado no se puede renombrar ni borrar.
 */

import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";

const UNO = "uuuuuuuuuuuuuuuuuuuuuuuu1111";
const OTRO = "oooooooooooooooooooooooo2222";
const BAR = "ChIJ-pruebas";

const review = (extra = {}) => ({
  place_id: BAR,
  aseo: "femenino",
  user_id: UNO,
  autor: "Prueba",
  limpieza: 4,
  espacio: 3,
  intimidad: 5,
  suministros: 4,
  comentario: "Cumple.",
  fecha: Timestamp.now(),
  ...extra,
});

const idDe = (uid, aseo = "femenino") => `${BAR}__${aseo}__${uid}`;

const entorno = await initializeTestEnvironment({
  projectId: "rollo-madrid-pruebas",
  firestore: {
    rules: readFileSync("firebase/firestore.rules", "utf8"),
    host: "127.0.0.1",
    port: 8080,
  },
});

await entorno.clearFirestore();

const anonimo = entorno.unauthenticatedContext().firestore();
const uno = entorno.authenticatedContext(UNO).firestore();
const otro = entorno.authenticatedContext(OTRO).firestore();

const casos = [];
const prueba = async (nombre, fn) => {
  try {
    await fn();
    casos.push(`✓ ${nombre}`);
  } catch (e) {
    casos.push(`✗ ${nombre} — ${String(e).slice(0, 110)}`);
    process.exitCode = 1;
  }
};

// Un bar y una reseña de partida, escritos saltándose las reglas.
await entorno.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, "bares", BAR), {
    nombre: "Bar de Pruebas",
    direccion: "C. Falsa, 1",
    lat: 40.41,
    lng: -3.7,
    creado_por: UNO,
  });
  await setDoc(doc(db, "reviews", idDe(UNO)), review());
});

await prueba("cualquiera lee los bares", () =>
  assertSucceeds(getDoc(doc(anonimo, "bares", BAR))),
);
await prueba("cualquiera lee las reseñas", () =>
  assertSucceeds(getDoc(doc(anonimo, "reviews", idDe(UNO)))),
);
await prueba("sin sesión no se publica", () =>
  assertFails(setDoc(doc(anonimo, "reviews", idDe(UNO)), review())),
);
await prueba("con sesión se corrige lo propio", () =>
  assertSucceeds(
    setDoc(doc(uno, "reviews", idDe(UNO)), review({ limpieza: 2 })),
  ),
);
await prueba("no se firma en nombre de otro", () =>
  assertFails(
    setDoc(doc(otro, "reviews", idDe(OTRO)), review({ user_id: UNO })),
  ),
);
await prueba("el identificador tiene que cuadrar con quien escribe", () =>
  assertFails(
    setDoc(doc(otro, "reviews", idDe(UNO)), review({ user_id: OTRO })),
  ),
);
await prueba("otro no edita tu parte", () =>
  assertFails(
    setDoc(doc(otro, "reviews", idDe(UNO)), review({ comentario: "Pisado" })),
  ),
);
await prueba("otro no borra tu parte", () =>
  assertFails(deleteDoc(doc(otro, "reviews", idDe(UNO)))),
);
await prueba("tú sí retiras lo tuyo", () =>
  assertSucceeds(deleteDoc(doc(uno, "reviews", idDe(UNO)))),
);
await prueba("una nota fuera de rango se rechaza", () =>
  assertFails(
    setDoc(doc(uno, "reviews", idDe(UNO)), review({ limpieza: 9 })),
  ),
);
await prueba("un aseo inventado se rechaza", () =>
  assertFails(
    setDoc(doc(uno, "reviews", `${BAR}__mixto__${UNO}`), review({ aseo: "mixto" })),
  ),
);
await prueba("un comentario kilométrico se rechaza", () =>
  assertFails(
    setDoc(doc(uno, "reviews", idDe(UNO)), review({ comentario: "x".repeat(401) })),
  ),
);
await prueba("fichar un bar nuevo exige ir firmado", () =>
  assertFails(
    setDoc(doc(uno, "bares", "ChIJ-otro"), {
      nombre: "Otro",
      direccion: "C. Otra, 2",
      lat: 40.4,
      lng: -3.7,
      creado_por: OTRO,
    }),
  ),
);
await prueba("fichar un bar propio funciona", () =>
  assertSucceeds(
    setDoc(doc(uno, "bares", "ChIJ-otro"), {
      nombre: "Otro",
      direccion: "C. Otra, 2",
      lat: 40.4,
      lng: -3.7,
      creado_por: UNO,
    }),
  ),
);
await prueba("un bar fichado no se renombra", () =>
  assertFails(
    setDoc(doc(uno, "bares", BAR), {
      nombre: "Secuestrado",
      direccion: "C. Falsa, 1",
      lat: 40.41,
      lng: -3.7,
      creado_por: UNO,
    }),
  ),
);
await prueba("un bar fichado no se borra", () =>
  assertFails(deleteDoc(doc(uno, "bares", BAR))),
);
await prueba("nada fuera de bares y reviews", () =>
  assertFails(setDoc(doc(uno, "otracosa", "x"), { a: 1 })),
);

console.log(casos.join("\n"));
console.log(
  `\n${casos.filter((c) => c.startsWith("✓")).length} de ${casos.length} comprobaciones en orden.`,
);

await entorno.cleanup();
