"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useCallback, useMemo, useState } from "react";
import { useArranqueNativo, useBotonAtras } from "@/hooks/useAppNativa";
import { useUbicacion } from "@/hooks/useUbicacion";
import { useAuth } from "@/lib/auth";
import { formatearDistancia, metrosEntre } from "@/lib/distancia";
import { ASEOS, type FiltroAseo } from "@/lib/scores";
import { GOOGLE_MAPS_API_KEY, HAY_API_KEY } from "@/lib/config";
import { formatearNota } from "@/lib/scores";
import { useRollo } from "@/lib/store";
import type { Bar } from "@/lib/types";
import { MapaSimulado } from "./MapaSimulado";
import { Cabecera } from "./Cabecera";
import { FichaBar } from "./FichaBar";
import { MapaRollos, type Objetivo } from "./MapaRollos";
import { ModalAcceso } from "./ModalAcceso";
import { Ranking } from "./Ranking";
import { Ticker } from "./Ticker";
import { MapPin, Loader2 } from "lucide-react";

/**
 * La app entera: cabecera con buscador, titular, mapa de Google, podio,
 * lista negra y la ficha del baño como cartel.
 */
export function RolloApp() {
  const {
    bares,
    baresValorados,
    getBar,
    adoptarBar,
    listo,
    modoDatos,
    errorDatos,
    recargar,
    filtroAseo,
    setFiltroAseo,
  } = useRollo();
  const { usuario } = useAuth();
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [valorandoAlAbrir, setValorandoAlAbrir] = useState(false);
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null);
  const [errorApi, setErrorApi] = useState(false);
  const [brindis, setBrindis] = useState<string | null>(null);
  const [motivoAcceso, setMotivoAcceso] = useState<string | null>(null);
  const {
    estado: estadoUbicacion,
    posicion,
    pedir: pedirUbicacion,
  } = useUbicacion();

  const avisar = useCallback((texto: string) => {
    setBrindis(texto);
    window.setTimeout(() => setBrindis((previo) => (previo === texto ? null : previo)), 3600);
  }, []);

  /** Abre un bar: lo adopta si viene de Google, centra el mapa y saca la ficha. */
  const abrirBar = useCallback(
    (bar: Bar, valorando = false) => {
      const nuevo = !bares.some((b) => b.bar.place_id === bar.place_id);
      adoptarBar(bar);
      setSeleccion(bar.place_id);
      setValorandoAlAbrir(valorando || nuevo);
      setObjetivo({ lat: bar.lat, lng: bar.lng, sello: Date.now() });
      if (nuevo) avisar("Bar fichado. Ahora estrénale el baño.");
    },
    [adoptarBar, avisar, bares],
  );

  const ordenados = useMemo(
    () => [...baresValorados].sort((a, b) => (b.media ?? 0) - (a.media ?? 0)),
    [baresValorados],
  );
  /** Metros desde donde estás hasta cada bar fichado. */
  const distancias = useMemo(() => {
    const mapa = new Map<string, number>();
    if (!posicion) return mapa;
    for (const b of ordenados) {
      mapa.set(b.bar.place_id, metrosEntre(posicion, b.bar));
    }
    return mapa;
  }, [ordenados, posicion]);

  /** Los tres más cercanos, estén como estén. */
  const cercanos = useMemo(() => {
    if (!posicion) return [];
    return [...ordenados]
      .sort(
        (a, b) =>
          (distancias.get(a.bar.place_id) ?? Infinity) -
          (distancias.get(b.bar.place_id) ?? Infinity),
      )
      .slice(0, 3);
  }, [ordenados, posicion, distancias]);

  const podio = ordenados.slice(0, 3);
  const listaNegra = [...ordenados]
    .reverse()
    .filter((b) => (b.media ?? 5) < 3)
    .slice(0, 3);

  const notaMedia =
    ordenados.length > 0
      ? ordenados.reduce((acc, b) => acc + (b.media ?? 0), 0) / ordenados.length
      : null;
  const oros = ordenados.filter((b) => b.esRolloDeOro).length;

  /**
   * Con ubicación, el baño decente (3,5 o más) que menos te cuesta
   * llegar; si ninguno aprueba, el más cercano a secas. Sin ubicación,
   * el mejor valorado.
   */
  const modoUrgencia = () => {
    if (ordenados.length === 0) {
      avisar("No hay ningún baño fichado todavía.");
      return;
    }

    if (!posicion) {
      const mejor = podio[0];
      if (!mejor) return;
      abrirBar(mejor.bar);
      avisar(`El más decente ahora mismo: ${mejor.bar.nombre}`);
      if (estadoUbicacion === "inactiva") pedirUbicacion();
      return;
    }

    const porCercania = [...ordenados].sort(
      (a, b) =>
        (distancias.get(a.bar.place_id) ?? Infinity) -
        (distancias.get(b.bar.place_id) ?? Infinity),
    );
    const elegido =
      porCercania.find((b) => (b.media ?? 0) >= 3.5) ?? porCercania[0];
    if (!elegido) return;

    const metros = distancias.get(elegido.bar.place_id);
    abrirBar(elegido.bar);
    avisar(
      metros !== undefined
        ? `A ${formatearDistancia(metros)}: ${elegido.bar.nombre}`
        : elegido.bar.nombre,
    );
  };

  // Dentro de la app: barra de estado, pantalla de carga y botón atrás.
  useArranqueNativo(listo);
  useBotonAtras(
    useCallback(() => {
      if (motivoAcceso !== null) {
        setMotivoAcceso(null);
        return true;
      }
      if (seleccion !== null) {
        setSeleccion(null);
        setValorandoAlAbrir(false);
        return true;
      }
      return false;
    }, [motivoAcceso, seleccion]),
  );

  const barSeleccionado = seleccion ? getBar(seleccion) : null;
  const mapaUtilizable = HAY_API_KEY && !errorApi;

  const contenido = (
    <>
      <a
        href="#mapa"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:bg-acido focus:px-4 focus:py-2.5 focus:font-extrabold focus:text-black"
      >
        Saltar al mapa
      </a>

      <Cabecera
        onElegirBar={(bar) => abrirBar(bar)}
        onPedirAcceso={() => setMotivoAcceso("")}
      />
      <Ticker />

      {errorDatos && (
        <div
          role="alert"
          className="relative z-10 border-b-2 border-black bg-alarma px-4 py-2.5 text-white"
        >
          <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-3 text-sm">
            <b className="grito text-base">La base de datos no contesta</b>
            <span className="font-mono text-[11.5px]">{errorDatos}</span>
            <button
              type="button"
              onClick={() => void recargar()}
              className="btn btn-papel ml-auto px-3 py-1.5 text-sm"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      <main className="relative z-10">
        <section className="mx-auto w-full max-w-[1240px] px-4 pb-5 pt-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-acido">
            Madrid · 2.847 bares · un solo baño decente por manzana
          </p>
          <h1 className="grito mt-3 text-[clamp(30px,7.2vw,80px)] leading-[0.94]">
            Antes de entrar
            <br />a ese baño,
            <br />
            <span className="text-acido [text-shadow:0_0_22px_rgba(198,255,61,0.45)]">
              mira la nota
            </span>{" "}
            <span className="text-marca [-webkit-text-stroke:1px_#000]">y reza</span>
          </h1>
          <p className="mt-4 max-w-[62ch] text-[16.5px] text-papel-apagado">
            El mapa que la hostelería de Madrid no quiere que exista.{" "}
            <b className="text-papel">
              Limpieza, espacio, intimidad y suministros
            </b>
            , puntuados por quienes han estado ahí dentro. Sin filtros, sin
            postureo y sin perfumes de mentira.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button type="button" onClick={modoUrgencia} className="btn btn-alarma">
              🚨 Modo urgencia
            </button>
            <a href="#ranking" className="btn btn-acido no-underline">
              Ver el ranking
            </a>
            {estadoUbicacion !== "lista" && (
              <button
                type="button"
                onClick={pedirUbicacion}
                disabled={estadoUbicacion === "pidiendo"}
                className="btn btn-papel"
              >
                {estadoUbicacion === "pidiendo" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {estadoUbicacion === "pidiendo"
                  ? "Buscándote…"
                  : "Los más cercanos"}
              </button>
            )}
            {!usuario && (
              <button
                type="button"
                onClick={() =>
                  setMotivoAcceso(
                    "Regístrate para firmar partes. Leer el mapa no exige nada.",
                  )
                }
                className="btn btn-papel"
              >
                Regístrate y colabora
              </button>
            )}
          </div>

          {estadoUbicacion === "lista" && (
            <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-acido">
              <MapPin className="h-3.5 w-3.5" />
              Ubicación activa: el ranking y el modo urgencia van por cercanía.
            </p>
          )}
          {(estadoUbicacion === "denegada" || estadoUbicacion === "no-disponible") && (
            <p className="mt-3 font-mono text-[11px] text-papel-apagado">
              {estadoUbicacion === "denegada"
                ? "Sin ubicación: la has denegado, y se respeta. Puedes darla desde el candado de la barra de direcciones."
                : "Tu navegador no da ubicación. Todo lo demás funciona igual."}
            </p>
          )}

          {usuario && (
            <p className="mt-3 font-mono text-[11px] text-papel-apagado">
              Firmas como <b className="text-acido">{usuario.alias}</b>. Cuenta
              lo que te encuentres.
            </p>
          )}

          <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(108px,1fr))] gap-2.5">
            <Cifra
              valor={String(ordenados.length)}
              cargando={!listo}
              etiqueta={
                filtroAseo === "todos"
                  ? "Baños fichados"
                  : `Baños ${ASEOS.find((a) => a.key === filtroAseo)?.label.toLowerCase()}`
              }
              color="text-marca"
            />
            <Cifra
              valor={formatearNota(notaMedia)}
              cargando={!listo}
              etiqueta="Nota media"
              color={notaMedia !== null && notaMedia >= 3 ? "text-acido" : "text-ambar"}
            />
            <Cifra
              valor={String(oros)}
              cargando={!listo}
              etiqueta="Rollos de Oro"
              color="text-ambar"
            />
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1240px] px-4 pb-4">
          <div className="flex flex-wrap items-center gap-2 border-2 border-borde bg-asfalto-800 p-2.5">
            <span className="px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-papel-apagado">
              Enséñame el baño
            </span>
            {([
              { key: "todos", label: "Todos", simbolo: "" },
              ...ASEOS.map(({ key, label, simbolo }) => ({ key, label, simbolo })),
            ] as { key: FiltroAseo; label: string; simbolo: string }[]).map(
              ({ key, label, simbolo }) => {
                const activo = filtroAseo === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setFiltroAseo(key)}
                    className={`grito min-h-[44px] border-2 px-3.5 py-1.5 text-sm ${
                      activo
                        ? "border-black bg-acido text-asfalto-900 shadow-dura-s"
                        : "border-borde text-papel-apagado hover:border-papel hover:text-papel"
                    }`}
                  >
                    {simbolo} {label}
                  </button>
                );
              },
            )}
            {filtroAseo !== "todos" && (
              <span className="ml-auto px-1 font-mono text-[10.5px] text-acido">
                Notas y pines solo del aseo {ASEOS.find((a) => a.key === filtroAseo)?.label.toLowerCase()}
              </span>
            )}
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1240px] gap-4 px-4 pb-10 lg:grid-cols-[1.35fr_1fr]">
          <section
            className="panel flex min-w-0 flex-col"
            aria-label="Mapa de baños"
            id="mapa"
          >
            <header className="flex items-center justify-between gap-3 border-b-[3px] border-black bg-papel px-3.5 py-2.5 text-asfalto-900">
              <h2 className="grito text-lg">El mapa</h2>
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-asfalto-600">
                Centro de Madrid
              </span>
            </header>
            <div className="relative min-h-[380px] flex-1 bg-asfalto-950 lg:min-h-[560px]">
              {mapaUtilizable ? (
                <MapaRollos
                  bares={baresValorados}
                  posicion={posicion}
                  seleccion={seleccion}
                  objetivo={objetivo}
                  onElegir={(bar) => abrirBar(bar)}
                  onFondo={() => setSeleccion(null)}
                />
              ) : (
                <MapaSimulado
                  bares={baresValorados}
                  posicion={posicion}
                  seleccion={seleccion}
                  error={errorApi}
                  onElegir={(bar) => abrirBar(bar)}
                />
              )}
            </div>
          </section>

          <div className="grid min-w-0 content-start gap-4" id="ranking">
            {posicion && (
              <Ranking
                titulo="Cerca de ti"
                subtitulo="A un paseo de donde estás"
                bares={cercanos}
                seleccion={seleccion}
                vacio="No hay nada fichado a tu alrededor todavía."
                cargando={!listo}
                tono="cerca"
                distancias={distancias}
                onElegir={(bar) => abrirBar(bar)}
              />
            )}
            <Ranking
              titulo="El podio"
              subtitulo="Los que salvan la noche"
              bares={podio}
              medallas={["🥇", "🥈", "🥉"]}
              seleccion={seleccion}
              vacio="Todavía no hay nada que premiar."
              cargando={!listo}
              distancias={distancias}
              onElegir={(bar) => abrirBar(bar)}
            />
            <Ranking
              titulo="Lista negra"
              subtitulo="Entra bajo tu responsabilidad"
              bares={listaNegra}
              medallas={["☠️", "☠️", "☠️"]}
              seleccion={seleccion}
              vacio="Milagro: ningún desastre fichado."
              cargando={!listo}
              tono="negra"
              distancias={distancias}
              onElegir={(bar) => abrirBar(bar)}
            />
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t-2 border-borde px-4 py-6 font-mono text-[11.5px] text-papel-apagado">
        <div className="mx-auto w-full max-w-[1240px]">
          <p>
            <b className="text-papel">Rollo Madrid</b> · los locales salen de
            Google Places; las notas, de quien pasó por ahí.
          </p>
          <p className="mt-1.5">
            Busca el bar, mira la nota y, si te toca sufrir, cuéntalo para el
            siguiente.
          </p>
          <p className="mt-1.5">
            {modoDatos === "firebase"
              ? "Datos compartidos: lo que publicas lo ve todo el mundo."
              : "Modo local: sin base de datos configurada, lo que publicas se queda en este navegador."}
          </p>
        </div>
      </footer>

      {listo && barSeleccionado && (
        <FichaBar
          barConNota={barSeleccionado}
          abrirValorando={valorandoAlAbrir}
          onCerrar={() => {
            setSeleccion(null);
            setValorandoAlAbrir(false);
          }}
          onPedirAcceso={() =>
            setMotivoAcceso(
              "Para publicar un parte hace falta cuenta: así cada nota lleva firma.",
            )
          }
          onAvisar={avisar}
          metros={distancias.get(barSeleccionado.bar.place_id) ?? null}
        />
      )}

      {motivoAcceso !== null && (
        <ModalAcceso
          motivo={motivoAcceso || undefined}
          onCerrar={() => setMotivoAcceso(null)}
          onEntrado={(mensaje) => {
            setMotivoAcceso(null);
            avisar(mensaje);
          }}
        />
      )}

      {brindis && (
        <p
          role="status"
          className="grito fixed bottom-6 left-1/2 z-[60] max-w-[calc(100%-32px)] -translate-x-1/2 border-[3px] border-black bg-acido px-4 py-2.5 text-center text-base text-[#0A0E02] shadow-dura"
        >
          {brindis}
        </p>
      )}
    </>
  );

  // Sin clave no montamos el proveedor: la app funciona igual, con el
  // buscador reducido a los bares ya fichados.
  if (!HAY_API_KEY) return contenido;

  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={["places", "marker"]}
      language="es"
      region="ES"
      onError={() => setErrorApi(true)}
    >
      {contenido}
    </APIProvider>
  );
}

function Cifra({
  valor,
  etiqueta,
  color,
  cargando = false,
}: {
  valor: string;
  etiqueta: string;
  color: string;
  /** Hasta que hay datos se enseña un hueco, no un cero falso. */
  cargando?: boolean;
}) {
  return (
    <div className="border-2 border-borde bg-asfalto-800 px-3.5 py-3">
      {cargando ? (
        <span className="block h-[clamp(30px,5vw,46px)] w-16 animate-pulse bg-asfalto-600" />
      ) : (
        <b className={`grito block text-[clamp(30px,5vw,46px)] leading-none tabular-nums ${color}`}>
          {valor}
        </b>
      )}
      <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-papel-apagado">
        {etiqueta}
      </span>
    </div>
  );
}
