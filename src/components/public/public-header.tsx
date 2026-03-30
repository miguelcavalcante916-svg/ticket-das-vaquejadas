"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/eventos", label: "Eventos" },
  { href: "/meus-ingressos", label: "Meus ingressos" },
  { href: "/suporte", label: "Suporte" },
] as const;

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#2a2a2a] bg-[#0B0B0B]/92 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Ticket das Vaquejadas"
            width={280}
            height={64}
            priority
            className="h-11 w-auto object-contain drop-shadow-[0_0_18px_rgba(200,155,60,0.18)] sm:h-12"
          />
          <div className="hidden sm:block">
            <div className="text-base font-extrabold leading-tight text-gold">
              Ticket das Vaquejadas
            </div>
            <div className="text-xs text-muted-foreground">
              Ingressos premium. Pix. QR Code.
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-semibold text-muted-foreground transition hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">Área do organizador</Link>
          </Button>
          <Button asChild variant="gold" size="sm">
            <Link href="/login">Entrar</Link>
          </Button>
        </nav>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {NAV.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin">Área do organizador</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/login">Entrar</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

