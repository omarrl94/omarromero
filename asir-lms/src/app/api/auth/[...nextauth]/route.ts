import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";

const nextauth = NextAuth(authOptions);

// Deduce NEXTAUTH_URL de la petición si no está definida en el entorno (Netlify).
function ensureNextauthUrl(req: Request) {
  if (process.env.NEXTAUTH_URL) return;
  const site = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (site) {
    process.env.NEXTAUTH_URL = site;
    return;
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) process.env.NEXTAUTH_URL = `${proto}://${host}`;
}

const run = nextauth as unknown as (req: Request, ctx: unknown) => Promise<Response>;

async function handler(req: Request, ctx: unknown) {
  ensureNextauthUrl(req);
  return run(req, ctx);
}

export { handler as GET, handler as POST };
