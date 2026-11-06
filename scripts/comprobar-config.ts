/**
 * Comprueba, al desplegar, que la configuración web de Firebase llega a la compilación.
 * Las VITE_FIREBASE_* se incrustan en la web al compilar: si faltan aquí, la web dirá
 * «Las cuentas no están configuradas». Solo muestra nombres, nunca valores.
 */
const NOMBRES = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'];
const enNetlify = Boolean(process.env.NETLIFY);
const contexto = process.env.CONTEXT ?? 'local';

console.log(`\nConfiguración de Firebase para la web (contexto de despliegue: ${contexto})`);
const faltan: string[] = [];
for (const n of NOMBRES) {
  const v = (process.env[n] ?? '').trim();
  console.log(`  ${v ? '✔' : '✖'} ${n}${v ? ` (${v.length} caracteres)` : ' — NO LLEGA A LA COMPILACIÓN'}`);
  if (!v) faltan.push(n);
}
// Pistas de nombres casi iguales (espacios, minúsculas, guiones).
const parecidas = Object.keys(process.env).filter((k) => /firebase/i.test(k) && !NOMBRES.includes(k) && !/^FIREBASE_(SERVICE_ACCOUNT|PROJECT_ID|CLIENT_EMAIL|PRIVATE_KEY)$/.test(k));
if (parecidas.length) console.log(`  ⚠ Variables con nombre parecido (revisa que estén bien escritas): ${parecidas.join(', ')}`);

if (faltan.length && enNetlify && contexto === 'production') {
  console.error(`
✖ Faltan en la compilación: ${faltan.join(', ')}.
  En Netlify → Project configuration → Environment variables, revisa en cada una:
   1. El nombre exacto (mayúsculas, guiones bajos, sin espacios).
   2. Scopes: «All scopes» (o que incluya «Builds»).
   3. Values: «Same value for all deploy contexts» (o que «Production» tenga valor).
  Después: Deploys → Trigger deploy → Clear cache and deploy project.
`);
  process.exit(1);
}
if (!faltan.length) console.log('  ✔ La web se compilará con las cuentas activadas.\n');
