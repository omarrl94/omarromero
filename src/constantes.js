// Configuración generada en el despliegue (dist/config.js). Sin Firebase → modo demostración.
const cfg = (typeof window !== "undefined" && window.JRO_CONFIG) || {};

// Logo oficial en imagen; si no carga, se usa el SVG vectorial integrado.
export const LOGO_IMG_SRC = "logo-jrotero.png";

export const CENTRO = "Formación Profesional JOSÉ RAMÓN OTERO";
export const CURSO = "Especialización en Ingeniería de IA, Skills, MCP y Automatización con Claude";
// Si cambia el profesor responsable, cámbialo también en firebase/firestore.rules
export const ADMIN_EMAIL = "omar.romero@jrotero.es";
export const ADMIN_NOMBRE = "Omar Romero";
export const DOMINIO = "@jrotero.es";
export const CODIGO_AULA_DEMO = "JRO-IA-2026";
export const HORAS_CURSO = 60;              // 12 sesiones × 5 h
export const STORE_KEY = "jro_claude_lms_v3";

export const FIREBASE = cfg.firebase && cfg.firebase.apiKey ? cfg.firebase : null;
export const EMULADOR = !!cfg.emulador;
export const DEMO_MODE = !FIREBASE;         // accesos rápidos y datos en el navegador

export const CICLOS = {
  DAM: "Desarrollo de Aplicaciones Multiplataforma",
  ASIR: "Administración de Sistemas Informáticos en Red"
};
