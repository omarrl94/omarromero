#!/usr/bin/env node
/**
 * Siembra Firestore con cinco clásicos de Madrid, para que el mapa no
 * nazca vacío. Opcional: si no lo ejecutas, la app arranca sin datos y
 * el primer parte que se publique estrena la base.
 *
 *   npm i -D firebase-admin
 *   GOOGLE_APPLICATION_CREDENTIALS=/ruta/clave-servicio.json \
 *     node scripts/sembrar-firestore.mjs
 *
 * Hace falta una clave de cuenta de servicio porque las reseñas de
 * ejemplo no tienen dueño, y las reglas (con razón) no dejan crear eso
 * desde el navegador. La clave es SECRETA: no la subas al repositorio.
 *
 * Es idempotente: vuelve a ejecutarlo y no duplica nada.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

let admin;
try {
  admin = await import("firebase-admin");
} catch {
  console.error(
    "\nFalta firebase-admin. Instálalo solo para sembrar:\n" +
      "  npm i -D firebase-admin\n",
  );
  process.exit(1);
}

if (!process.env["GOOGLE_APPLICATION_CREDENTIALS"]) {
  console.error(
    "\nFalta GOOGLE_APPLICATION_CREDENTIALS con la ruta a la clave de la\n" +
      "cuenta de servicio (Firebase → Configuración → Cuentas de servicio →\n" +
      "Generar nueva clave privada). No la guardes en el repositorio.\n",
  );
  process.exit(1);
}

const semilla = JSON.parse(
  readFileSync(join(RAIZ, "firebase/semilla.json"), "utf8"),
);

admin.default.initializeApp({
  credential: admin.default.credential.applicationDefault(),
});
const db = admin.default.firestore();

const haceDias = (dias) => new Date(Date.now() - dias * 86_400_000);

let bares = 0;
for (const bar of semilla.bares) {
  const { place_id: id, ...datos } = bar;
  const ref = db.collection("bares").doc(id);
  if ((await ref.get()).exists) continue;
  await ref.set({ ...datos, creado_por: null });
  bares += 1;
}

let reviews = 0;
for (const review of semilla.reviews) {
  const { id, dias, ...datos } = review;
  const ref = db.collection("reviews").doc(id);
  if ((await ref.get()).exists) continue;
  await ref.set({
    ...datos,
    user_id: null,
    fecha: admin.default.firestore.Timestamp.fromDate(haceDias(dias)),
  });
  reviews += 1;
}

console.log(
  `✓ Semilla lista: ${bares} bares y ${reviews} reseñas nuevas ` +
    `(lo que ya estaba se ha dejado en paz).`,
);
