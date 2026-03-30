import type { Event, TicketType } from "@/types";

export const MOCK_EVENTS: Event[] = [
  {
    id: "a0f9c22a-87a6-4d42-9d5f-6dcb2be9b110",
    slug: "vaquejada-premium-do-parque",
    title: "Vaquejada Premium do Parque",
    description:
      "Uma experiência completa com pista, camarote e estrutura premium. Premiações, atrações e conforto para toda família.",
    startDate: "2026-06-20",
    city: "Fortaleza",
    state: "CE",
    venueName: "Parque de Vaquejada (Exemplo)",
    status: "published",
    featured: true,
  },
  {
    id: "c2f8c22a-87a6-4d42-9d5f-6dcb2be9b111",
    slug: "grande-vaquejada-do-sertao",
    title: "Grande Vaquejada do Sertão",
    description:
      "Tradição e adrenalina no coração do sertão. Lotes limitados com pagamento via Pix e ingresso com QR Code.",
    startDate: "2026-05-10",
    city: "Mossoró",
    state: "RN",
    venueName: "Parque do Sertão (Exemplo)",
    status: "published",
    featured: false,
  },
  {
    id: "d2f8c22a-87a6-4d42-9d5f-6dcb2be9b112",
    slug: "festival-vaquejada-de-ouro",
    title: "Festival Vaquejada de Ouro",
    description:
      "Edição especial com lineup de atrações e lotes progressivos. Garanta seu ingresso antecipado.",
    startDate: "2026-07-02",
    city: "Petrolina",
    state: "PE",
    venueName: "Arena Ouro (Exemplo)",
    status: "published",
    featured: true,
  },
];

export const MOCK_TICKET_TYPES: TicketType[] = [
  {
    id: "t1-premium",
    eventId: MOCK_EVENTS[0].id,
    name: "Pista • 1º lote",
    description: "Acesso pista + áreas comuns",
    priceCents: 5000,
    quantityTotal: 500,
    quantitySold: 120,
    isActive: true,
  },
  {
    id: "t2-premium",
    eventId: MOCK_EVENTS[0].id,
    name: "Camarote • 1º lote",
    description: "Área premium com visão privilegiada",
    priceCents: 12000,
    quantityTotal: 200,
    quantitySold: 80,
    isActive: true,
  },
  {
    id: "t1-sertao",
    eventId: MOCK_EVENTS[1].id,
    name: "Arquibancada • Lote único",
    description: "Entrada geral",
    priceCents: 3500,
    quantityTotal: 800,
    quantitySold: 260,
    isActive: true,
  },
  {
    id: "t2-sertao",
    eventId: MOCK_EVENTS[1].id,
    name: "Camarote • Lote único",
    description: "Open bar (exemplo) + área elevada",
    priceCents: 9000,
    quantityTotal: 250,
    quantitySold: 190,
    isActive: true,
  },
  {
    id: "t1-ouro",
    eventId: MOCK_EVENTS[2].id,
    name: "Pista • 1º lote",
    description: "Acesso pista",
    priceCents: 6000,
    quantityTotal: 650,
    quantitySold: 40,
    isActive: true,
  },
  {
    id: "t2-ouro",
    eventId: MOCK_EVENTS[2].id,
    name: "Backstage • Limitado",
    description: "Experiência premium (exemplo)",
    priceCents: 20000,
    quantityTotal: 60,
    quantitySold: 12,
    isActive: true,
  },
];

export function mockTicketTypesForEvent(eventId: string) {
  return MOCK_TICKET_TYPES.filter((t) => t.eventId === eventId);
}

export function mockEventBySlug(slug: string) {
  return MOCK_EVENTS.find((e) => e.slug === slug) ?? null;
}

