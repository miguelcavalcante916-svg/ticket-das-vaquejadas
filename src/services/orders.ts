import type { Order, OrderItem, PixPaymentInfo } from "@/types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { qrDataUrl } from "@/lib/utils/qr";

type OrderRow = {
  id: string;
  user_id?: string | null;
  event_id: string;
  status: string;
  total_cents: number;
  currency?: string | null;
  buyer_name?: string | null;
  buyer_email?: string | null;
  buyer_document?: string | null;
  created_at: string;
};

type OrderItemRow = {
  id: string;
  ticket_type_id: string;
  name: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
};

type PaymentRow = {
  provider_payment_id?: string | null;
  status?: string | null;
  pix_qr_code?: string | null;
  pix_qr_code_base64?: string | null;
  pix_copy_paste?: string | null;
};

function hasSupabaseServiceEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function mapOrder(
  row: OrderRow,
  items: OrderItem[],
  payment: PixPaymentInfo | null,
): Order {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    eventId: row.event_id,
    status: row.status,
    totalCents: row.total_cents,
    currency: row.currency ?? "BRL",
    buyerName: row.buyer_name ?? null,
    buyerEmail: row.buyer_email ?? null,
    buyerDocument: row.buyer_document ?? null,
    createdAt: row.created_at,
    items,
    payment,
  };
}

function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    ticketTypeId: row.ticket_type_id,
    name: row.name,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    totalCents: row.total_cents,
  };
}

function mapPayment(row: PaymentRow): PixPaymentInfo {
  return {
    provider: "mercado_pago",
    providerPaymentId: row.provider_payment_id ?? null,
    status: row.status ?? "pending",
    qrCode: row.pix_qr_code ?? null,
    qrCodeBase64: row.pix_qr_code_base64 ?? null,
    copyPaste: row.pix_copy_paste ?? null,
  };
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  if (!hasSupabaseServiceEnv()) {
    const copyPaste =
      "00020126580014BR.GOV.BCB.PIX0136exemplo-chave-pix-123456789012345678520400005303986540550.005802BR5920Ticket das Vaquejadas6009Fortaleza62140510ORDER12345";
    const qrCodeBase64 = await qrDataUrl(copyPaste);
    return {
      id: orderId,
      eventId: "a0f9c22a-87a6-4d42-9d5f-6dcb2be9b110",
      status: "pending",
      totalCents: 17000,
      currency: "BRL",
      createdAt: new Date().toISOString(),
      items: [
        {
          id: "item-1",
          ticketTypeId: "t2-premium",
          name: "Camarote • 1º lote",
          quantity: 1,
          unitPriceCents: 12000,
          totalCents: 12000,
        },
        {
          id: "item-2",
          ticketTypeId: "t1-premium",
          name: "Pista • 1º lote",
          quantity: 1,
          unitPriceCents: 5000,
          totalCents: 5000,
        },
      ],
      payment: {
        provider: "mercado_pago",
        status: "pending",
        qrCodeBase64,
        copyPaste,
      },
    };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select(
      "id,user_id,event_id,status,total_cents,currency,buyer_name,buyer_email,buyer_document,created_at",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !orderRow) return null;

  const { data: itemRows } = await supabase
    .from("order_items")
    .select("id,ticket_type_id,name,quantity,unit_price_cents,total_cents")
    .eq("order_id", orderId);

  const { data: paymentRow } = await supabase
    .from("payments")
    .select(
      "provider,provider_payment_id,status,pix_qr_code,pix_qr_code_base64,pix_copy_paste,created_at",
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const items = ((itemRows ?? []) as OrderItemRow[]).map(mapOrderItem);
  const payment = paymentRow ? mapPayment(paymentRow as PaymentRow) : null;
  return mapOrder(orderRow as OrderRow, items, payment);
}
