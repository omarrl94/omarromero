import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Protege /admin (solo profesorado) y /dashboard (solo alumnado)
export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (pathname.startsWith("/dashboard") && role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: "/login" },
  }
);

export const config = { matcher: ["/admin/:path*", "/dashboard/:path*"] };
