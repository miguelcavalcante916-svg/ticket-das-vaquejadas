"use client";

import * as React from "react";
import Image from "next/image";
import { Copy } from "lucide-react";

import type { PixPaymentInfo } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function normalizeBase64(base64: string) {
  if (base64.startsWith("data:image")) return base64;
  return `data:image/png;base64,${base64}`;
}

export function PixBox({ payment }: { payment: PixPaymentInfo }) {
  const copyPaste = payment.copyPaste ?? "";
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    if (!copyPaste) return;
    await navigator.clipboard.writeText(copyPaste);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Pagamento Pix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-gold/20 bg-gold/10 p-4 text-sm text-muted-foreground">
          Abra o app do seu banco, escaneie o QR Code ou use o código{" "}
          <span className="text-gold">copia e cola</span>.
        </div>

        {payment.qrCodeBase64 ? (
          <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-black/30 p-6">
            <Image
              src={normalizeBase64(payment.qrCodeBase64)}
              alt="QR Code Pix"
              width={320}
              height={320}
              className="h-64 w-64 object-contain"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm font-semibold">Pix copia e cola</p>
          <div className="flex gap-2">
            <Input readOnly value={copyPaste} className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={copy}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {copied ? (
            <p className="text-xs font-semibold text-emerald-400">
              Código copiado.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

