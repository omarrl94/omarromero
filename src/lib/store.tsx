"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { HAY_FIREBASE } from "./config";
import { borrarReview, cargarTodo, publicarReview as publicarRemota } from "./datos";
import { BARES_MOCK, REVIEWS_MOCK } from "./mock-data";
import { componerBar, type FiltroAseo } from "./scores";
import type { Bar, BarConNota, Review, ReviewDraft, TipoAseo } from "./types";

/**
 * Estado de bares y reseñas, con dos orígenes posibles:
 *
 *   · firebase → Cloud Firestore, compartido entre todos.
 *   · local    → mocks + localStorage, para poder trabajar sin montar
 *                nada. Lo que escribas se queda en tu navegador.
 */

const CLAVE_ALMACEN = "rollo-madrid:v1";
/** Copia de lo último que se leyó de Firestore, para abrir sin cobertura. */
const CLAVE_CACHE = "rollo-madrid:cache-remota";

export type ModoDatos = "firebase" | "local";

interface Resultado {
  ok: boolean;
  mensaje?: string;
}

interface Almacen {
  bares: Bar[];
  reviews: Review[];
}

interface RolloContexto {
  bares: BarConNota[];
  /** Los que tienen al menos una reseña: son los que van al mapa. */
  baresValorados: BarConNota[];
  getBar: (placeId: string) => BarConNota | null;
  /** La reseña que esa persona ya escribió de ese aseo, si la hay. */
  miReview: (
    placeId: string,
    userId: string | null,
    aseo: TipoAseo,
  ) => Review | null;
  /** Qué aseo manda en el mapa, el ranking y las fichas. */
  filtroAseo: FiltroAseo;
  setFiltroAseo: (filtro: FiltroAseo) => void;
  /** Deja el bar a la vista; se guarda de verdad al publicar. */
  adoptarBar: (bar: Bar) => void;
  publicarReview: (
    bar: Bar,
    draft: ReviewDraft,
    firma: { autor: string; userId: string | null },
  ) => Promise<Resultado>;
  retirarReview: (review: Review) => Promise<Resultado>;
  recargar: () => Promise<void>;
  /** false hasta la primera carga (localStorage o base de datos). */
  listo: boolean;
  modoDatos: ModoDatos;
  /** Qué ha fallado al leer la base de datos, si es que ha fallado. */
  errorDatos: string | null;
}

const Contexto = createContext<RolloContexto | null>(null);

/** Lee el almacén local, reinyectando siempre los mocks de ejemplo. */
function leerLocal(): Almacen {
  const inicial: Almacen = {
    bares: [...BARES_MOCK],
    reviews: [...REVIEWS_MOCK],
  };
  if (typeof window === "undefined") return inicial;

  try {
    const crudo = window.localStorage.getItem(CLAVE_ALMACEN);
    if (!crudo) return inicial;
    const guardado = JSON.parse(crudo) as Partial<Almacen>;
    if (!Array.isArray(guardado.bares) || !Array.isArray(guardado.reviews)) {
      return inicial;
    }
    const bares = [...guardado.bares];
    for (const mock of BARES_MOCK) {
      if (!bares.some((b) => b.place_id === mock.place_id)) bares.push(mock);
    }
    const reviews = [...guardado.reviews];
    for (const mock of REVIEWS_MOCK) {
      if (!reviews.some((r) => r.id === mock.id)) reviews.push(mock);
    }
    return { bares, reviews };
  } catch {
    return inicial;
  }
}

function crearId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function RolloProvider({ children }: { children: React.ReactNode }) {
  const modoDatos: ModoDatos = HAY_FIREBASE ? "firebase" : "local";
  const [almacen, setAlmacen] = useState<Almacen>({ bares: [], reviews: [] });
  const [listo, setListo] = useState(false);
  const [errorDatos, setErrorDatos] = useState<string | null>(null);
  const [filtroAseo, setFiltroAseo] = useState<FiltroAseo>("todos");

  const recargar = useCallback(async () => {
    if (modoDatos === "local") {
      setAlmacen(leerLocal());
      setErrorDatos(null);
      setListo(true);
      return;
    }
    try {
      const datos = await cargarTodo();
      setAlmacen(datos);
      setErrorDatos(null);
      // Se guarda para la próxima vez que se abra sin cobertura.
      try {
        window.localStorage.setItem(CLAVE_CACHE, JSON.stringify(datos));
      } catch {
        // Sin almacenamiento, simplemente no habrá copia.
      }
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : "No se ha podido leer la base de datos.";
      // Si hay copia de la última vez, la app abre con ella en vez de
      // quedarse en blanco. Se avisa de que puede estar vieja.
      let huboCache = false;
      try {
        const crudo = window.localStorage.getItem(CLAVE_CACHE);
        if (crudo) {
          const copia = JSON.parse(crudo) as Almacen;
          if (Array.isArray(copia.bares) && Array.isArray(copia.reviews)) {
            setAlmacen(copia);
            huboCache = true;
          }
        }
      } catch {
        // Copia ilegible: se ignora.
      }
      setErrorDatos(
        huboCache
          ? `${mensaje} Estás viendo la última copia guardada en este dispositivo.`
          : mensaje,
      );
    } finally {
      setListo(true);
    }
  }, [modoDatos]);

  // La primera carga va tras montar: así el HTML del servidor y el del
  // cliente coinciden aunque haya datos guardados.
  useEffect(() => {
    void recargar();
  }, [recargar]);

  // En modo local, todo cambio se guarda en el navegador.
  useEffect(() => {
    if (!listo || modoDatos !== "local") return;
    try {
      window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(almacen));
    } catch {
      // Incógnito o cuota llena: seguimos en memoria.
    }
  }, [almacen, listo, modoDatos]);

  const adoptarBar = useCallback((bar: Bar) => {
    setAlmacen((prev) => {
      if (prev.bares.some((b) => b.place_id === bar.place_id)) return prev;
      return { ...prev, bares: [...prev.bares, bar] };
    });
  }, []);

  const publicarReview = useCallback(
    async (
      bar: Bar,
      draft: ReviewDraft,
      firma: { autor: string; userId: string | null },
    ): Promise<Resultado> => {
      const autor = firma.autor.trim() || "Anónimo con prisa";

      if (modoDatos === "firebase") {
        if (!firma.userId) {
          return { ok: false, mensaje: "Entra con tu cuenta para publicar." };
        }
        try {
          const review = await publicarRemota({
            bar,
            draft,
            autor,
            userId: firma.userId,
          });
          setAlmacen((prev) => ({
            bares: prev.bares.some((b) => b.place_id === bar.place_id)
              ? prev.bares
              : [...prev.bares, bar],
            // El upsert puede haber sustituido la reseña anterior.
            reviews: [
              review,
              ...prev.reviews.filter((r) => r.id !== review.id),
            ],
          }));
          return { ok: true };
        } catch (e) {
          return {
            ok: false,
            mensaje: e instanceof Error ? e.message : "No se ha podido publicar.",
          };
        }
      }

      const review: Review = {
        id: crearId(),
        place_id: bar.place_id,
        aseo: draft.aseo,
        user_id: firma.userId,
        autor,
        limpieza: draft.limpieza,
        espacio: draft.espacio,
        intimidad: draft.intimidad,
        suministros: draft.suministros,
        comentario: draft.comentario.trim(),
        fecha: new Date().toISOString(),
      };
      setAlmacen((prev) => ({
        bares: prev.bares.some((b) => b.place_id === bar.place_id)
          ? prev.bares
          : [...prev.bares, bar],
        reviews: [
          review,
          // Un voto por persona y bar, también en modo local.
          ...prev.reviews.filter(
            (r) =>
              !(
                r.place_id === bar.place_id &&
                r.aseo === draft.aseo &&
                firma.userId !== null &&
                r.user_id === firma.userId
              ),
          ),
        ],
      }));
      return { ok: true };
    },
    [modoDatos],
  );

  const retirarReview = useCallback(
    async (review: Review): Promise<Resultado> => {
      if (modoDatos === "firebase") {
        try {
          await borrarReview(review.id);
        } catch (e) {
          return {
            ok: false,
            mensaje: e instanceof Error ? e.message : "No se ha podido retirar.",
          };
        }
      }
      setAlmacen((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((r) => r.id !== review.id),
      }));
      return { ok: true };
    },
    [modoDatos],
  );

  const bares = useMemo(
    () =>
      almacen.bares.map((bar) =>
        componerBar(bar, almacen.reviews, filtroAseo),
      ),
    [almacen, filtroAseo],
  );

  const baresValorados = useMemo(
    () => bares.filter((b) => b.reviews.length > 0),
    [bares],
  );

  const getBar = useCallback(
    (placeId: string) => bares.find((b) => b.bar.place_id === placeId) ?? null,
    [bares],
  );

  const miReview = useCallback(
    (placeId: string, userId: string | null, aseo: TipoAseo) =>
      userId === null
        ? null
        : (almacen.reviews.find(
            (r) =>
              r.place_id === placeId &&
              r.user_id === userId &&
              r.aseo === aseo,
          ) ?? null),
    [almacen.reviews],
  );

  const valor = useMemo<RolloContexto>(
    () => ({
      bares,
      baresValorados,
      getBar,
      miReview,
      filtroAseo,
      setFiltroAseo,
      adoptarBar,
      publicarReview,
      retirarReview,
      recargar,
      listo,
      modoDatos,
      errorDatos,
    }),
    [
      bares,
      baresValorados,
      getBar,
      miReview,
      filtroAseo,
      setFiltroAseo,
      adoptarBar,
      publicarReview,
      retirarReview,
      recargar,
      listo,
      modoDatos,
      errorDatos,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useRollo(): RolloContexto {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useRollo debe usarse dentro de <RolloProvider>");
  return ctx;
}
