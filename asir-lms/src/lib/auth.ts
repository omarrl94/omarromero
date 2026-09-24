import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { ensureDb } from "@/lib/ensure-db";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
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
  return role === "ADMIN" ? "/admin" : "/dashboard";
}

/** Devuelve la sesión o redirige a /login. Opcionalmente exige unos roles concretos. */
export async function requireSession(roles?: Role[]) {
  await ensureDb();
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.user.role)) redirect(homeForRole(session.user.role));
  return session;
}
