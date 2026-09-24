import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-cookie";

// Protege /admin (solo profesorado) y /dashboard (solo alumnado).
// Lee la cookie de sesión por su nombre exacto para no depender de la detección
// automática (que en el Edge de Netlify fallaba y provocaba un bucle de redirecciones).
export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: SESSION_COOKIE,
    secureCookie: true,
  });

  const { pathname } = req.nextUrl;

  if (!token) {
    const login = new URL("/login", req.url);
    return NextResponse.redirect(login);
  }

  const role = token.role;
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname.startsWith("/dashboard") && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/dashboard/:path*"] };
