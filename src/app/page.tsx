"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Coffee, Glasses, Bike, ArrowRight, Sparkles } from "lucide-react";
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
        <div className="mb-4 flex items-center justify-center gap-4 text-kraft-600">
          <Glasses className="h-7 w-7" aria-hidden />
          <Coffee className="h-7 w-7" aria-hidden />
          <Bike className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="font-display text-5xl font-black tracking-tight text-ink sm:text-6xl">
          Hipster Bingo
        </h1>
        <p className="mt-3 text-base italic text-kraft-700">
          Cartones aleatorios · clichés artesanales · en tiempo real
        </p>
        <div className="mx-auto mt-4 h-px w-40 bg-kraft-400" />
      </motion.header>

      {!configured && <ConfigNotice />}

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="paper-card w-full p-6 shadow-paper sm:p-8"
      >
        <label htmlFor="nickname" className="block font-display text-sm font-bold uppercase tracking-widest text-kraft-700">
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
          placeholder="Barista Errante"
          className="mt-2 w-full rounded-md border border-kraft-400 bg-kraft-50 px-4 py-3 font-serif text-lg text-ink placeholder:text-kraft-400 focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-200"
        />

        <button
          type="button"
          onClick={handleCreate}
          disabled={busy !== null || !configured}
          className="btn-letterpress mt-6 flex w-full items-center justify-center gap-2 bg-terracotta-500 px-5 py-3.5 font-display text-lg font-bold text-kraft-50"
          style={{ color: "#763a28" }}
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          <span className="text-kraft-50">
            {busy === "create" ? "Creando sala…" : "Crear partida"}
          </span>
        </button>

        <div className="my-6 flex items-center gap-3 text-kraft-500">
          <div className="h-px flex-1 bg-kraft-300" />
          <span className="font-display text-xs uppercase tracking-widest">o únete</span>
          <div className="h-px flex-1 bg-kraft-300" />
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
            className="ticket-code w-36 rounded-md border border-kraft-400 bg-kraft-50 px-3 py-3 text-center font-mono text-lg font-bold uppercase text-ink placeholder:text-kraft-400 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
          />
          <button
            type="submit"
            disabled={busy !== null || !configured}
            className="btn-letterpress flex flex-1 items-center justify-center gap-2 bg-sage-200 px-4 py-3 font-display font-bold text-sage-700"
          >
            {busy === "join" ? "Entrando…" : "Unirse"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-4 text-center text-sm font-semibold text-terracotta-600">
            {error}
          </p>
        )}
      </motion.section>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-xs italic text-kraft-600"
      >
        25 casillas · 5 en línea para ganar · la casilla central va de regalo
      </motion.footer>
    </main>
  );
}
