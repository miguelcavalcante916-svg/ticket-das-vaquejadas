import type { Event, TicketType } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MOCK_EVENTS, mockEventBySlug, mockTicketTypesForEvent } from "@/services/mock-data";

type EventWithCheckout = Event & {
  startingPriceCents?: number | null;
  defaultTicketTypeId?: string | null;
};

type EventRow = {
  id: string;
  organizer_id?: string | null;
  slug: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  city: string;
  state: string;
  venue_name?: string | null;
  address?: string | null;
  cover_image_url?: string | null;
  status?: string | null;
  featured?: boolean | null;
};

type TicketTypeRow = {
  id: string;
  event_id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  quantity_total: number;
  quantity_sold?: number | null;
  is_active: boolean;
};

type TicketTypeSummaryRow = {
  id: string;
  event_id: string;
  price_cents: number;
  quantity_total: number;
  quantity_sold?: number | null;
  is_active: boolean;
};

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    organizerId: row.organizer_id ?? null,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    startDate: row.start_date,
    endDate: row.end_date ?? null,
    city: row.city,
    state: row.state as Event["state"],
    venueName: row.venue_name ?? null,
    address: row.address ?? null,
    coverImageUrl: row.cover_image_url ?? null,
    status: (row.status as Event["status"]) ?? "published",
    featured: Boolean(row.featured),
  };
}

function mapTicketType(row: TicketTypeRow): TicketType {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    description: row.description ?? null,
    priceCents: row.price_cents,
    quantityTotal: row.quantity_total,
    quantitySold: row.quantity_sold ?? 0,
    isActive: Boolean(row.is_active),
  };
}

function getDefaultTicketTypeId(ticketTypes: Array<{
  id: string;
  priceCents: number;
  quantityTotal: number;
  quantitySold: number;
  isActive: boolean;
}>) {
  const saleable = ticketTypes
    .filter((ticket) => ticket.isActive && ticket.quantityTotal - ticket.quantitySold > 0)
    .sort((left, right) => left.priceCents - right.priceCents);

  return saleable[0]?.id ?? null;
}

export async function listPublicEvents(): Promise<EventWithCheckout[]> {
  if (!hasSupabaseEnv()) {
    return MOCK_EVENTS.map((event) => {
      const ticketTypes = mockTicketTypesForEvent(event.id).filter((ticket) => ticket.isActive);
      const startingPriceCents =
        ticketTypes.length > 0 ? Math.min(...ticketTypes.map((ticket) => ticket.priceCents)) : null;

      return {
        ...event,
        startingPriceCents,
        defaultTicketTypeId: getDefaultTicketTypeId(ticketTypes),
      };
    });
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id,organizer_id,slug,title,description,start_date,end_date,city,state,venue_name,address,cover_image_url,status,featured",
    )
    .eq("status", "published")
    .order("start_date", { ascending: true })
    .limit(60);

  if (error || !data) {
    return MOCK_EVENTS.map((event) => ({
      ...event,
      startingPriceCents: null,
      defaultTicketTypeId: getDefaultTicketTypeId(mockTicketTypesForEvent(event.id)),
    }));
  }

  const rows = data as EventRow[];
  const events = rows.map(mapEvent);
  const eventIds = events.map((event) => event.id);

  const { data: typesData } = await supabase
    .from("ticket_types")
    .select("id,event_id,price_cents,quantity_total,quantity_sold,is_active")
    .in("event_id", eventIds)
    .eq("is_active", true);

  const ticketTypesByEvent = new Map<string, TicketTypeSummaryRow[]>();

  for (const ticketType of (typesData ?? []) as TicketTypeSummaryRow[]) {
    const list = ticketTypesByEvent.get(ticketType.event_id) ?? [];
    list.push(ticketType);
    ticketTypesByEvent.set(ticketType.event_id, list);
  }

  return events.map((event) => {
    const ticketTypes = ticketTypesByEvent.get(event.id) ?? [];
    const saleable = ticketTypes.filter(
      (ticketType) =>
        ticketType.is_active &&
        ticketType.quantity_total - (ticketType.quantity_sold ?? 0) > 0,
    );

    return {
      ...event,
      startingPriceCents:
        saleable.length > 0
          ? Math.min(...saleable.map((ticketType) => ticketType.price_cents))
          : null,
      defaultTicketTypeId:
        saleable.sort((left, right) => left.price_cents - right.price_cents)[0]?.id ?? null,
    };
  });
}

export async function getEventBySlug(slug: string): Promise<{
  event: Event | null;
  ticketTypes: TicketType[];
}> {
  if (!hasSupabaseEnv()) {
    const event = mockEventBySlug(slug);
    if (!event) return { event: null, ticketTypes: [] };
    return { event, ticketTypes: mockTicketTypesForEvent(event.id) };
  }

  const supabase = await createSupabaseServerClient();
  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .select(
      "id,organizer_id,slug,title,description,start_date,end_date,city,state,venue_name,address,cover_image_url,status,featured",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (eventError || !eventRow) return { event: null, ticketTypes: [] };
  const event = mapEvent(eventRow);

  const { data: typeRows } = await supabase
    .from("ticket_types")
    .select(
      "id,event_id,name,description,price_cents,quantity_total,quantity_sold,is_active",
    )
    .eq("event_id", event.id)
    .order("price_cents", { ascending: true });

  return { event, ticketTypes: ((typeRows ?? []) as TicketTypeRow[]).map(mapTicketType) };
}
