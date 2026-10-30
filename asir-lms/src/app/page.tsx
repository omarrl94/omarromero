import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions, homeForRole } from "@/lib/auth";

export default async function Home({ searchParams }: { searchParams: { campus?: string } }) {
  const session = await getServerSession(authOptions);
  if (session) redirect(homeForRole(session.user.role));
  // Entrada desde el Campus Virtual: el registro comprueba el enlace firmado
  redirect(searchParams.campus ? `/register?campus=${encodeURIComponent(searchParams.campus)}` : "/login");
}
