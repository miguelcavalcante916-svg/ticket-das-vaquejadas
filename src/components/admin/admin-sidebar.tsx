"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Ticket,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-[calc(100vh-4rem)] w-72 shrink-0 border-r border-border/60 bg-black/30 px-4 py-6 md:block">
      <div className="flex items-center gap-3 px-2">
        <div className="rounded-xl border border-gold/20 bg-gold/10 p-2">
          <Ticket className="h-5 w-5 text-gold" />
        </div>
        <div>
          <p className="text-sm font-bold">Painel do Organizador</p>
          <p className="text-xs text-muted-foreground">Gerencie eventos e vendas</p>
        </div>
      </div>

      <nav className="mt-6 space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted/30 hover:text-foreground",
                active && "bg-muted/40 text-foreground shadow-glow",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

