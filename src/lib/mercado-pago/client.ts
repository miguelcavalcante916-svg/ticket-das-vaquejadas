import "server-only";

import { MercadoPagoConfig, Payment } from "mercadopago";

import { requireMercadoPagoAccessToken } from "@/lib/env/server";

export function createMercadoPagoConfig() {
  const accessToken = requireMercadoPagoAccessToken();
  return new MercadoPagoConfig({ accessToken });
}

export function createPaymentClient() {
  return new Payment(createMercadoPagoConfig());
}
