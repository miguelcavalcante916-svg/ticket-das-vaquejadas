"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-8 shadow-glow">
      <h1 className="text-2xl font-extrabold">Falha ao carregar o painel</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        {error.message || "Ocorreu um erro inesperado. Tente novamente em instantes."}
      </p>
      <div className="mt-6">
        <Button type="button" variant="gold" onClick={reset}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
