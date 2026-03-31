import { Payment } from "mercadopago";
import { NextResponse, type NextRequest } from "next/server";

import { apiError } from "@/lib/api/http";
import { getServerEnv, hasMercadoPagoAccessToken, hasServiceSupabaseEnv } from "@/lib/env/server";
import { createMercadoPagoConfig } from "@/lib/mercado-pago/client";
import { normalizeMercadoPagoStatus } from "@/lib/mercado-pago/status";
import { verifyMercadoPagoWebhookSignature } from "@/lib/mercado-pago/verify-webhook";
import { finalizePaidOrder } from "@/lib/orders/finalize-paid-order";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function extractPaymentId(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;

  const data = record.data;
  if (data && typeof data === "object") {
    const id = (data as Record<string, unknown>).id;
    if (id) return String(id);
  }

  if (record.id) return String(record.id);

  const resource = record.resource;
  if (typeof resource === "string") {
    const lastPart = resource.split("/").pop();
    if (lastPart) return lastPart;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const webhookSecret = getServerEnv().MERCADO_PAGO_WEBHOOK_SECRET;
  const requestUrl = new URL(request.url);
  const queryPaymentId = requestUrl.searchParams.get("data.id");

  if (!webhookSecret) {
    return apiError(500, "Env ausente: MERCADO_PAGO_WEBHOOK_SECRET");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody || "{}") as unknown;
  } catch {
    return apiError(400, "Payload JSON invalido.");
  }

  const paymentId = queryPaymentId ?? extractPaymentId(payload);
  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  const validSignature = verifyMercadoPagoWebhookSignature({
    rawBody,
    signatureHeader,
    secret: webhookSecret,
    dataId: paymentId,
    requestId,
  });

  if (!validSignature) {
    return apiError(401, "Assinatura invalida.");
  }

  if (!hasServiceSupabaseEnv()) {
    return apiError(500, "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!hasMercadoPagoAccessToken()) {
    return apiError(500, "Env ausente: MERCADO_PAGO_ACCESS_TOKEN");
  }

  const mercadoPago = new Payment(createMercadoPagoConfig());
  let payment;
  try {
    payment = await mercadoPago.get({ id: paymentId });
  } catch (error) {
    return apiError(
      502,
      error instanceof Error ? error.message : "Falha ao consultar pagamento no Mercado Pago.",
    );
  }

  const status = normalizeMercadoPagoStatus(payment.status);
  const externalReference = payment.external_reference ?? null;

  const supabase = createSupabaseServiceRoleClient();
  const { data: paymentRow, error: paymentRowError } = await supabase
    .from("payments")
    .select("order_id")
    .or(`external_id.eq.${paymentId},provider_payment_id.eq.${paymentId}`)
    .limit(1)
    .maybeSingle();

  if (paymentRowError) {
    return apiError(500, paymentRowError.message);
  }

  const { error: paymentUpdateError } = await supabase
    .from("payments")
    .update({
      status,
      method: "pix",
      external_id: paymentId,
      provider_payment_id: paymentId,
      raw: payment as unknown as Record<string, unknown>,
    })
    .or(`external_id.eq.${paymentId},provider_payment_id.eq.${paymentId}`);

  if (paymentUpdateError) {
    return apiError(500, paymentUpdateError.message);
  }

  const orderId = typeof externalReference === "string" && externalReference.length
    ? externalReference
    : (paymentRow?.order_id ?? null);

  if (orderId && status === "paid") {
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

  return NextResponse.json({ ok: true });
}
