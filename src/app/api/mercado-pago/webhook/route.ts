import { createClient } from "@supabase/supabase-js";
import { Payment } from "mercadopago";
import { NextResponse, type NextRequest } from "next/server";

import { createMercadoPagoConfig } from "@/lib/mercado-pago/client";
import { verifyMercadoPagoWebhookSignature } from "@/lib/mercado-pago/verify-webhook";

function hasServiceEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function extractPaymentId(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;

  const data = p.data;
  if (data && typeof data === "object") {
    const id = (data as Record<string, unknown>).id;
    if (id) return String(id);
  }

  const direct = p.id;
  if (direct) return String(direct);

  const resource = p.resource;
  const resourceStr = typeof resource === "string" ? resource : null;
  if (resourceStr) {
    const last = resourceStr.split("/").pop();
    if (last) return last;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const signatureHeader = request.headers.get("x-signature");
  const ok = verifyMercadoPagoWebhookSignature({
    rawBody,
    signatureHeader,
    secret: process.env.MERCADO_PAGO_WEBHOOK_SECRET,
  });

  if (!ok) {
    return NextResponse.json({ message: "Assinatura inválida" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody || "{}") as unknown;
  const paymentId = extractPaymentId(payload);

  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  if (!hasServiceEnv() || !process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    return NextResponse.json({ ok: true });
  }

  const mp = new Payment(createMercadoPagoConfig());
  const payment = await mp.get({ id: paymentId });
  const status = payment.status ?? "pending";
  const externalReference = payment.external_reference ?? null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  await supabase
    .from("payments")
    .update({ status, raw: payment as unknown as Record<string, unknown> })
    .eq("provider_payment_id", paymentId);

  if (externalReference && ["approved"].includes(String(status).toLowerCase())) {
    await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", externalReference);
  }

  return NextResponse.json({ ok: true });
}
