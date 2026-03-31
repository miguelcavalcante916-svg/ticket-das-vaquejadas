import Link from "next/link";
import { CalendarDays, Pencil, Ticket, Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateBR } from "@/lib/utils/date";
import { listPublicEvents } from "@/services/events";

export const metadata = {
  title: "Admin • Eventos",
};

export default async function AdminEventosPage() {
  const { events, error } = await listPublicEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Eventos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre, edite, gerencie lotes e acompanhe vendas.
          </p>
        </div>
        <Button asChild variant="gold">
          <Link href="/admin/eventos/novo">Novo evento</Link>
        </Button>
      </div>

      {error && !events.length ? (
        <EmptyState
          title="Falha ao carregar eventos"
          description={error}
        />
      ) : null}

      <div className="grid gap-4">
        {events.map((e) => (
          <Card key={e.id} className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {e.featured ? <Badge variant="gold">Destaque</Badge> : null}
                    <Badge variant="outline">
                      {e.city}/{e.state}
                    </Badge>
                  </div>
                  <p className="mt-2 truncate text-lg font-extrabold">{e.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDateBR(e.startDate)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/eventos/${e.id}`}>
                      <CalendarDays className="h-4 w-4" /> Detalhes
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/eventos/${e.id}/editar`}>
                      <Pencil className="h-4 w-4" /> Editar
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/eventos/${e.id}/lotes`}>
                      <Ticket className="h-4 w-4" /> Lotes
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/eventos/${e.id}/vendas`}>
                      <Users className="h-4 w-4" /> Vendas
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
