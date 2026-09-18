"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BARES_MOCK, REVIEWS_MOCK } from "./mock-data";
import { componerBar } from "./scores";
import type { Bar, BarConNota, Review, ReviewDraft } from "./types";

/**
 * Estado global del MVP.
 *
 * De momento vive en memoria + localStorage; el día que haya backend
 * basta con sustituir el cuerpo de este provider por llamadas a la API
 * (el esquema `Bar` / `Review` ya está pensado para una tabla real).
 */

const CLAVE_ALMACEN = "rollo-madrid:v1";

interface Almacen {
  bares: Bar[];
  reviews: Review[];
}

interface RolloContexto {
  /** Todos los bares con sus notas ya calculadas. */
  bares: BarConNota[];
  /** Solo los que tienen al menos una reseña (los que van al mapa). */
  baresValorados: BarConNota[];
  /** Busca un bar concreto por Place ID. */
  getBar: (placeId: string) => BarConNota | null;
  /** Adopta un bar de Google Places si aún no lo teníamos. */
  adoptarBar: (bar: Bar) => void;
  /** Guarda una valoración nueva. */
  añadirReview: (placeId: string, draft: ReviewDraft) => void;
  /** false hasta que se lee localStorage (evita parpadeos de hidratación). */
  listo: boolean;
}

const Contexto = createContext<RolloContexto | null>(null);

function leerAlmacen(): Almacen {
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
    // Los mocks se reinyectan siempre para que la demo nunca quede vacía.
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
  const [almacen, setAlmacen] = useState<Almacen>(() => ({
    bares: [...BARES_MOCK],
    reviews: [...REVIEWS_MOCK],
  }));
  const [listo, setListo] = useState(false);

  // La lectura se hace tras montar para que el HTML del servidor y el
  // del cliente coincidan.
  useEffect(() => {
    setAlmacen(leerAlmacen());
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    try {
      window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(almacen));
    } catch {
      // Modo incógnito o cuota llena: la app sigue funcionando en memoria.
    }
  }, [almacen, listo]);

  const adoptarBar = useCallback((bar: Bar) => {
    setAlmacen((prev) => {
      if (prev.bares.some((b) => b.place_id === bar.place_id)) return prev;
      return { ...prev, bares: [...prev.bares, bar] };
    });
  }, []);

  const añadirReview = useCallback((placeId: string, draft: ReviewDraft) => {
    const review: Review = {
      id: crearId(),
      place_id: placeId,
      limpieza: draft.limpieza,
      espacio: draft.espacio,
      intimidad: draft.intimidad,
      suministros: draft.suministros,
      comentario: draft.comentario.trim(),
      autor: draft.autor.trim() || "Rollo Anónimo",
      fecha: new Date().toISOString(),
    };
    setAlmacen((prev) => ({ ...prev, reviews: [...prev.reviews, review] }));
  }, []);

  const bares = useMemo(
    () => almacen.bares.map((bar) => componerBar(bar, almacen.reviews)),
    [almacen],
  );

  const baresValorados = useMemo(
    () => bares.filter((b) => b.reviews.length > 0),
    [bares],
  );

  const getBar = useCallback(
    (placeId: string) => bares.find((b) => b.bar.place_id === placeId) ?? null,
    [bares],
  );

  const valor = useMemo<RolloContexto>(
    () => ({ bares, baresValorados, getBar, adoptarBar, añadirReview, listo }),
    [bares, baresValorados, getBar, adoptarBar, añadirReview, listo],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useRollo(): RolloContexto {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useRollo debe usarse dentro de <RolloProvider>");
  return ctx;
}
