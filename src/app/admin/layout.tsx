import Link from "next/link";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-black/50 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div>
            <p className="font-display text-2xl tracking-wide text-gold">
              Admin
            </p>
            <p className="text-xs text-muted-foreground">
              Ticket das Vaquejadas
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Ver site</Link>
          </Button>
        </div>
      </header>

      <div className="container grid gap-6 py-6 md:grid-cols-[18rem_1fr]">
        <AdminSidebar />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

