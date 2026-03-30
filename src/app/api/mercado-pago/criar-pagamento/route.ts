import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

import { createPixPayment } from "@/lib/mercado-pago/create-payment";

const schema = z.object({
  orderId: z.string().min(1),
});

function hasServiceEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  if (!hasServiceEnv()) {
    return NextResponse.json(
      { message: "Configure SUPABASE_SERVICE_ROLE_KEY para criar pagamento." },
      { status: 500 },
    );
  }

  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    return NextResponse.json(
      { message: "Env ausente: MERCADO_PAGO_ACCESS_TOKEN" },
      { status: 500 },
    );
  }

  const { orderId } = parsed.data;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,total_cents,buyer_email")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ message: "Pedido não encontrado" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("payments")
    .select(
      "provider_payment_id,status,pix_qr_code,pix_qr_code_base64,pix_copy_paste,created_at",
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.provider_payment_id && (existing.pix_copy_paste || existing.pix_qr_code)) {
    return NextResponse.json({
      payment: {
        provider: "mercado_pago",
        providerPaymentId: existing.provider_payment_id,
        status: existing.status,
        qrCode: existing.pix_qr_code,
        qrCodeBase64: existing.pix_qr_code_base64,
        copyPaste: existing.pix_copy_paste,
      },
    });
  }

  const notificationUrl = new URL("/api/mercado-pago/webhook", request.url).toString();

  const payment = await createPixPayment({
    orderId,
    amountCents: order.total_cents as number,
    payerEmail: (order.buyer_email as string | null) ?? "comprador@exemplo.com",
    description: `Ticket das Vaquejadas • Pedido ${orderId}`,
    notificationUrl,
  });

  const { error: insertError } = await supabase.from("payments").insert({
    order_id: orderId,
    provider: payment.provider,
    provider_payment_id: payment.providerPaymentId,
    status: payment.status,
    pix_qr_code: payment.qrCode,
    pix_qr_code_base64: payment.qrCodeBase64,
    pix_copy_paste: payment.copyPaste,
    raw: payment.raw as unknown as Record<string, unknown>,
  });

  if (insertError) {
    return NextResponse.json({ message: insertError.message }, { status: 500 });
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
  });
}
