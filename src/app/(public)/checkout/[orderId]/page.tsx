import { notFound } from "next/navigation";

import { CheckoutPaymentClient } from "@/components/checkout/checkout-payment-client";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { PaymentStatus } from "@/components/checkout/payment-status";
import { getOrderById } from "@/services/orders";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) notFound();

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedido: <span className="font-mono">{order.id}</span>
          </p>
        </div>
        <PaymentStatus orderId={order.id} initialStatus={order.payment?.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
        <CheckoutSummary order={order} />
        <CheckoutPaymentClient orderId={order.id} initialPayment={order.payment ?? null} />
      </div>
    </div>
  );
}

