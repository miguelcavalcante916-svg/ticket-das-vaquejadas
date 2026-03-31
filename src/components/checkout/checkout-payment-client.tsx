"use client";

import * as React from "react";

import type { PixPaymentInfo } from "@/types";
import { LoadingSpinner } from "@/components/loading-spinner";
import { PixBox } from "@/components/checkout/pix-box";
import { Button } from "@/components/ui/button";

type ApiPayment = {
  providerPaymentId?: string | null;
  status?: string;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  copyPaste?: string | null;
};

type CreatePaymentResponse = {
  payment?: ApiPayment;
  payment_id?: string | null;
  status?: string;
  qr_code?: string | null;
  qr_code_base64?: string | null;
  message?: string;
};

export function CheckoutPaymentClient({
  orderId,
  initialPayment,
}: {
  orderId: string;
  initialPayment?: PixPaymentInfo | null;
}) {
  const [payment, setPayment] = React.useState<PixPaymentInfo | null>(
    initialPayment ?? null,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const ensurePayment = React.useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch("/api/mercado-pago/criar-pagamento", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await res.json()) as CreatePaymentResponse;
      const paymentData = data.payment
        ? data.payment
        : data.payment_id || data.qr_code || data.qr_code_base64
          ? {
              providerPaymentId: data.payment_id ?? null,
              status: data.status ?? "pending",
              qrCode: data.qr_code ?? null,
              qrCodeBase64: data.qr_code_base64 ?? null,
              copyPaste: data.qr_code ?? null,
            }
          : null;

      if (!res.ok || !paymentData) {
        setError(data.message ?? "Falha ao gerar Pix.");
        return;
      }

      setPayment({
        provider: "mercado_pago",
        providerPaymentId: paymentData.providerPaymentId ?? null,
        status: paymentData.status ?? "pending",
        qrCode: paymentData.qrCode ?? null,
        qrCodeBase64: paymentData.qrCodeBase64 ?? null,
        copyPaste: paymentData.copyPaste ?? paymentData.qrCode ?? null,
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    const hasPix =
      payment?.copyPaste || payment?.qrCode || payment?.qrCodeBase64;
    if (!hasPix) ensurePayment();
  }, [ensurePayment, payment]);

  if (loading && !payment) {
    return <LoadingSpinner label="Gerando Pix…" />;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-red-400">{error}</p>
        <Button type="button" variant="gold" onClick={ensurePayment} disabled={loading}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!payment) {
    return (
      <Button type="button" variant="gold" onClick={ensurePayment} disabled={loading}>
        Gerar Pix
      </Button>
    );
  }

  return <PixBox payment={payment} />;
}
