export type CheckoutOrderItem = {
  ticketTypeId: string;
  quantity: number;
};

type CreateOrderResponse = {
  orderId?: string;
  message?: string;
};

function resolveClientOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin.replace(/\/$/, "");
}

function describeError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}

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

  const ordersEndpoint = "/api/orders";
  const origin = resolveClientOrigin();

  let res: Response;
  try {
    res = await fetch(ordersEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId, items }),
    });
  } catch (error) {
    console.error("[checkout] request failed", {
      endpoint: `${origin}${ordersEndpoint}`,
      message: describeError(error, "Falha de rede ao criar o pedido."),
    });

    throw new Error(
      `Falha ao chamar ${origin}${ordersEndpoint}: ${describeError(
        error,
        "verifique o domínio e a conectividade da API.",
      )}`,
    );
  }

  const data = (await res.json().catch(() => null)) as CreateOrderResponse | null;
  const orderId = typeof data?.orderId === "string" ? data.orderId.trim() : "";

  if (!res.ok || !orderId) {
    throw new Error(data?.message ?? "Não foi possível criar o pedido.");
  }

  console.info("[checkout] order created", { orderId });

  const verifyEndpoint = `/api/orders/${encodeURIComponent(orderId)}`;

  let verifyRes: Response;
  try {
    verifyRes = await fetch(verifyEndpoint, {
      method: "GET",
      cache: "no-store",
    });
  } catch (error) {
    console.error("[checkout] verify request failed", {
      endpoint: `${origin}${verifyEndpoint}`,
      orderId,
      message: describeError(error, "Falha de rede ao validar o pedido."),
    });

    throw new Error(
      `Falha ao validar ${origin}${verifyEndpoint}: ${describeError(
        error,
        "verifique o domínio e a conectividade da API.",
      )}`,
    );
  }

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
