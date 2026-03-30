"use client";

import * as React from "react";
import { ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ResultStatus = "idle" | "valid" | "used" | "invalid" | "error";
type Result = { status: ResultStatus; message?: string };

export function CheckinScanner({ eventId }: { eventId: string }) {
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<Result>({ status: "idle" });

  const validate = async () => {
    if (!code.trim()) return;
    try {
      setLoading(true);
      setResult({ status: "idle" });
      const res = await fetch("/api/tickets/validar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: code.trim(), eventId }),
      });
      const data = (await res.json()) as { status: string; message: string };
      if (!res.ok) {
        setResult({ status: "error", message: data.message ?? "Erro ao validar" });
        return;
      }
      if (data.status === "valid") setResult({ status: "valid", message: data.message });
      else if (data.status === "used") setResult({ status: "used", message: data.message });
      else setResult({ status: "invalid", message: data.message });
    } catch {
      setResult({ status: "error", message: "Falha de rede" });
    } finally {
      setLoading(false);
    }
  };

  const badge =
    result.status === "valid"
      ? { variant: "success" as const, label: "Válido" }
      : result.status === "used"
        ? { variant: "danger" as const, label: "Já usado" }
        : result.status === "invalid"
          ? { variant: "danger" as const, label: "Inválido" }
          : result.status === "error"
            ? { variant: "danger" as const, label: "Erro" }
            : null;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-gold" />
          Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Digite/cole o código do ingresso"
            className="font-mono"
          />
          <Button variant="gold" size="lg" onClick={validate} disabled={loading}>
            {loading ? "Validando…" : "Validar"}
          </Button>
        </div>

        {badge ? (
          <div className="flex items-center gap-3">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <p className="text-sm text-muted-foreground">{result.message}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
