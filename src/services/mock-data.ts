import type { Event, TicketType } from "@/types";

export const MOCK_EVENTS: Event[] = [];

export const MOCK_TICKET_TYPES: TicketType[] = [];

export function mockTicketTypesForEvent(eventId: string) {
  return MOCK_TICKET_TYPES.filter((ticket) => ticket.eventId === eventId);
}

export function mockEventBySlug(slug: string) {
  return MOCK_EVENTS.find((event) => event.slug === slug) ?? null;
}
