import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

import { getApiUserRole, isOrganizerOrAdmin } from "@/lib/supabase/api-auth";
import { mockTicketTypesForEvent } from "@/services/mock-data";

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  priceCents: z.coerce.number().int().min(0),
  quantityTotal: z.coerce.number().int().min(1),
  isActive: z.boolean().default(true),
});

function hasAnonEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function hasServiceEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!hasAnonEnv()) {
    return NextResponse.json({ ticketTypes: mockTicketTypesForEvent(id) });
  }

  const auth = await getApiUserRole(request);
  const canAdminRead = auth && isOrganizerOrAdmin(auth.role) && hasServiceEnv();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    canAdminRead ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  if (canAdminRead && auth.role === "organizer") {
    const { data: organizer } = await supabase
      .from("organizers")
      .select("id")
      .eq("user_id", auth.userId)
      .maybeSingle();

    const { data: event } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", id)
      .maybeSingle();

    if (!organizer?.id || !event?.organizer_id || organizer.id !== event.organizer_id) {
      return NextResponse.json({ ticketTypes: [] }, { status: 403 });
    }
  }

  let query = supabase
    .from("ticket_types")
    .select("id,event_id,name,description,price_cents,quantity_total,quantity_sold,is_active")
    .eq("event_id", id)
    .order("price_cents", { ascending: true });

  if (!canAdminRead) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ticketTypes: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!hasServiceEnv()) {
    return NextResponse.json(
      { message: "Configure SUPABASE_SERVICE_ROLE_KEY para criar lotes." },
      { status: 500 },
    );
  }

  const auth = await getApiUserRole(request);
  if (!auth || !isOrganizerOrAdmin(auth.role)) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  if (auth.role === "organizer") {
    const { data: organizer } = await supabase
      .from("organizers")
      .select("id")
      .eq("user_id", auth.userId)
      .maybeSingle();

    const { data: event } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", id)
      .maybeSingle();

    if (!organizer?.id || !event?.organizer_id || organizer.id !== event.organizer_id) {
      return NextResponse.json({ message: "Sem acesso a este evento" }, { status: 403 });
    }
  }

  const values = parsed.data;
  const { data, error } = await supabase
    .from("ticket_types")
    .insert({
      event_id: id,
      name: values.name,
      description: values.description ?? null,
      price_cents: values.priceCents,
      quantity_total: values.quantityTotal,
      is_active: values.isActive,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ticketType: data }, { status: 201 });
}
