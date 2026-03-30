import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  price_cents: number;
  is_active: boolean;
};

type OrderItemInsert = {
  order_id?: string;
  ticket_type_id: string;
  name: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
};

type OrderItemRow = {
  id: string;
  ticket_type_id: string;
  quantity: number;
};

type TicketInsert = {
  order_id: string;
  order_item_id: string;
  event_id: string;
  ticket_type_id: string;
  user_id: string | null;
  code: string;
  qr_payload: string;
  status: "active";
};

const createOrderSchema = z.object({
  eventId: z.string().min(1),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(20),
      }),
    )
    .min(1),
  buyerName: z.string().optional(),
  buyerEmail: z.string().email().optional(),
  buyerDocument: z.string().optional(),
});

function hasServiceEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function ticketCode() {
  return `TVQ-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

export async function GET() {
  if (!hasServiceEnv()) return NextResponse.json({ orders: [] });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from("orders")
    .select("id,event_id,status,total_cents,currency,buyer_name,buyer_email,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  if (!hasServiceEnv()) {
    return NextResponse.json({ orderId: crypto.randomUUID() }, { status: 201 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let userId: string | null = null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { eventId, items, buyerEmail, buyerName, buyerDocument } = parsed.data;
  let resolvedBuyerEmail = buyerEmail ?? null;

  if (url && anonKey) {
    const auth = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No-op: somente leitura de sessão.
        },
      },
    });
    const {
      data: { user },
    } = await auth.auth.getUser();
    userId = user?.id ?? null;
    if (!resolvedBuyerEmail && user?.email) resolvedBuyerEmail = user.email;
  }

  const ticketTypeIds = items.map((i) => i.ticketTypeId);

  const { data: ticketTypes, error: ttError } = await supabase
    .from("ticket_types")
    .select("id,event_id,name,price_cents,is_active")
    .in("id", ticketTypeIds);

  if (ttError || !ticketTypes) {
    return NextResponse.json(
      { message: ttError?.message ?? "Falha ao carregar lotes" },
      { status: 500 },
    );
  }

  const ticketTypeRows = (ticketTypes ?? []) as TicketTypeRow[];
  const allowed = new Map(
    ticketTypeRows
      .filter((t) => t.event_id === eventId && t.is_active)
      .map((t) => [t.id, t] as const),
  );

  let totalCents = 0;
  const orderItemsToInsert: OrderItemInsert[] = [];
  for (const i of items) {
    const tt = allowed.get(i.ticketTypeId);
    if (!tt) {
      return NextResponse.json(
        { message: "Lote inválido ou inativo" },
        { status: 400 },
      );
    }
    const unit = tt.price_cents;
    const line = unit * i.quantity;
    totalCents += line;
    orderItemsToInsert.push({
      ticket_type_id: tt.id,
      name: tt.name,
      quantity: i.quantity,
      unit_price_cents: unit,
      total_cents: line,
    });
  }

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
    return NextResponse.json(
      { message: orderError?.message ?? "Falha ao criar pedido" },
      { status: 500 },
    );
  }

  const orderId = orderRow.id as string;

  const { data: itemRows, error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsToInsert.map((i) => ({ ...i, order_id: orderId })))
    .select("id,ticket_type_id,quantity")
    .order("created_at", { ascending: true });

  if (itemsError || !itemRows) {
    return NextResponse.json(
      { message: itemsError?.message ?? "Falha ao criar itens" },
      { status: 500 },
    );
  }

  const ticketsToInsert: TicketInsert[] = [];
  for (const item of itemRows as unknown as OrderItemRow[]) {
    const qty = item.quantity;
    const ttId = item.ticket_type_id;
    for (let n = 0; n < qty; n++) {
      const code = ticketCode();
      ticketsToInsert.push({
        order_id: orderId,
        order_item_id: item.id,
        event_id: eventId,
        ticket_type_id: ttId,
        user_id: userId,
        code,
        qr_payload: `tvq:${code}`,
        status: "active",
      });
    }
  }

  const { error: ticketsError } = await supabase.from("tickets").insert(ticketsToInsert);
  if (ticketsError) {
    return NextResponse.json(
      { message: ticketsError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ orderId }, { status: 201 });
}
