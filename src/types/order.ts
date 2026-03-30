export type OrderStatus = "pending" | "paid" | "canceled";

export interface OrderItem {
  id: string;
  ticketTypeId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface PixPaymentInfo {
  provider: "mercado_pago";
  providerPaymentId?: string | null;
  status: string;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  copyPaste?: string | null;
}

export interface Order {
  id: string;
  userId?: string | null;
  eventId: string;
  status: OrderStatus;
  totalCents: number;
  currency: "BRL";
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerDocument?: string | null;
  createdAt: string;
  items: OrderItem[];
  payment?: PixPaymentInfo | null;
}

