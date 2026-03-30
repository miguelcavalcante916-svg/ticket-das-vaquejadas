import { MercadoPagoConfig, Payment } from "mercadopago";

export function createMercadoPagoConfig() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Env ausente: MERCADO_PAGO_ACCESS_TOKEN");
  }
  return new MercadoPagoConfig({ accessToken });
}

export function createPaymentClient() {
  return new Payment(createMercadoPagoConfig());
}

