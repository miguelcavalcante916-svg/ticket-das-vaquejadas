"use client";

import * as React from "react";

import type { Event } from "@/types";
import { EmptyState } from "@/components/empty-state";
import { EventFilters, type EventFiltersValue } from "@/components/events/event-filters";
import { EventGrid } from "@/components/events/event-grid";

type EventWithPrice = Event & { startingPriceCents?: number | null };

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function EventsExplorer({ events }: { events: EventWithPrice[] }) {
  const [filters, setFilters] = React.useState<EventFiltersValue>({
    query: "",
    state: "all",
    city: "",
  });

  const filtered = React.useMemo(() => {
    const q = normalize(filters.query);
    const city = normalize(filters.city);
    return events.filter((e) => {
      const haystack = normalize(`${e.title} ${e.description} ${e.city} ${e.state}`);
      const okQuery = q ? haystack.includes(q) : true;
      const okState = filters.state === "all" ? true : e.state === filters.state;
      const okCity = city ? normalize(e.city).includes(city) : true;
      return okQuery && okState && okCity;
    });
  }, [events, filters.city, filters.query, filters.state]);

  return (
    <div className="space-y-6">
      <EventFilters value={filters} onChange={setFilters} />
      {filtered.length > 0 ? (
        <EventGrid events={filtered} />
      ) : (
        <EmptyState
          title="Nenhum evento encontrado"
          description="Tente ajustar os filtros ou buscar por outro termo."
        />
      )}
    </div>
  );
}

