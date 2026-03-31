import { unstable_noStore as noStore } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Event, TicketType } from "@/types";
import { hasPublicSupabaseEnv } from "@/lib/env/public";
import { hasServiceSupabaseEnv } from "@/lib/env/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";

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
type EventsReader = {
  client: SupabaseClient;
  source: "service-role" | "anon";
};

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

function formatEventDebugRows(rows: GenericRow[] | null) {
  return (rows ?? []).map((row) => ({
    id: getStringValue(row, ["id"]),
    slug: getStringValue(row, ["slug"]),
    title: getStringValue(row, ["title"]),
    city: getStringValue(row, ["city"]),
    state: getStringValue(row, ["state"]),
    date: getStringValue(row, ["start_date", "date"]),
    banner_url: getStringValue(row, ["banner_url", "cover_image_url"]),
    status: getStringValue(row, ["status"]),
  }));
}

function buildEnvError() {
  const hasPublicEnv = hasPublicSupabaseEnv();
  const hasServiceEnv = hasServiceSupabaseEnv();

  if (!hasPublicEnv && !hasServiceEnv) {
    return "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ou configure SUPABASE_SERVICE_ROLE_KEY no servidor.";
  }

  if (!hasPublicEnv && hasServiceEnv) {
    return "A service role existe, mas NEXT_PUBLIC_SUPABASE_ANON_KEY não está configurada corretamente.";
  }

  return "Não foi possível criar o cliente do Supabase para listar eventos.";
}

async function createEventsReader(): Promise<EventsReader | null> {
  if (hasServiceSupabaseEnv()) {
    return {
      client: createSupabaseServiceRoleClient(),
      source: "service-role",
    };
  }

  if (hasPublicSupabaseEnv()) {
    return {
      client: await createSupabaseServerClient(),
      source: "anon",
    };
  }

  return null;
}

function mapEvent(row: GenericRow): Event | null {
  const id = getStringValue(row, ["id"]);
  const slug = getStringValue(row, ["slug"]);
  const title = getStringValue(row, ["title"]);
  const city = getStringValue(row, ["city"]);
  const state = getStringValue(row, ["state"]);
  const startDate = getStringValue(row, ["start_date", "date"]);

  if (!id || !slug || !title || !city || !state || !startDate) {
    return null;
  }

  return {
    id,
    organizerId: getStringValue(row, ["organizer_id"]),
    slug,
    title,
    description: getStringValue(row, ["description"]) ?? "",
    startDate,
    endDate: getStringValue(row, ["end_date"]),
    city,
    state: state.toUpperCase() as Event["state"],
    venueName: getStringValue(row, ["venue_name"]),
    address: getStringValue(row, ["address"]),
    coverImageUrl: getStringValue(row, ["cover_image_url", "banner_url"]),
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

function shouldExposeEvent(row: GenericRow) {
  const status = getStringValue(row, ["status"]);
  return status ? status === "published" : true;
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

  const reader = await createEventsReader();
  const hasPublicEnv = hasPublicSupabaseEnv();
  const hasServiceEnv = hasServiceSupabaseEnv();

  console.info("[events] list env", {
    hasPublicEnv,
    hasServiceEnv,
    reader: reader?.source ?? null,
  });

  if (!reader) {
    const error = buildEnvError();
    console.error("[events] list config error", { error });
    return { events: [], error };
  }

  const { data, error } = await reader.client.from("events").select("*").limit(60);
  const rawRows = (data ?? null) as GenericRow[] | null;

  console.info("[events] list raw result", {
    source: reader.source,
    error: error?.message ?? null,
    count: rawRows?.length ?? 0,
    rows: formatEventDebugRows(rawRows),
  });

  if (error) {
    const message = `Falha ao consultar a tabela events no Supabase: ${error.message}`;
    console.error("[events] list query failed", {
      source: reader.source,
      error: error.message,
    });
    return { events: [], error: message };
  }

  const mappedEvents = sortEventsByDate(
    (rawRows ?? [])
      .filter(shouldExposeEvent)
      .map(mapEvent)
      .filter((event): event is Event => Boolean(event)),
  );

  console.info("[events] list mapped result", {
    source: reader.source,
    count: mappedEvents.length,
  });

  if (!mappedEvents.length) {
    return { events: [], error: null };
  }

  const eventIds = mappedEvents.map((event) => event.id);
  const { data: ticketRows, error: ticketError } = await reader.client
    .from("ticket_types")
    .select("*")
    .in("event_id", eventIds);

  const rawTicketRows = (ticketRows ?? null) as GenericRow[] | null;

  console.info("[events] ticket types raw result", {
    source: reader.source,
    error: ticketError?.message ?? null,
    count: rawTicketRows?.length ?? 0,
    rows: rawTicketRows,
  });

  const minPriceByEvent = new Map<string, number>();

  if (!ticketError) {
    for (const ticketType of (rawTicketRows ?? [])
      .map(mapTicketType)
      .filter((type): type is TicketType => Boolean(type))) {
      if (!ticketType.isActive) continue;
      const previous = minPriceByEvent.get(ticketType.eventId);
      if (typeof previous !== "number" || ticketType.priceCents < previous) {
        minPriceByEvent.set(ticketType.eventId, ticketType.priceCents);
      }
    }
  }

  const events = mappedEvents.map((event) => ({
    ...event,
    startingPriceCents: minPriceByEvent.get(event.id) ?? null,
  }));

  if (ticketError) {
    const message = `Eventos carregados, mas os lotes não puderam ser lidos: ${ticketError.message}`;
    console.error("[events] ticket types query failed", {
      source: reader.source,
      error: ticketError.message,
    });
    return { events, error: message };
  }

  return { events, error: null };
}

export async function getEventBySlug(slug: string): Promise<PublicEventDetailResult> {
  noStore();

  const reader = await createEventsReader();
  const hasPublicEnv = hasPublicSupabaseEnv();
  const hasServiceEnv = hasServiceSupabaseEnv();

  console.info("[events] detail env", {
    slug,
    hasPublicEnv,
    hasServiceEnv,
    reader: reader?.source ?? null,
  });

  if (!reader) {
    const error = buildEnvError();
    console.error("[events] detail config error", { slug, error });
    return { event: null, ticketTypes: [], error };
  }

  const { data, error } = await reader.client
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  const rawEvent = (data ?? null) as GenericRow | null;

  console.info("[events] detail raw result", {
    slug,
    source: reader.source,
    error: error?.message ?? null,
    row: rawEvent
      ? {
          id: getStringValue(rawEvent, ["id"]),
          slug: getStringValue(rawEvent, ["slug"]),
          title: getStringValue(rawEvent, ["title"]),
          date: getStringValue(rawEvent, ["start_date", "date"]),
          banner_url: getStringValue(rawEvent, ["banner_url", "cover_image_url"]),
          status: getStringValue(rawEvent, ["status"]),
        }
      : null,
  });

  if (error) {
    const message = `Falha ao consultar o evento no Supabase: ${error.message}`;
    console.error("[events] detail query failed", {
      slug,
      source: reader.source,
      error: error.message,
    });
    return { event: null, ticketTypes: [], error: message };
  }

  if (!rawEvent || !shouldExposeEvent(rawEvent)) {
    return { event: null, ticketTypes: [], error: null };
  }

  const event = mapEvent(rawEvent);
  if (!event) {
    return {
      event: null,
      ticketTypes: [],
      error: "O evento foi encontrado, mas os campos obrigatórios estão incompletos no banco.",
    };
  }

  const { data: ticketRows, error: ticketError } = await reader.client
    .from("ticket_types")
    .select("*")
    .eq("event_id", event.id);

  const ticketTypes = ((ticketRows ?? []) as GenericRow[])
    .map(mapTicketType)
    .filter((ticketType): ticketType is TicketType => Boolean(ticketType))
    .filter((ticketType) => ticketType.isActive)
    .sort((left, right) => left.priceCents - right.priceCents);

  console.info("[events] detail ticket types result", {
    slug,
    source: reader.source,
    error: ticketError?.message ?? null,
    count: ticketTypes.length,
    rows: ticketRows ?? null,
  });

  if (ticketError) {
    const message = `O evento foi carregado, mas os lotes não puderam ser lidos: ${ticketError.message}`;
    console.error("[events] detail ticket types failed", {
      slug,
      source: reader.source,
      error: ticketError.message,
    });
    return { event, ticketTypes: [], error: message };
  }

  return { event, ticketTypes, error: null };
}
