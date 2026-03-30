"use client";

import * as React from "react";
import { useParams } from "next/navigation";

import { LoteForm, type LoteFormValues } from "@/components/admin/lote-form";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRLFromCents } from "@/lib/utils/currency";

function parseBRLToCents(value: string) {
  const cleaned = value.trim().replace(/\./g, "").replace(",", ".");
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

type ApiTicketType = {
  id: string;
  name: string;
  description?: string | null;
  price_cents?: number;
  priceCents?: number;
  quantity_total?: number;
  quantityTotal?: number;
  quantity_sold?: number;
  quantitySold?: number;
  is_active?: boolean;
  isActive?: boolean;
};

export default function AdminLotesPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<ApiTicketType[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/eventos/${eventId}/lotes`, { cache: "no-store" });
      const data = (await res.json()) as { ticketTypes?: ApiTicketType[]; message?: string };
      if (!res.ok) {
        setError(data.message ?? "Falha ao carregar lotes.");
        return;
      }
      setRows(data.ticketTypes ?? []);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submit = async (values: LoteFormValues) => {
    const res = await fetch(`/api/eventos/${eventId}/lotes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        description: values.description ?? null,
        priceCents: parseBRLToCents(values.priceBRL),
        quantityTotal: values.quantityTotal,
        isActive: values.isActive,
      }),
    });

    const data = (await res.json()) as { message?: string };
    if (!res.ok) throw new Error(data.message ?? "Falha ao salvar lote.");
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Lotes / Ingressos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Crie e gerencie os tipos de ingresso do evento.
        </p>
      </div>

      <LoteForm onSubmit={submit} submitLabel="Adicionar lote" />

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <h2 className="text-lg font-extrabold">Lotes cadastrados</h2>
          {loading ? (
            <div className="mt-4">
              <LoadingSpinner label="Carregando…" />
            </div>
          ) : null}
          {error ? (
            <p className="mt-4 text-sm font-semibold text-red-400">{error}</p>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {rows.map((t) => {
              const price = t.price_cents ?? t.priceCents ?? 0;
              const total = t.quantity_total ?? t.quantityTotal ?? 0;
              const sold = t.quantity_sold ?? t.quantitySold ?? 0;
              const active = t.is_active ?? t.isActive ?? true;
              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-border/60 bg-black/25 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold">{t.name}</p>
                    <Badge variant={active ? "gold" : "outline"}>
                      {active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {t.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-extrabold text-gold">
                      {formatBRLFromCents(price)}
                    </span>
                    <span className="text-muted-foreground">
                      {sold}/{total} vendidos
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

