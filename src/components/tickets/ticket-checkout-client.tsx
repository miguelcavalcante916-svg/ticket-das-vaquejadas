"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { TicketType } from "@/types";
import { TicketSelector, type TicketSelection } from "@/components/tickets/ticket-selector";

export function TicketCheckoutClient({
  eventId,
  ticketTypes,
}: {
  eventId: string;
  ticketTypes: TicketType[];
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const onCheckout = async (items: TicketSelection[]) => {
    try {
      setError(null);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId, items }),
      });

      const data = (await res.json().catch(() => null)) as
        | { orderId?: string; message?: string }
        | null;

      const orderId = typeof data?.orderId === "string" ? data.orderId.trim() : "";

      if (!res.ok || !orderId) {
        setError(data?.message ?? "Não foi possível criar o pedido.");
        return;
      }

      router.push(`/checkout/${encodeURIComponent(orderId)}`);
    } catch {
      setError("Não foi possível iniciar sua compra agora. Tente novamente.");
    }
  };

  return (
    <div className="space-y-3">
      <TicketSelector ticketTypes={ticketTypes} onCheckout={onCheckout} />
      {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
    </div>
  );
}
