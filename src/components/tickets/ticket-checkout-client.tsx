"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { TicketType } from "@/types";
import { createOrderAndResolveCheckout } from "@/lib/orders/create-order-client";
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

      const { route } = await createOrderAndResolveCheckout({
        eventId,
        items,
      });

      router.push(route);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Não foi possível iniciar sua compra agora. Tente novamente.",
      );
    }
  };

  return (
    <div className="space-y-3">
      <TicketSelector ticketTypes={ticketTypes} onCheckout={onCheckout} />
      {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
    </div>
  );
}
