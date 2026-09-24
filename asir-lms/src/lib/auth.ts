import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { ensureDb } from "@/lib/ensure-db";
import { isStaff } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

// NextAuth necesita conocer la URL pública del sitio. En Netlify la variable URL
// no siempre llega a las funciones, así que se fija aquí (se puede sobreescribir
// con la variable de entorno NEXTAUTH_URL o SITE_URL).
const SITE_URL = process.env.NEXTAUTH_URL || process.env.SITE_URL || process.env.URL || "https://seguridadasir.netlify.app";
process.env.NEXTAUTH_URL = SITE_URL;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        if (!email || !credentials?.password) return null;
        await ensureDb(); // crea y puebla la BD la primera vez
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;
        // El alumnado registrado no puede entrar hasta que un profesor lo apruebe.
        if (!user.approved) throw new Error("PENDIENTE");
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};

export function homeForRole(role: Role) {
  return isStaff(role) ? "/admin" : "/dashboard";
}

/** Devuelve la sesión o redirige a /login. Opcionalmente exige unos roles concretos. */
export async function requireSession(roles?: Role[]) {
  await ensureDb();
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.user.role)) redirect(homeForRole(session.user.role));
  return session;
}
