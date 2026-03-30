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
      const data = (await res.json()) as {
        payment?: ApiPayment;
        message?: string;
      };
      if (!res.ok || !data.payment) {
        setError(data.message ?? "Falha ao gerar Pix.");
        return;
      }
      setPayment({
        provider: "mercado_pago",
        providerPaymentId: data.payment.providerPaymentId ?? null,
        status: data.payment.status ?? "pending",
        qrCode: data.payment.qrCode ?? null,
        qrCodeBase64: data.payment.qrCodeBase64 ?? null,
        copyPaste: data.payment.copyPaste ?? null,
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
