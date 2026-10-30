// Configuración generada en el despliegue (dist/config.js). Sin Firebase → modo demostración.
const cfg = (typeof window !== "undefined" && window.CAMPUS_CONFIG) || {};

// Logo oficial en imagen; si no carga, se usa el SVG vectorial integrado.
export const LOGO_IMG_SRC = "logo-jrotero.png";

export const CENTRO = "Formación Profesional JOSÉ RAMÓN OTERO";
export const CAMPUS = "Campus Virtual";
// Si cambia la persona responsable del campus, cámbiala también en firebase/firestore.rules
export const ADMIN_EMAIL = "omar.romero@jrotero.es";
export const ADMIN_NOMBRE = "Omar Romero";
export const DOMINIO = "@jrotero.es";
export const STORE_KEY = "jro_campus_v1";

export const FIREBASE = cfg.firebase && cfg.firebase.apiKey ? cfg.firebase : null;
export const EMULADOR = !!cfg.emulador;
export const DEMO_MODE = !FIREBASE;         // accesos rápidos y datos en el navegador

// Tipos de formación del catálogo. El color sigue la paleta del centro.
export const TIPOS = {
  curso:   { nombre: "Curso",   plural: "Cursos",    fondo: "bg-jro-gold",  borde: "border-jro-gold",  hex: "#efcd2f" },
  master:  { nombre: "Máster",  plural: "Másteres",  fondo: "bg-jro-sage",  borde: "border-jro-sage",  hex: "#a9cabb" },
  modulo:  { nombre: "Módulo",  plural: "Módulos",   fondo: "bg-jro-terra", borde: "border-jro-terra", hex: "#e39f7d" },
  taller:  { nombre: "Taller",  plural: "Talleres y seminarios", fondo: "bg-jro-ink text-white", borde: "border-jro-ink", hex: "#111111" }
};

export const ESTADOS = {
  abierta: "Matrícula abierta",
  proximamente: "Próximamente",
  cerrada: "Matrícula cerrada"
};

// Cómo llega un alumno a tener acceso a una formación
export const ORIGENES = {
  compra: "Compra online",
  gratuita: "Matrícula gratuita",
  codigo: "Código de acceso",
  asignada: "Asignada por el centro",
  centro: "Incluida para alumnado del centro"
};
