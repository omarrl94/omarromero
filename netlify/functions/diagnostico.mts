/**
 * Diagnóstico de la configuración del servidor (sin Firebase Admin, para que funcione aunque
 * Firebase falle). Muestra SOLO nombres de variables, tamaños y comprobaciones de formato:
 * nunca valores.
 */
import type { Config } from '@netlify/functions';
import { cuentaServicio, diagnosticoFirebase, idProyecto, limpiarValor } from '../../server/firebase';
import { proveedor } from '../../server/correo';
import { json } from '../../server/http';

const VARIABLES = [
  'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID',
  'FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'RESEND_API_KEY', 'MS_TENANT_ID', 'APP_URL', 'SUPERADMIN_EMAILS',
];

export default async () => {
  const presentes = Object.fromEntries(VARIABLES.map((n) => [n, Boolean(process.env[n]?.trim())]));
  // Tamaño aproximado de las variables propias (el límite de las funciones de Netlify es 4 KB).
  const propias = Object.keys(process.env).filter((k) => /^(VITE_|FIREBASE_|SMTP_|MAIL_|RESEND_|MS_|ADZUNA_|INFOJOBS_|APP_URL|SUPERADMIN|SESSION_SECRET|ACCESS_CODE|TUTOR_ACCESS_CODE)/.test(k));
  const bytes = propias.reduce((t, k) => t + k.length + (process.env[k]?.length ?? 0), 0);
  const clave = limpiarValor(process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n') ?? '';
  const sa = cuentaServicio();
  const problemas = [...diagnosticoFirebase()];
  if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_PRIVATE_KEY) problemas.push('Sobra FIREBASE_SERVICE_ACCOUNT: ya usas las tres variables separadas. Bórrala para ahorrar espacio.');
  if (process.env.FIREBASE_PRIVATE_KEY && !(clave.includes('-----BEGIN PRIVATE KEY-----') && clave.includes('-----END PRIVATE KEY-----'))) problemas.push('FIREBASE_PRIVATE_KEY no empieza por -----BEGIN PRIVATE KEY----- o no acaba en -----END PRIVATE KEY-----.');
  if (sa?.clientEmail && !/@.+\.iam\.gserviceaccount\.com$/.test(sa.clientEmail)) problemas.push('FIREBASE_CLIENT_EMAIL no tiene el formato …@….iam.gserviceaccount.com.');
  const web = process.env.VITE_FIREBASE_PROJECT_ID?.trim();
  if (web && idProyecto() && web !== idProyecto()) problemas.push(`FIREBASE_PROJECT_ID («${idProyecto()}») no coincide con VITE_FIREBASE_PROJECT_ID («${web}»).`);
  if (!proveedor()) problemas.push('Falta el correo del centro: SMTP_HOST, SMTP_USER y SMTP_PASS (o RESEND_API_KEY / MS_*).');
  if (bytes > 3800) problemas.push(`Las variables ocupan unos ${bytes} bytes; el límite de las funciones es 4096. Pon las VITE_FIREBASE_* solo en el ámbito «Builds» y borra FIREBASE_SERVICE_ACCOUNT si usas las tres separadas.`);
  for (const vieja of ['ACCESS_CODE', 'TUTOR_ACCESS_CODE']) if (process.env[vieja]) problemas.push(`Sobra ${vieja}: ya no se usa, bórrala.`);
  return json({
    ok: problemas.length === 0,
    problemas,
    proyecto: idProyecto() ?? null,
    correo: proveedor(),
    variables: presentes,
    tamañoVariablesBytes: bytes,
    claveFormato: process.env.FIREBASE_PRIVATE_KEY ? { lineas: clave.split('\n').length, empiezaBien: clave.startsWith('-----BEGIN PRIVATE KEY-----') } : null,
  });
};

export const config: Config = { path: '/api/diagnostico' };
