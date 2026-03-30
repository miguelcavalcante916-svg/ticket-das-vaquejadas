"use client";

import * as React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";

type Props = {
  orderId: string;
  initialStatus?: string;
};

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

function statusVariant(status: string | undefined): BadgeVariant {
  const s = (status ?? "").toLowerCase();
  if (["paid", "approved"].includes(s)) return "success";
  if (["canceled", "rejected", "refunded"].includes(s)) return "danger";
  return "gold";
}

function statusLabel(status: string | undefined) {
  const s = (status ?? "").toLowerCase();
  if (["paid", "approved"].includes(s)) return "Pagamento aprovado";
  if (["pending", "in_process"].includes(s)) return "Aguardando pagamento";
  if (["canceled"].includes(s)) return "Pagamento cancelado";
  if (["rejected"].includes(s)) return "Pagamento rejeitado";
  return status ?? "Status";
}

export function PaymentStatus({ orderId, initialStatus }: Props) {
  const [status, setStatus] = React.useState<string | undefined>(initialStatus);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/mercado-pago/consultar-status?orderId=${encodeURIComponent(orderId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { status?: string };
        if (active) setStatus(data.status);
      } finally {
        if (active) setLoading(false);
      }
    };

    const shouldPoll = () => {
      const s = (status ?? "").toLowerCase();
      return !["paid", "approved", "canceled", "rejected"].includes(s);
    };

    tick();
    const interval = window.setInterval(() => {
      if (shouldPoll()) tick();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [orderId, status]);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
      {loading ? (
        <span className="text-xs text-muted-foreground">Atualizando…</span>
      ) : null}
    </div>
  );
}
