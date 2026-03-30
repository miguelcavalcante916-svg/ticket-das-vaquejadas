import { createClient } from "@supabase/supabase-js";
import { Payment } from "mercadopago";
import { NextResponse, type NextRequest } from "next/server";

import { createMercadoPagoConfig } from "@/lib/mercado-pago/client";

function hasServiceEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json({ message: "orderId obrigatório" }, { status: 400 });
  }

  if (!hasServiceEnv()) {
    return NextResponse.json({ status: "pending" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: payment } = await supabase
    .from("payments")
    .select("provider_payment_id,status,created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment?.provider_payment_id) {
    return NextResponse.json({ status: "pending" });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ status: payment.status ?? "pending" });
  }

  const paymentClient = new Payment(createMercadoPagoConfig());
  const paymentId = String(payment.provider_payment_id);
  const mp = await paymentClient.get({ id: paymentId });
  const status = mp.status ?? payment.status ?? "pending";

  await supabase
    .from("payments")
    .update({ status, raw: mp as unknown as Record<string, unknown> })
    .eq("provider_payment_id", paymentId);

  if (["approved"].includes(String(status).toLowerCase())) {
    await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);
  }

  return NextResponse.json({ status });
}
