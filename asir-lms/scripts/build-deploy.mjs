// Build de despliegue (Netlify): corrige la región del pooler de Supabase,
// sincroniza el esquema, siembra si la BD está vacía y construye la app.
import { execSync } from "node:child_process";

const region = process.env.SUPABASE_REGION || "eu-central-1";
const fix = (u) =>
  u ? u.replace(/aws-0-[a-z0-9-]+\.pooler\.supabase\.com/gi, `aws-0-${region}.pooler.supabase.com`) : u;

const env = { ...process.env };
if (env.DATABASE_URL) env.DATABASE_URL = fix(env.DATABASE_URL);
if (env.DIRECT_URL) env.DIRECT_URL = fix(env.DIRECT_URL);

const run = (cmd) => execSync(cmd, { stdio: "inherit", env });

console.log(`[build-deploy] Región de Supabase: ${region}`);
run("npx prisma db push --skip-generate");
run("node scripts/maybe-seed.mjs");
run("npx next build");
