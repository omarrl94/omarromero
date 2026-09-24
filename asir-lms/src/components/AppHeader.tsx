import Link from "next/link";
import { UserCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";

export function AppHeader({ name, roleLabel }: { name: string; roleLabel: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo compact />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{name}</p>
            <Badge variant="defensiva">{roleLabel}</Badge>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/cuenta">
              <UserCog /> <span className="hidden sm:inline">Mi cuenta</span>
            </Link>
          </Button>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
