import type { MetadataRoute } from "next";

// Web App Manifest → la app se puede "instalar" en el móvil (PWA).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PawsMatch",
    short_name: "PawsMatch",
    description: "Adopción responsable: encuentra al animal que encaja con tu vida.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f1",
    theme_color: "#e8613c",
    icons: [],
  };
}
