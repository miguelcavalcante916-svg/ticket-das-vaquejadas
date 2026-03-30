"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";

import type { TicketType } from "@/types";
import { formatBRLFromCents } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type TicketSelection = {
  ticketTypeId: string;
  quantity: number;
};

export function TicketSelector({
  ticketTypes,
  onCheckout,
}: {
  ticketTypes: TicketType[];
  onCheckout: (items: TicketSelection[]) => Promise<void> | void;
}) {
  const [items, setItems] = React.useState<Record<string, number>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const selections: TicketSelection[] = ticketTypes
    .map((t) => ({ ticketTypeId: t.id, quantity: items[t.id] ?? 0 }))
    .filter((i) => i.quantity > 0);

  const totalCents = selections.reduce((sum, sel) => {
    const ticket = ticketTypes.find((t) => t.id === sel.ticketTypeId);
    return sum + (ticket ? ticket.priceCents * sel.quantity : 0);
  }, 0);

  const adjust = (ticketTypeId: string, delta: number) => {
    setItems((prev) => {
      const next = Math.max(0, (prev[ticketTypeId] ?? 0) + delta);
      return { ...prev, [ticketTypeId]: next };
    });
  };

  const canSubmit = selections.length > 0 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      await onCheckout(selections);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/60" id="ingressos">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-lg font-extrabold">Ingressos & Lotes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione a quantidade e avance para pagamento via Pix.
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-extrabold text-gold">
              {formatBRLFromCents(totalCents)}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {ticketTypes.map((ticket) => {
            const qty = items[ticket.id] ?? 0;
            const disabled = !ticket.isActive;
            return (
              <div
                key={ticket.id}
                className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-bold">{ticket.name}</p>
                  {ticket.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticket.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm font-extrabold text-gold">
                    {formatBRLFromCents(ticket.priceCents)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => adjust(ticket.id, -1)}
                      disabled={disabled || qty <= 0}
                      aria-label="Diminuir"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="w-10 text-center text-sm font-bold">{qty}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => adjust(ticket.id, 1)}
                      disabled={disabled}
                      aria-label="Aumentar"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="sm:hidden">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-extrabold text-gold">
              {formatBRLFromCents(totalCents)}
            </p>
          </div>

          <Button
            type="button"
            variant="gold"
            size="xl"
            onClick={submit}
            disabled={!canSubmit}
            className="w-full sm:w-auto"
          >
            {submitting ? "Criando pedido…" : "Comprar via Pix"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

