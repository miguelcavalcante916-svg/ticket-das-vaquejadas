import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

import { getApiUserRole, isOrganizerOrAdmin } from "@/lib/supabase/api-auth";
import { MOCK_EVENTS, mockTicketTypesForEvent } from "@/services/mock-data";

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  startDate: z.string().min(4).optional(),
  endDate: z.string().optional().nullable(),
  city: z.string().min(2).optional(),
  state: z.string().length(2).optional(),
  venueName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "published", "ended"]).optional(),
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
    const event = MOCK_EVENTS.find((e) => e.id === id) ?? null;
    return NextResponse.json({
      event,
      ticketTypes: event ? mockTicketTypesForEvent(event.id) : [],
    });
  }

  const auth = await getApiUserRole(request);
  const canAdminRead = auth && isOrganizerOrAdmin(auth.role) && hasServiceEnv();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    canAdminRead ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  let eventQuery = supabase
    .from("events")
    .select(
      "id,organizer_id,slug,title,description,start_date,end_date,city,state,venue_name,address,cover_image_url,status,featured",
    )
    .eq("id", id);

  if (!canAdminRead) eventQuery = eventQuery.eq("status", "published");

  const { data: event, error } = await eventQuery.maybeSingle();

  if (error || !event) return NextResponse.json({ event: null, ticketTypes: [] });

  if (canAdminRead && auth.role === "organizer") {
    const { data: organizer } = await supabase
      .from("organizers")
      .select("id")
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (!organizer?.id || organizer.id !== event.organizer_id) {
      return NextResponse.json({ event: null, ticketTypes: [] }, { status: 403 });
    }
  }

  let ticketTypesQuery = supabase
    .from("ticket_types")
    .select("id,event_id,name,description,price_cents,quantity_total,quantity_sold,is_active")
    .eq("event_id", id)
    .order("price_cents", { ascending: true });

  if (!canAdminRead) ticketTypesQuery = ticketTypesQuery.eq("is_active", true);

  const { data: ticketTypes } = await ticketTypesQuery;

  return NextResponse.json({ event, ticketTypes: ticketTypes ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!hasServiceEnv()) {
    return NextResponse.json(
      { message: "Configure SUPABASE_SERVICE_ROLE_KEY para editar eventos." },
      { status: 500 },
    );
  }

  const auth = await getApiUserRole(request);
  if (!auth || !isOrganizerOrAdmin(auth.role)) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
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
  const patch: Record<string, unknown> = {};
  if (values.title !== undefined) patch.title = values.title;
  if (values.slug !== undefined) patch.slug = values.slug;
  if (values.description !== undefined) patch.description = values.description;
  if (values.startDate !== undefined) patch.start_date = values.startDate;
  if (values.endDate !== undefined) patch.end_date = values.endDate;
  if (values.city !== undefined) patch.city = values.city;
  if (values.state !== undefined) patch.state = values.state;
  if (values.venueName !== undefined) patch.venue_name = values.venueName;
  if (values.address !== undefined) patch.address = values.address;
  if (values.coverImageUrl !== undefined)
    patch.cover_image_url = values.coverImageUrl || null;
  if (values.featured !== undefined) patch.featured = values.featured;
  if (values.status !== undefined) patch.status = values.status;

  const { data, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", id)
    .select("id,slug")
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}
