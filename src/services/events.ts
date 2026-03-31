import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";

import type { Event, TicketType } from "@/types";
import { requirePublicSupabaseEnv } from "@/lib/env/public";

export type EventWithPrice = Event & { startingPriceCents?: number | null };

export type PublicEventsResult = {
  events: EventWithPrice[];
  error: string | null;
};

export type PublicEventDetailResult = {
  event: Event | null;
  ticketTypes: TicketType[];
  error: string | null;
};

type GenericRow = Record<string, unknown>;

function createPublicSupabaseClient() {
  const { url, anonKey } = requirePublicSupabaseEnv();

  console.log("SUPABASE_URL:", url);
  console.log("SUPABASE_ANON_CONFIGURADA:", Boolean(anonKey));

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getStringValue(row: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getNumberValue(row: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function getBooleanValue(row: GenericRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function mapEvent(row: GenericRow): Event | null {
  const id = getStringValue(row, ["id"]);
  const title = getStringValue(row, ["title"]);
  const slug = getStringValue(row, ["slug"]);
  const city = getStringValue(row, ["city"]);
  const state = getStringValue(row, ["state"]);
  const date = getStringValue(row, ["date", "start_date"]);

  if (!id || !title || !slug || !city || !state || !date) {
    return null;
  }

  return {
    id,
    title,
    slug,
    city,
    state: state.toUpperCase() as Event["state"],
    description: getStringValue(row, ["description"]) ?? "",
    startDate: date,
    endDate: getStringValue(row, ["end_date"]),
    venueName: getStringValue(row, ["venue_name"]),
    address: getStringValue(row, ["address"]),
    coverImageUrl: getStringValue(row, ["banner_url", "cover_image_url"]),
    organizerId: getStringValue(row, ["organizer_id"]),
    status: (getStringValue(row, ["status"]) as Event["status"]) ?? "published",
    featured: getBooleanValue(row, ["featured"]) ?? false,
  };
}

function mapTicketType(row: GenericRow): TicketType | null {
  const id = getStringValue(row, ["id"]);
  const eventId = getStringValue(row, ["event_id"]);
  const name = getStringValue(row, ["name"]);
  const priceCents = getNumberValue(row, ["price_cents", "price"]);
  const quantityTotal = getNumberValue(row, ["quantity_total", "quantity"]);

  if (!id || !eventId || !name || priceCents === null || quantityTotal === null) {
    return null;
  }

  return {
    id,
    eventId,
    name,
    description: getStringValue(row, ["description"]),
    priceCents,
    quantityTotal,
    quantitySold: getNumberValue(row, ["quantity_sold"]) ?? 0,
    isActive: getBooleanValue(row, ["is_active"]) ?? true,
  };
}

function sortEventsByDate(events: Event[]) {
  return [...events].sort((left, right) => {
    const leftDate = new Date(left.startDate).getTime();
    const rightDate = new Date(right.startDate).getTime();
    return leftDate - rightDate;
  });
}

export async function listPublicEvents(): Promise<PublicEventsResult> {
  noStore();

  try {
    const supabase = createPublicSupabaseClient();

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    console.log("EVENTOS:", data);
    console.log("ERRO:", error);
    console.log("QUANTIDADE_EVENTOS:", data?.length ?? 0);

    if (error) {
      return {
        events: [],
        error: `Falha ao carregar eventos: ${error.message}`,
      };
    }

    const rows = (data ?? []) as GenericRow[];
    const events = sortEventsByDate(
      rows.map(mapEvent).filter((event): event is Event => Boolean(event)),
    );

    if (!events.length) {
      return {
        events: [],
        error: null,
      };
    }

    const eventIds = events.map((event) => event.id);
    const { data: ticketRows, error: ticketError } = await supabase
      .from("ticket_types")
      .select("*")
      .in("event_id", eventIds);

    if (ticketError) {
      return {
        events: events.map((event) => ({ ...event, startingPriceCents: null })),
        error: `Eventos carregados, mas os lotes falharam: ${ticketError.message}`,
      };
    }

    const minPriceByEvent = new Map<string, number>();

    for (const ticketType of ((ticketRows ?? []) as GenericRow[])
      .map(mapTicketType)
      .filter((type): type is TicketType => Boolean(type))) {
      if (!ticketType.isActive) continue;
      const previous = minPriceByEvent.get(ticketType.eventId);
      if (typeof previous !== "number" || ticketType.priceCents < previous) {
        minPriceByEvent.set(ticketType.eventId, ticketType.priceCents);
      }
    }

    return {
      events: events.map((event) => ({
        ...event,
        startingPriceCents: minPriceByEvent.get(event.id) ?? null,
      })),
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao carregar eventos.";

    console.log("EVENTOS:", null);
    console.log("ERRO:", message);

    return {
      events: [],
      error: message,
    };
  }
}

export async function getEventBySlug(slug: string): Promise<PublicEventDetailResult> {
  noStore();

  try {
    const supabase = createPublicSupabaseClient();

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    console.log("EVENTO_SLUG:", slug);
    console.log("EVENTO_RESULTADO:", data);
    console.log("ERRO_EVENTO:", error);

    if (error) {
      return {
        event: null,
        ticketTypes: [],
        error: `Falha ao carregar o evento: ${error.message}`,
      };
    }

    const event = data ? mapEvent(data as GenericRow) : null;

    if (!event) {
      return {
        event: null,
        ticketTypes: [],
        error: null,
      };
    }

    const { data: ticketRows, error: ticketError } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("event_id", event.id);

    if (ticketError) {
      return {
        event,
        ticketTypes: [],
        error: `Evento carregado, mas os lotes falharam: ${ticketError.message}`,
      };
    }

    return {
      event,
      ticketTypes: ((ticketRows ?? []) as GenericRow[])
        .map(mapTicketType)
        .filter((ticketType): ticketType is TicketType => Boolean(ticketType))
        .filter((ticketType) => ticketType.isActive)
        .sort((left, right) => left.priceCents - right.priceCents),
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao carregar o evento.";

    console.log("EVENTO_SLUG:", slug);
    console.log("ERRO_EVENTO:", message);

    return {
      event: null,
      ticketTypes: [],
      error: message,
    };
  }
}
