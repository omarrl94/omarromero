/**
 * Las pruebas unitarias también se ejecutan dentro del despliegue de Netlify, donde existen las
 * variables reales del sitio. Se borran antes de cada archivo para que las pruebas sean siempre
 * iguales y nunca usen (ni muestren) credenciales reales.
 */
const PATRON = /^(VITE_FIREBASE_|FIREBASE_|SMTP_|MAIL_|RESEND_|MS_|ADZUNA_|INFOJOBS_|SUPERADMIN_EMAILS$|APP_URL$|SESSION_SECRET$|ACCESS_CODE$|TUTOR_ACCESS_CODE$|NETLIFY$|NETLIFY_|SITE_ID$|CONTEXT$|CONECTA_)/;
for (const k of Object.keys(process.env)) if (PATRON.test(k)) delete process.env[k];
