import { Payment } from "mercadopago";
import { NextResponse, type NextRequest } from "next/server";

import { apiError } from "@/lib/api/http";
import { createMercadoPagoConfig } from "@/lib/mercado-pago/client";
import { hasMercadoPagoAccessToken, hasServiceSupabaseEnv } from "@/lib/env/server";
import { normalizeMercadoPagoStatus } from "@/lib/mercado-pago/status";
import { finalizePaidOrder } from "@/lib/orders/finalize-paid-order";
import { getApiUserRole, isOrganizerOrAdmin } from "@/lib/supabase/api-auth";
import { canAccessGuestOrder, canAccessOrder } from "@/lib/supabase/access";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  if (!orderId) {
    return apiError(400, "orderId obrigatorio.");
  }

  if (!hasServiceSupabaseEnv()) {
    return NextResponse.json({ status: "pending" });
  }

  const supabase = createSupabaseServiceRoleClient();
  const auth = await getApiUserRole(request);

  if (auth) {
    const access = await canAccessOrder(
      supabase,
      isOrganizerOrAdmin(auth.role) ? (auth.role as "organizer" | "admin") : "user",
      auth.userId,
      orderId,
    );
    if (!access.allowed) {
      return apiError(403, "Sem acesso a este pedido.");
    }
  } else {
    const access = await canAccessGuestOrder(supabase, orderId);
    if (!access.allowed) {
      return apiError(403, "Este pedido exige autenticacao.");
    }
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("provider_payment_id,external_id,status,created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const storedPaymentId = payment?.external_id ?? payment?.provider_payment_id ?? null;

  if (!storedPaymentId) {
    return NextResponse.json({ status: "pending" });
  }

  if (!hasMercadoPagoAccessToken()) {
    return NextResponse.json({ status: payment?.status ?? "pending" });
  }

  const paymentClient = new Payment(createMercadoPagoConfig());
  const paymentId = String(storedPaymentId);
  let mercadoPagoPayment;

  try {
    mercadoPagoPayment = await paymentClient.get({ id: paymentId });
  } catch (error) {
    return apiError(
      502,
      error instanceof Error ? error.message : "Falha ao consultar status no Mercado Pago.",
    );
  }

  const status = normalizeMercadoPagoStatus(mercadoPagoPayment.status ?? payment?.status);

  const { error: paymentUpdateError } = await supabase
    .from("payments")
    .update({
      status,
      external_id: paymentId,
      provider_payment_id: paymentId,
      method: "pix",
      raw: mercadoPagoPayment as unknown as Record<string, unknown>,
    })
    .or(`external_id.eq.${paymentId},provider_payment_id.eq.${paymentId}`);

  if (paymentUpdateError) {
    return apiError(500, paymentUpdateError.message);
  }

  if (status === "paid") {
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId)
      .neq("status", "paid");

    if (orderUpdateError) {
      return apiError(500, orderUpdateError.message);
    }

    await finalizePaidOrder(orderId);
  }

  return NextResponse.json({ status });
}
