import { RolloApp } from "@/components/RolloApp";
import { AuthProvider } from "@/lib/auth";
import { RolloProvider } from "@/lib/store";

/**
 * Pantalla única: titular, mapa de Google y rankings. Leer no pide nada;
 * para firmar un parte hace falta cuenta.
 */
export default function Home() {
  return (
    <AuthProvider>
      <RolloProvider>
        <RolloApp />
      </RolloProvider>
    </AuthProvider>
  );
}
