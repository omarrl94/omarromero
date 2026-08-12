"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Disc3, Headphones, Music, ArrowRight, Sparkles } from "lucide-react";
import { generateRoomCode, isValidRoomCode } from "@/lib/bingo";
import {
  loadLastNickname,
  loadOrCreatePlayerId,
  saveLastNickname,
  saveRoomSession,
} from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ConfigNotice } from "@/components/ConfigNotice";

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    setNickname(loadLastNickname());
    setConfigured(isSupabaseConfigured());
  }, []);

  function requireNickname(): string | null {
    const clean = nickname.trim().slice(0, 20);
    if (clean.length < 2) {
      setError("Elige un apodo de al menos 2 caracteres.");
      return null;
    }
    saveLastNickname(clean);
    return clean;
  }

  function enterRoom(code: string, clean: string, isHost: boolean) {
    const playerId = loadOrCreatePlayerId();
    saveRoomSession(code, {
      playerId,
      nickname: clean,
      isHost,
      round: 1,
      phase: "lobby",
      markedCells: [],
      winner: null,
    });
    router.push(`/room/${code}`);
  }

  function handleCreate() {
    const clean = requireNickname();
    if (!clean) return;
    setBusy("create");
    enterRoom(generateRoomCode(), clean, true);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const clean = requireNickname();
    if (!clean) return;
    const code = joinCode.trim().toUpperCase();
    if (!isValidRoomCode(code)) {
      setError("El código de sala tiene 4 letras/números.");
      return;
    }
    setBusy("join");
    enterRoom(code, clean, false);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-8 px-5 py-12">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="mb-5 flex items-center justify-center gap-5">
          <Disc3 className="h-7 w-7 text-neon-violet" aria-hidden />
          <Music className="h-7 w-7 text-neon-cyan" aria-hidden />
          <Headphones className="h-7 w-7 text-neon-yellow" aria-hidden />
        </div>
        <h1 className="text-gradient font-display text-5xl font-bold tracking-tight sm:text-6xl">
          Hipster Bingo
        </h1>
        <p className="mt-3 text-base text-white/50">
          Music bingo · cartones de colores · en tiempo real
        </p>
      </motion.header>

      {!configured && <ConfigNotice />}

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card w-full p-6 shadow-panel sm:p-8"
      >
        <label
          htmlFor="nickname"
          className="block font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/50"
        >
          Tu apodo
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          maxLength={20}
          onChange={(e) => {
            setNickname(e.target.value);
            setError(null);
          }}
          placeholder="DJ Vinilo"
          className="input-dark mt-2 w-full px-4 py-3.5 text-lg"
        />

        <button
          type="button"
          onClick={handleCreate}
          disabled={busy !== null || !configured}
          className="btn-primary mt-6 flex w-full items-center justify-center gap-2 px-5 py-4 font-display text-lg font-bold"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          {busy === "create" ? "Creando sala…" : "Crear partida"}
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.25em] text-white/35">
            o únete
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleJoin} className="flex gap-3">
          <input
            type="text"
            value={joinCode}
            maxLength={4}
            onChange={(e) => {
              setJoinCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="CÓDIGO"
            aria-label="Código de sala"
            className="input-dark ticket-code w-36 px-3 py-3 text-center font-mono text-lg font-bold uppercase"
          />
          <button
            type="submit"
            disabled={busy !== null || !configured}
            className="btn-ghost flex flex-1 items-center justify-center gap-2 px-4 py-3 font-display font-semibold"
          >
            {busy === "join" ? "Entrando…" : "Unirse"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-4 text-center text-sm font-medium text-neon-red">
            {error}
          </p>
        )}
      </motion.section>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs text-white/35"
      >
        25 fichas de color · 5 en línea para ganar · el comodín central va de regalo
      </motion.footer>
    </main>
  );
}
