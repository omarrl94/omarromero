import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RoomClient } from "@/components/RoomClient";

interface RoomPageProps {
  params: { code: string };
}

export function generateMetadata({ params }: RoomPageProps): Metadata {
  return {
    title: `Sala ${params.code.toUpperCase()} · Hipster Bingo`,
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  const code = params.code.toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(code)) {
    redirect("/");
  }
  return <RoomClient roomCode={code} />;
}
