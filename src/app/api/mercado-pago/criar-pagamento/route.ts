import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

import { apiError, apiValidationError } from "@/lib/api/http";
import { getPublicSiteUrl } from "@/lib/env/public";
import { createPixPayment } from "@/lib/mercado-pago/create-payment";
import { hasMercadoPagoAccessToken, hasServiceSupabaseEnv } from "@/lib/env/server";
import { finalizePaidOrder } from "@/lib/orders/finalize-paid-order";
import { getApiUserRole, isOrganizerOrAdmin } from "@/lib/supabase/api-auth";
import { canAccessGuestOrder, canAccessOrder } from "@/lib/supabase/access";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  orderId: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  if (!hasServiceSupabaseEnv()) {
    return apiError(
      500,
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para criar pagamentos.",
    );
  }

  if (!hasMercadoPagoAccessToken()) {
    return apiError(500, "Env ausente: MERCADO_PAGO_ACCESS_TOKEN");
  }

  const { orderId } = parsed.data;
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

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,total_cents,buyer_email")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return apiError(404, "Pedido nao encontrado.");
  }

  const { data: existing } = await supabase
    .from("payments")
    .select(
      "provider_payment_id,external_id,status,pix_qr_code,pix_qr_code_base64,pix_copy_paste,created_at",
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingStatus = (existing?.status ?? "").toLowerCase();
  const canReuseExistingPayment =
    existing?.provider_payment_id &&
    (existing.pix_copy_paste || existing.pix_qr_code) &&
    !["canceled", "rejected", "refunded"].includes(existingStatus);

  if (canReuseExistingPayment) {
    const paymentId = existing.external_id ?? existing.provider_payment_id;
    return NextResponse.json({
      payment: {
        provider: "mercado_pago",
        providerPaymentId: paymentId,
        status: existing.status,
        qrCode: existing.pix_qr_code,
        qrCodeBase64: existing.pix_qr_code_base64,
        copyPaste: existing.pix_copy_paste,
      },
      payment_id: paymentId,
      qr_code: existing.pix_copy_paste ?? existing.pix_qr_code,
      qr_code_base64: existing.pix_qr_code_base64,
      status: existing.status,
    });
  }

  let payment;
  try {
    const notificationUrl = `${getPublicSiteUrl()}/api/mercado-pago/webhook`;

    payment = await createPixPayment({
      orderId,
      amountCents: order.total_cents as number,
      payerEmail: (order.buyer_email as string | null) ?? "comprador@exemplo.com",
      description: `Ticket das Vaquejadas | Pedido ${orderId}`,
      notificationUrl,
    });
  } catch (error) {
    return apiError(
      502,
      error instanceof Error ? error.message : "Falha ao criar pagamento Pix.",
    );
  }

  const { error: insertError } = await supabase.from("payments").insert({
    order_id: orderId,
    provider: payment.provider,
    method: "pix",
    external_id: payment.providerPaymentId,
    provider_payment_id: payment.providerPaymentId,
    status: payment.status,
    pix_qr_code: payment.qrCode,
    pix_qr_code_base64: payment.qrCodeBase64,
    pix_copy_paste: payment.copyPaste,
    raw: payment.raw as unknown as Record<string, unknown>,
  });

  if (insertError) {
    return apiError(500, insertError.message);
  }

  if (payment.status === "paid") {
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

  return NextResponse.json({
    payment: {
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      status: payment.status,
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      copyPaste: payment.copyPaste,
    },
    payment_id: payment.providerPaymentId,
    qr_code: payment.copyPaste ?? payment.qrCode,
    qr_code_base64: payment.qrCodeBase64,
    status: payment.status,
  });
}
