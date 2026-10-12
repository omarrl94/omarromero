import { RolloApp } from "@/components/RolloApp";
import { RolloProvider } from "@/lib/store";

/**
 * Pantalla única: titular, mapa de Google y rankings. La ficha del baño
 * sube como BottomSheet en móvil y se planta como cartel en escritorio.
 */
export default function Home() {
  return (
    <RolloProvider>
      <RolloApp />
    </RolloProvider>
  );
}
