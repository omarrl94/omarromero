import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Rollo Madrid como app de iOS y Android.
 *
 * La web se exporta estática a `out/` y Capacitor la empaqueta dentro de
 * la app: el HTML, el CSS y el JS viajan en el binario, así que la app
 * abre aunque no haya cobertura. Lo único que necesita red son los datos
 * (Firestore) y el mapa (Google).
 */
const config: CapacitorConfig = {
  appId: "com.rollomadrid.app",
  appName: "Rollo Madrid",
  webDir: "out",

  // Mismo fondo que la app, para que no haya un fogonazo blanco al abrir.
  backgroundColor: "#0C0C0D",

  ios: {
    contentInset: "always",
    backgroundColor: "#0C0C0D",
  },

  android: {
    backgroundColor: "#0C0C0D",
    // Sin esto, los enlaces a Google Maps se abrirían dentro de la app.
    allowMixedContent: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: "#0C0C0D",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0C0C0D",
      overlaysWebView: false,
    },
    Geolocation: {
      // El texto que ve quien usa la app al pedirle la ubicación.
      permissions: ["location"],
    },
  },
};

export default config;
