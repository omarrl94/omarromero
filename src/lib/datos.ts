import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { Bar, Review, ReviewDraft, TipoAseo } from "./types";

/**
 * Acceso a Cloud Firestore. Todo lo que habla con Firebase vive aquí,
 * para que el resto de la app no sepa de dónde salen los datos.
 *
 * Dos colecciones:
 *   bares/{place_id}
 *   reviews/{place_id}__{aseo}__{user_id}
 *
 * El identificador de la reseña no es casual: al componerlo con esas
 * tres piezas, Firestore impone por sí solo **un voto por persona, bar y
 * aseo**, y las reglas de seguridad pueden comprobar que quien escribe es
 * el dueño sin leer el documento.
 */

/** Cómo se llama el documento de una reseña. */
export function idReview(
  placeId: string,
  aseo: TipoAseo,
  userId: string,
): string {
  return `${placeId}__${aseo}__${userId}`;
}

interface DatosBar {
  nombre?: string;
  direccion?: string;
  lat?: number;
  lng?: number;
}

interface DatosReview {
  place_id?: string;
  aseo?: string;
  user_id?: string | null;
  autor?: string;
  limpieza?: number;
  espacio?: number;
  intimidad?: number;
  suministros?: number;
  comentario?: string;
  fecha?: Timestamp | string;
}

const aBar = (id: string, d: DatosBar): Bar => ({
  place_id: id,
  nombre: d.nombre ?? "Sitio sin nombre",
  direccion: d.direccion ?? "",
  lat: d.lat ?? 0,
  lng: d.lng ?? 0,
});

/** Firestore guarda marcas de tiempo; la app trabaja con ISO. */
function aIso(fecha: DatosReview["fecha"]): string {
  if (!fecha) return new Date().toISOString();
  if (typeof fecha === "string") return fecha;
  return fecha.toDate().toISOString();
}

const aReview = (id: string, d: DatosReview): Review => ({
  id,
  place_id: d.place_id ?? "",
  aseo: (d.aseo ?? "unico") as TipoAseo,
  user_id: d.user_id ?? null,
  autor: d.autor ?? "Anónimo con prisa",
  limpieza: d.limpieza as Review["limpieza"],
  espacio: d.espacio as Review["espacio"],
  intimidad: d.intimidad as Review["intimidad"],
  suministros: d.suministros as Review["suministros"],
  comentario: d.comentario ?? "",
  fecha: aIso(d.fecha),
});

/** Los errores de Firebase llegan en inglés y con código. */
function traducir(e: unknown): string {
  const mensaje = e instanceof Error ? e.message : String(e);
  const texto = mensaje.toLowerCase();
  if (texto.includes("permission-denied") || texto.includes("insufficient permissions"))
    return "Firestore ha denegado la escritura. Entra con tu cuenta y revisa las reglas de seguridad.";
  if (texto.includes("unavailable") || texto.includes("network"))
    return "No hemos podido hablar con Firestore. Mira la conexión.";
  if (texto.includes("not-found") || texto.includes("does not exist"))
    return "Falta la base de datos. Créala en la consola de Firebase (Firestore Database).";
  if (texto.includes("failed-precondition"))
    return "Firestore pide un índice para esta consulta; el enlace para crearlo sale en la consola del navegador.";
  return mensaje;
}

/** Trae bares y reseñas de un tirón. */
export async function cargarTodo(): Promise<{
  bares: Bar[];
  reviews: Review[];
}> {
  const db = getDb();
  if (!db) throw new Error("Sin proyecto de Firebase configurado.");

  try {
    const [bares, reviews] = await Promise.all([
      getDocs(collection(db, "bares")),
      getDocs(query(collection(db, "reviews"), orderBy("fecha", "desc"))),
    ]);

    return {
      bares: bares.docs.map((d) => aBar(d.id, d.data() as DatosBar)),
      reviews: reviews.docs.map((d) => aReview(d.id, d.data() as DatosReview)),
    };
  } catch (e) {
    throw new Error(traducir(e));
  }
}

/**
 * Publica (o actualiza) la reseña de quien firma, fichando antes el bar
 * si todavía no estaba. El identificador compuesto hace que el segundo
 * parte del mismo aseo pise al primero en vez de duplicarlo.
 */
export async function publicarReview({
  bar,
  draft,
  autor,
  userId,
}: {
  bar: Bar;
  draft: ReviewDraft;
  autor: string;
  userId: string;
}): Promise<Review> {
  const db = getDb();
  if (!db) throw new Error("Sin proyecto de Firebase configurado.");

  const id = idReview(bar.place_id, draft.aseo, userId);
  const fecha = new Date();

  try {
    // El bar solo se escribe la primera vez: las reglas prohíben
    // tocarlo después, para que nadie pueda renombrarlo ni moverlo.
    const refBar = doc(db, "bares", bar.place_id);
    if (!(await getDoc(refBar)).exists()) {
      await setDoc(refBar, {
        nombre: bar.nombre,
        direccion: bar.direccion,
        lat: bar.lat,
        lng: bar.lng,
        creado_por: userId,
      });
    }

    const datos = {
      place_id: bar.place_id,
      aseo: draft.aseo,
      user_id: userId,
      autor,
      limpieza: draft.limpieza,
      espacio: draft.espacio,
      intimidad: draft.intimidad,
      suministros: draft.suministros,
      comentario: draft.comentario.trim(),
      fecha: Timestamp.fromDate(fecha),
    };
    await setDoc(doc(db, "reviews", id), datos);

    return aReview(id, datos);
  } catch (e) {
    throw new Error(traducir(e));
  }
}

/** Retira tu propia reseña. */
export async function borrarReview(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Sin proyecto de Firebase configurado.");
  try {
    await deleteDoc(doc(db, "reviews", id));
  } catch (e) {
    throw new Error(traducir(e));
  }
}
