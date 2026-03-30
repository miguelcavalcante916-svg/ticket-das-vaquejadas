export type TicketStatus = "active" | "used" | "canceled";

export interface Ticket {
  id: string;
  orderId: string;
  eventId: string;
  ticketTypeId: string;
  code: string;
  qrPayload: string;
  status: TicketStatus;
  createdAt: string;
  checkedInAt?: string | null;

  eventTitle?: string;
  eventStartDate?: string;
  city?: string;
  state?: string;
  ticketTypeName?: string;
}

