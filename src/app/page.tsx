import { Cabecera } from "@/components/Cabecera";
import { MapaRollos } from "@/components/MapaRollos";
import { RolloProvider } from "@/lib/store";

/**
 * Pantalla única del MVP: cabecera fija y, debajo, el mapa a pantalla
 * completa con el buscador flotando encima (mobile-first: la ficha del
 * bar sube como BottomSheet en el móvil y se ancla a la derecha en
 * escritorio).
 */
export default function Home() {
  return (
    <RolloProvider>
      <div className="flex h-[100dvh] flex-col">
        <Cabecera />
        <main className="relative min-h-0 flex-1">
          <MapaRollos />
        </main>
      </div>
    </RolloProvider>
  );
}
