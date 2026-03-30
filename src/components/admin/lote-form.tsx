"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  description: z.string().optional(),
  priceBRL: z.string().min(1, "Preço obrigatório"),
  quantityTotal: z.number().int().min(1, "Quantidade mínima 1"),
  isActive: z.boolean(),
});

export type LoteFormValues = z.infer<typeof schema>;

export function LoteForm({
  defaultValues,
  onSubmit,
  submitLabel = "Salvar lote",
}: {
  defaultValues?: Partial<LoteFormValues>;
  onSubmit: (values: LoteFormValues) => Promise<void> | void;
  submitLabel?: string;
}) {
  const form = useForm<LoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      priceBRL: defaultValues?.priceBRL ?? "50,00",
      quantityTotal: defaultValues?.quantityTotal ?? 100,
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const submit = form.handleSubmit(async (values) => onSubmit(values));
  const error = (name: keyof LoteFormValues) =>
    form.formState.errors[name]?.message as string | undefined;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Lote / Tipo de ingresso</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input {...form.register("name")} placeholder="Ex.: Arquibancada • 1º lote" />
            {error("name") ? (
              <p className="text-xs font-semibold text-red-400">{error("name")}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea
              {...form.register("description")}
              placeholder="Benefícios, regras, lotação, área…"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Preço (R$)</Label>
              <Input {...form.register("priceBRL")} placeholder="Ex.: 50,00" />
              {error("priceBRL") ? (
                <p className="text-xs font-semibold text-red-400">{error("priceBRL")}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                {...form.register("quantityTotal", { valueAsNumber: true })}
              />
              {error("quantityTotal") ? (
                <p className="text-xs font-semibold text-red-400">
                  {error("quantityTotal")}
                </p>
              ) : null}
            </div>
          </div>

          <label className="flex items-center gap-3">
            <Checkbox
              checked={form.watch("isActive")}
              onCheckedChange={(v) => form.setValue("isActive", Boolean(v))}
            />
            <span className="text-sm font-semibold">Ativo para venda</span>
          </label>

          <div className="flex justify-end">
            <Button type="submit" variant="gold" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Salvando…" : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
