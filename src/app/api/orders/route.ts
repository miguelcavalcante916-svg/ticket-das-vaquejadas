import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

import { apiError, apiValidationError } from "@/lib/api/http";
import { hasPublicSupabaseEnv, requirePublicSupabaseEnv } from "@/lib/env/public";
import { hasServiceSupabaseEnv } from "@/lib/env/server";
import { getApiUserRole, isOrganizerOrAdmin } from "@/lib/supabase/api-auth";
import { getOrganizerIdForUser } from "@/lib/supabase/access";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  price_cents: number;
  is_active: boolean;
  quantity_total: number;
  quantity_sold: number | null;
};

type OrderItemInsert = {
  order_id?: string;
  ticket_type_id: string;
  name: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
};

const createOrderSchema = z.object({
  eventId: z.string().trim().min(1),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).max(20),
      }),
    )
    .min(1),
  buyerName: z.string().trim().optional(),
  buyerEmail: z.string().trim().email().optional(),
  buyerDocument: z.string().trim().optional(),
});

export const runtime = "nodejs";

async function rollbackStockReservations(
  ticketTypeRows: Map<string, TicketTypeRow>,
  reserved: Array<{ ticketTypeId: string; previousSold: number }>,
) {
  const supabase = createSupabaseServiceRoleClient();

  for (const entry of reserved.reverse()) {
    const row = ticketTypeRows.get(entry.ticketTypeId);
    if (!row) continue;

    await supabase
      .from("ticket_types")
      .update({ quantity_sold: entry.previousSold })
      .eq("id", entry.ticketTypeId);

    row.quantity_sold = entry.previousSold;
  }
}

export async function GET(request: NextRequest) {
  if (!hasServiceSupabaseEnv()) return NextResponse.json({ orders: [] });

  const auth = await getApiUserRole(request);
  if (!auth || !isOrganizerOrAdmin(auth.role)) {
    return apiError(401, "Nao autorizado.");
  }

  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("orders")
    .select("id,event_id,status,total_cents,currency,buyer_name,buyer_email,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (auth.role === "organizer") {
    const organizerId = await getOrganizerIdForUser(supabase, auth.userId);
    if (!organizerId) return NextResponse.json({ orders: [] });

    const { data: events } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_id", organizerId)
      .limit(200);

    const eventIds = (events ?? []).map((event) => event.id);
    if (!eventIds.length) return NextResponse.json({ orders: [] });

    query = query.in("event_id", eventIds);
  }

  const { data, error } = await query;
  if (error) return apiError(500, error.message);
  return NextResponse.json({ orders: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  if (!hasServiceSupabaseEnv()) {
    const fallbackOrderId = crypto.randomUUID();
    console.info("[orders] service env missing, returning fallback order", {
      eventId: parsed.data.eventId,
      items: parsed.data.items,
      orderId: fallbackOrderId,
    });
    return NextResponse.json({ orderId: fallbackOrderId }, { status: 201 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { eventId, items, buyerEmail, buyerName, buyerDocument } = parsed.data;
  console.info("[orders] create request", {
    eventId,
    items,
  });

  let userId: string | null = null;
  let resolvedBuyerEmail = buyerEmail ?? null;

  if (hasPublicSupabaseEnv()) {
    const publicEnv = requirePublicSupabaseEnv();
    const auth = createServerClient(publicEnv.url, publicEnv.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    });

    const {
      data: { user },
    } = await auth.auth.getUser();

    userId = user?.id ?? null;
    if (!resolvedBuyerEmail && user?.email) resolvedBuyerEmail = user.email;
  }

  const requestedQuantities = new Map<string, number>();
  for (const item of items) {
    requestedQuantities.set(
      item.ticketTypeId,
      (requestedQuantities.get(item.ticketTypeId) ?? 0) + item.quantity,
    );
  }

  const ticketTypeIds = [...requestedQuantities.keys()];
  const { data: ticketTypes, error: ticketTypesError } = await supabase
    .from("ticket_types")
    .select("id,event_id,name,price_cents,is_active,quantity_total,quantity_sold")
    .in("id", ticketTypeIds);

  if (ticketTypesError || !ticketTypes) {
    return apiError(
      500,
      ticketTypesError?.message ?? "Falha ao carregar os lotes do pedido.",
    );
  }

  const ticketTypeRows = new Map(
    (ticketTypes as TicketTypeRow[]).map((ticketType) => [ticketType.id, ticketType]),
  );

  let totalCents = 0;
  const orderItemsToInsert: OrderItemInsert[] = [];

  for (const item of items) {
    const ticketType = ticketTypeRows.get(item.ticketTypeId);
    if (!ticketType || ticketType.event_id !== eventId || !ticketType.is_active) {
      return apiError(400, "Lote invalido ou inativo.");
    }

    const currentSold = ticketType.quantity_sold ?? 0;
    const available = ticketType.quantity_total - currentSold;
    if (item.quantity > available) {
      return apiError(409, `Estoque insuficiente para o lote "${ticketType.name}".`);
    }

    const lineTotal = ticketType.price_cents * item.quantity;
    totalCents += lineTotal;

    orderItemsToInsert.push({
      ticket_type_id: ticketType.id,
      name: ticketType.name,
      quantity: item.quantity,
      unit_price_cents: ticketType.price_cents,
      total_cents: lineTotal,
    });
  }

  const reserved: Array<{ ticketTypeId: string; previousSold: number }> = [];
  for (const [ticketTypeId, quantity] of requestedQuantities) {
    const ticketType = ticketTypeRows.get(ticketTypeId);
    if (!ticketType) continue;

    const previousSold = ticketType.quantity_sold ?? 0;
    const nextSold = previousSold + quantity;

    const { data: updatedRow, error: reserveError } = await supabase
      .from("ticket_types")
      .update({ quantity_sold: nextSold })
      .eq("id", ticketTypeId)
      .eq("quantity_sold", previousSold)
      .select("id")
      .maybeSingle();

    if (reserveError || !updatedRow) {
      await rollbackStockReservations(ticketTypeRows, reserved);
      return apiError(
        409,
        "Nao foi possivel reservar o estoque. Atualize a pagina e tente novamente.",
      );
    }

    ticketType.quantity_sold = nextSold;
    reserved.push({ ticketTypeId, previousSold });
  }

  try {
    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .insert({
        event_id: eventId,
        user_id: userId,
        status: "pending",
        total_cents: totalCents,
        currency: "BRL",
        buyer_name: buyerName ?? null,
        buyer_email: resolvedBuyerEmail,
        buyer_document: buyerDocument ?? null,
      })
      .select("id")
      .single();

    if (orderError || !orderRow) {
      throw new Error(orderError?.message ?? "Falha ao criar pedido.");
    }

    const orderId = orderRow.id as string;
    console.info("[orders] order created", {
      orderId,
      eventId,
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert.map((item) => ({ ...item, order_id: orderId })));

    if (itemsError) {
      throw new Error(itemsError?.message ?? "Falha ao criar itens do pedido.");
    }

    console.info("[orders] order items created", {
      orderId,
      items: orderItemsToInsert.map((item) => ({
        ticketTypeId: item.ticket_type_id,
        quantity: item.quantity,
      })),
    });

    return NextResponse.json({ orderId }, { status: 201 });
  } catch (error) {
    await rollbackStockReservations(ticketTypeRows, reserved);
    const message = error instanceof Error ? error.message : "Falha ao criar pedido.";
    console.error("[orders] create failed", {
      eventId,
      items,
      message,
    });
    return apiError(500, message);
  }
}
