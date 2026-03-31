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
      console.info("[checkout] ticket types selected", {
        eventId,
        items,
      });

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

      console.info("[checkout] order created", { orderId });

      const route = `/checkout/${encodeURIComponent(orderId)}`;
      const verifyRes = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!verifyRes.ok) {
        const verifyData = (await verifyRes.json().catch(() => null)) as
          | { message?: string }
          | null;

        console.warn("[checkout] order verification failed", {
          orderId,
          status: verifyRes.status,
          message: verifyData?.message ?? null,
        });
        setError(
          verifyData?.message ??
            "O pedido foi criado, mas o checkout ainda não ficou disponível. Tente novamente.",
        );
        return;
      }

      console.info("[checkout] redirecting", { route });
      router.push(route);
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
