import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateShortBR } from "@/lib/utils/date";

export const metadata = {
  title: "Meus ingressos",
};

export default async function MeusIngressosPage() {
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!hasSupabase) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Meus ingressos</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Faça login para ver seus ingressos. (Modo demo sem Supabase configurado.)
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {["TVQ-ABC123DEF456", "TVQ-AAA111BBB222"].map((code) => (
            <Card key={code} className="border-border/60">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Código</p>
                <p className="mt-1 font-mono text-sm font-bold">{code}</p>
                <p className="mt-4 text-sm font-extrabold">Vaquejada Premium do Parque</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  20/06/2026 • Fortaleza/CE
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container py-10">
        <EmptyState
          title="Entre para ver seus ingressos"
          description="Acesse sua conta para visualizar QR Codes, status de pagamento e detalhes."
          actionLabel="Entrar"
          actionHref="/login?redirectTo=/meus-ingressos"
        />
      </div>
    );
  }

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(
      "id,code,status,created_at,event:events(title,start_date,city,state),ticket_type:ticket_types(name)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="container py-10">
        <EmptyState
          title="Não foi possível carregar seus ingressos"
          description="Verifique sua configuração do Supabase e as políticas RLS."
          actionLabel="Suporte"
          actionHref="/suporte"
        />
      </div>
    );
  }

  type TicketRow = {
    id: string;
    code: string;
    status: string;
    created_at: string;
    event?: {
      title?: string | null;
      start_date?: string | null;
      city?: string | null;
      state?: string | null;
    } | null;
    ticket_type?: { name?: string | null } | null;
  };

  const rows = (tickets ?? []) as TicketRow[];

  return (
    <div className="container py-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Meus ingressos</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Você está logado como{" "}
            <span className="font-semibold text-foreground">{user.email}</span>.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/eventos">Comprar mais</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {rows.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState
              title="Nenhum ingresso encontrado"
              description="Quando você comprar um ingresso, ele aparecerá aqui."
              actionLabel="Ver eventos"
              actionHref="/eventos"
            />
          </div>
        ) : null}

        {rows.map((t) => (
          <Card key={t.id} className="border-border/60">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Código</p>
              <p className="mt-1 font-mono text-sm font-bold">{t.code}</p>
              <p className="mt-4 text-sm font-extrabold">
                {t.event?.title ?? "Evento"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.event?.start_date ? formatDateShortBR(t.event.start_date) : "—"}{" "}
                • {t.event?.city ?? "—"}/{t.event?.state ?? "—"}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Tipo: <span className="font-semibold text-foreground">{t.ticket_type?.name ?? "—"}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
