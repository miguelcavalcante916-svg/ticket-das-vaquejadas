import "server-only";

import crypto from "crypto";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

function ticketCode() {
  return `TVQ-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

type OrderItemRow = {
  id: string;
  quantity: number;
  ticket_type_id: string;
};

type ExistingTicketRow = {
  order_item_id: string;
};

export async function finalizePaidOrder(orderId: string) {
  const supabase = createSupabaseServiceRoleClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,event_id,user_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Pedido nao encontrado para emissao.");
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id,quantity,ticket_type_id")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const orderItems = (items ?? []) as OrderItemRow[];
  if (!orderItems.length) return;

  const { data: existingTickets, error: existingError } = await supabase
    .from("tickets")
    .select("order_item_id")
    .eq("order_id", orderId);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const issuedCountByItem = new Map<string, number>();
  for (const ticket of (existingTickets ?? []) as ExistingTicketRow[]) {
    issuedCountByItem.set(
      ticket.order_item_id,
      (issuedCountByItem.get(ticket.order_item_id) ?? 0) + 1,
    );
  }

  const ticketsToInsert = [];
  for (const item of orderItems) {
    const alreadyIssued = issuedCountByItem.get(item.id) ?? 0;
    const missingQuantity = Math.max(0, item.quantity - alreadyIssued);

    for (let index = 0; index < missingQuantity; index += 1) {
      const code = ticketCode();
      ticketsToInsert.push({
        order_id: orderId,
        order_item_id: item.id,
        event_id: order.event_id,
        ticket_type_id: item.ticket_type_id,
        user_id: order.user_id ?? null,
        code,
        qr_payload: `tvq:${code}`,
        status: "active",
      });
    }
  }

  if (!ticketsToInsert.length) return;

  const { error: ticketsError } = await supabase.from("tickets").insert(ticketsToInsert);
  if (ticketsError) {
    throw new Error(ticketsError.message);
  }
}

