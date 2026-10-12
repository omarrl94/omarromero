import { getSupabase } from "./supabase";
import type { Bar, Review, ReviewDraft } from "./types";

/**
 * Acceso a la base de datos. Todo lo que habla con Supabase vive aquí,
 * para que el resto de la app no sepa de dónde salen los datos.
 */

interface FilaBar {
  place_id: string;
  nombre: string;
  direccion: string | null;
  lat: number;
  lng: number;
}

interface FilaReview {
  id: string;
  place_id: string;
  user_id: string | null;
  autor: string;
  limpieza: number;
  espacio: number;
  intimidad: number;
  suministros: number;
  comentario: string | null;
  fecha: string;
}

const aBar = (fila: FilaBar): Bar => ({
  place_id: fila.place_id,
  nombre: fila.nombre,
  direccion: fila.direccion ?? "",
  lat: fila.lat,
  lng: fila.lng,
});

const aReview = (fila: FilaReview): Review => ({
  id: fila.id,
  place_id: fila.place_id,
  user_id: fila.user_id,
  autor: fila.autor,
  limpieza: fila.limpieza as Review["limpieza"],
  espacio: fila.espacio as Review["espacio"],
  intimidad: fila.intimidad as Review["intimidad"],
  suministros: fila.suministros as Review["suministros"],
  comentario: fila.comentario ?? "",
  fecha: fila.fecha,
});

/** Mensajes de Postgres traducidos a algo que se pueda leer en la barra. */
function traducir(mensaje: string): string {
  const texto = mensaje.toLowerCase();
  if (texto.includes("row-level security"))
    return "Necesitas sesión para publicar. Entra y vuelve a intentarlo.";
  if (texto.includes("does not exist") || texto.includes("schema cache"))
    return "Faltan las tablas. Ejecuta supabase/schema.sql en el SQL Editor.";
  if (texto.includes("fetch") || texto.includes("network"))
    return "No hemos podido hablar con la base de datos. Mira la conexión.";
  if (texto.includes("violates check constraint"))
    return "Esa valoración no cuadra: las notas van de 1 a 5.";
  return mensaje;
}

/** Trae bares y reseñas de un tirón. */
export async function cargarTodo(): Promise<{
  bares: Bar[];
  reviews: Review[];
}> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Sin proyecto de Supabase configurado.");

  const [resBares, resReviews] = await Promise.all([
    supabase.from("bares").select("place_id,nombre,direccion,lat,lng"),
    supabase
      .from("reviews")
      .select(
        "id,place_id,user_id,autor,limpieza,espacio,intimidad,suministros,comentario,fecha",
      )
      .order("fecha", { ascending: false }),
  ]);

  if (resBares.error) throw new Error(traducir(resBares.error.message));
  if (resReviews.error) throw new Error(traducir(resReviews.error.message));

  return {
    bares: ((resBares.data ?? []) as FilaBar[]).map(aBar),
    reviews: ((resReviews.data ?? []) as FilaReview[]).map(aReview),
  };
}

/**
 * Publica (o actualiza) la reseña de quien firma, fichando antes el bar
 * si todavía no estaba en la base. Un voto por persona y bar: el
 * segundo pisa al primero.
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
  const supabase = getSupabase();
  if (!supabase) throw new Error("Sin proyecto de Supabase configurado.");

  const { error: errorBar } = await supabase
    .from("bares")
    .upsert({ ...bar, creado_por: userId }, {
      onConflict: "place_id",
      ignoreDuplicates: true,
    });
  if (errorBar) throw new Error(traducir(errorBar.message));

  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      {
        place_id: bar.place_id,
        user_id: userId,
        autor,
        limpieza: draft.limpieza,
        espacio: draft.espacio,
        intimidad: draft.intimidad,
        suministros: draft.suministros,
        comentario: draft.comentario.trim(),
        fecha: new Date().toISOString(),
      },
      { onConflict: "place_id,user_id" },
    )
    .select()
    .single();

  if (error) throw new Error(traducir(error.message));
  return aReview(data as FilaReview);
}

/** Retira tu propia reseña. */
export async function borrarReview(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Sin proyecto de Supabase configurado.");
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error(traducir(error.message));
}
