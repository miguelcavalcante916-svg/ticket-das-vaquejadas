import type { Event } from "@/types";
import { EventCard } from "@/components/events/event-card";

export function EventGrid({
  events,
}: {
  events: Array<Event & { startingPriceCents?: number | null }>;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          startingPriceCents={event.startingPriceCents ?? null}
        />
      ))}
    </div>
  );
}

