export type CheckoutOrderItem = {
  ticketTypeId: string;
  quantity: number;
};

type CreateOrderResponse = {
  orderId?: string;
  message?: string;
};

export async function createOrderAndResolveCheckout({
  eventId,
  items,
}: {
  eventId: string;
  items: CheckoutOrderItem[];
}) {
  console.info("[checkout] ticket_type selected", {
    eventId,
    items,
  });

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventId, items }),
  });

  const data = (await res.json().catch(() => null)) as CreateOrderResponse | null;
  const orderId = typeof data?.orderId === "string" ? data.orderId.trim() : "";

  if (!res.ok || !orderId) {
    throw new Error(data?.message ?? "Não foi possível criar o pedido.");
  }

  console.info("[checkout] order created", { orderId });

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

    throw new Error(
      verifyData?.message ??
        "O pedido foi criado, mas o checkout ainda não ficou disponível. Tente novamente.",
    );
  }

  const route = `/checkout/${encodeURIComponent(orderId)}`;
  console.info("[checkout] redirecting", { orderId, route });

  return { orderId, route };
}
