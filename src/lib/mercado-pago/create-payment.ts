import "server-only";

import { createPaymentClient } from "@/lib/mercado-pago/client";
import { normalizeMercadoPagoStatus } from "@/lib/mercado-pago/status";
import { qrDataUrl } from "@/lib/utils/qr";

export type CreatePixPaymentInput = {
  orderId: string;
  amountCents: number;
  payerEmail: string;
  description: string;
  notificationUrl: string;
};

export type CreatePixPaymentOutput = {
  provider: "mercado_pago";
  providerPaymentId: string;
  status: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  copyPaste: string | null;
  raw: unknown;
};

export async function createPixPayment(
  input: CreatePixPaymentInput,
): Promise<CreatePixPaymentOutput> {
  const paymentClient = createPaymentClient();

  const amount = Number((input.amountCents / 100).toFixed(2));
  const res = await paymentClient.create({
    body: {
      transaction_amount: amount,
      description: input.description,
      payment_method_id: "pix",
      payer: { email: input.payerEmail },
      external_reference: input.orderId,
      notification_url: input.notificationUrl,
    },
  });

  const qrCode = res.point_of_interaction?.transaction_data?.qr_code ?? null;
  const qrCodeBase64 =
    res.point_of_interaction?.transaction_data?.qr_code_base64 ??
    (qrCode ? await qrDataUrl(qrCode) : null);

  return {
    provider: "mercado_pago",
    providerPaymentId: String(res.id ?? ""),
    status: normalizeMercadoPagoStatus(res.status),
    qrCode,
    qrCodeBase64,
    copyPaste: qrCode,
    raw: res,
  };
}
