import type { Event } from "@/types";
import { EventCard } from "@/components/events/event-card";

type EventWithCheckout = Event & {
  startingPriceCents?: number | null;
  defaultTicketTypeId?: string | null;
};

export function EventGrid({
  events,
}: {
  events: EventWithCheckout[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          startingPriceCents={event.startingPriceCents ?? null}
          defaultTicketTypeId={event.defaultTicketTypeId ?? null}
        />
      ))}
    </div>
  );
}
