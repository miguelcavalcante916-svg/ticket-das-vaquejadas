"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createOrderAndResolveCheckout } from "@/lib/orders/create-order-client";
import { Button } from "@/components/ui/button";

export function EventCardBuyButton({
  eventId,
  ticketTypeId,
  eventSlug,
}: {
  eventId: string;
  ticketTypeId?: string | null;
  eventSlug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!ticketTypeId) {
    return (
      <Button asChild variant="gold" className="w-full">
        <Link href={`/eventos/${eventSlug}`}>Comprar</Link>
      </Button>
    );
  }

  const handleBuy = async () => {
    try {
      setError(null);
      setLoading(true);

      const { route } = await createOrderAndResolveCheckout({
        eventId,
        items: [{ ticketTypeId, quantity: 1 }],
      });

      router.push(route);
    } catch (buyError) {
      setError(
        buyError instanceof Error
          ? buyError.message
          : "Não foi possível iniciar a compra agora.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <Button
        type="button"
        variant="gold"
        className="w-full"
        onClick={handleBuy}
        disabled={loading}
      >
        {loading ? "Criando pedido..." : "Comprar"}
      </Button>
      {error ? <p className="text-xs font-semibold text-red-400">{error}</p> : null}
    </div>
  );
}
