import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(user.adopter ? "/descubrir" : "/test");

  return (
    <main className="shell glow" style={{ justifyContent: "space-between", gap: 32 }}>
      <Logo />
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ fontSize: 46, lineHeight: 1 }}>
          Desliza.
          <br />
          Enamórate.
          <br />
          <span style={{ background: "var(--grad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            Que sea para siempre.
          </span>
        </h1>
        <p className="muted" style={{ fontSize: 17, lineHeight: 1.5, margin: 0 }}>
          Responde un test de 2 minutos sobre tu vida y te enseñamos los animales de protectoras que de verdad encajan contigo.
        </p>
      </section>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Link href="/registro" className="btn btn-primary block">
          Crear cuenta
        </Link>
        <Link href="/login" className="btn btn-ghost block">
          Ya tengo cuenta
        </Link>
      </div>
    </main>
  );
}
