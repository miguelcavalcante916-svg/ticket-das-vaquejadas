export type EventStatus = "draft" | "published" | "ended";

export type Uf =
  | "AC"
  | "AL"
  | "AP"
  | "AM"
  | "BA"
  | "CE"
  | "DF"
  | "ES"
  | "GO"
  | "MA"
  | "MT"
  | "MS"
  | "MG"
  | "PA"
  | "PB"
  | "PR"
  | "PE"
  | "PI"
  | "RJ"
  | "RN"
  | "RS"
  | "RO"
  | "RR"
  | "SC"
  | "SP"
  | "SE"
  | "TO";

export interface Event {
  id: string;
  organizerId?: string | null;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  city: string;
  state: Uf;
  venueName?: string | null;
  address?: string | null;
  coverImageUrl?: string | null;
  status: EventStatus;
  featured?: boolean;
}

export interface EventImage {
  id: string;
  eventId: string;
  url: string;
  sortOrder: number;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  priceCents: number;
  quantityTotal: number;
  quantitySold: number;
  isActive: boolean;
}

