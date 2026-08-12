"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, QrCode } from "lucide-react";

interface ShareRoomProps {
  roomCode: string;
}

/** Código de sala + enlace copiable + QR desplegable para compartir. */
export function ShareRoom({ roomCode }: ShareRoomProps) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/room/${roomCode}`);
  }, [roomCode]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback para contextos sin Clipboard API (http, iframes…)
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="ticket-code rounded-xl border border-dashed border-white/25 bg-white/5 px-4 py-2 font-mono text-lg font-bold text-white">
          {roomCode}
        </span>
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copiar enlace de la sala"
          className="btn-ghost flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold"
        >
          {copied ? (
            <Check className="h-4 w-4 text-neon-green" aria-hidden />
          ) : (
            <Copy className="h-4 w-4" aria-hidden />
          )}
          {copied ? "¡Copiado!" : "Enlace"}
        </button>
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          aria-label="Mostrar código QR"
          aria-expanded={showQr}
          className="btn-ghost flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold"
        >
          <QrCode className="h-4 w-4" aria-hidden />
          QR
        </button>
      </div>

      <AnimatePresence>
        {showQr && url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: "auto" }}
            exit={{ opacity: 0, scale: 0.9, height: 0 }}
            className="overflow-hidden"
          >
            {/* Fondo blanco imprescindible para que el QR sea escaneable */}
            <div className="mt-2 rounded-2xl bg-white p-4 shadow-[0_0_30px_rgba(255,255,255,0.12)]">
              <QRCodeSVG
                value={url}
                size={148}
                bgColor="#ffffff"
                fgColor="#0a0a10"
                marginSize={1}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
