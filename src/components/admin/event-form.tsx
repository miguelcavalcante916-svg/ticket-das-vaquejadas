"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Uf } from "@/types";
import { slugify } from "@/lib/utils/slug";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const satisfies readonly Uf[];

const STATUSES = ["draft", "published", "ended"] as const;

const schema = z.object({
  title: z.string().min(3, "Informe o nome do evento"),
  slug: z
    .string()
    .min(3, "Informe um slug")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras, números e hífen"),
  description: z.string().min(10, "Descreva melhor o evento"),
  startDate: z.string().min(10, "Informe a data"),
  city: z.string().min(2, "Informe a cidade"),
  state: z.enum(UFS),
  venueName: z.string().optional(),
  address: z.string().optional(),
  coverImageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  status: z.enum(STATUSES),
});

export type EventFormValues = z.infer<typeof schema>;

export function EventForm({
  defaultValues,
  onSubmit,
  submitLabel = "Salvar evento",
}: {
  defaultValues?: Partial<EventFormValues>;
  onSubmit: (values: EventFormValues) => Promise<void> | void;
  submitLabel?: string;
}) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      slug: defaultValues?.slug ?? "minha-vaquejada",
      description: defaultValues?.description ?? "",
      startDate: defaultValues?.startDate ?? new Date().toISOString().slice(0, 10),
      city: defaultValues?.city ?? "",
      state: defaultValues?.state ?? "CE",
      venueName: defaultValues?.venueName ?? "",
      address: defaultValues?.address ?? "",
      coverImageUrl: defaultValues?.coverImageUrl ?? "",
      status: defaultValues?.status ?? "draft",
    },
    mode: "onBlur",
  });

  const title = form.watch("title");
  const slug = form.watch("slug");

  React.useEffect(() => {
    if (!title) return;
    if (defaultValues?.slug) return;
    if (slug && slug !== "minha-vaquejada") return;
    form.setValue("slug", slugify(title));
  }, [defaultValues?.slug, form, slug, title]);

  const submit = form.handleSubmit(async (values) => onSubmit(values));

  const error = (name: keyof EventFormValues) =>
    form.formState.errors[name]?.message as string | undefined;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Dados do evento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input {...form.register("title")} placeholder="Ex.: Vaquejada do Parque X" />
            {error("title") ? (
              <p className="text-xs font-semibold text-red-400">{error("title")}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Slug</Label>
            <Input {...form.register("slug")} placeholder="vaquejada-do-parque-x" />
            {error("slug") ? (
              <p className="text-xs font-semibold text-red-400">{error("slug")}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Usado na URL: <span className="font-mono">/eventos/{slug || "…"}</span>
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea
              {...form.register("description")}
              placeholder="Fale sobre atrações, premiações, regras, local…"
            />
            {error("description") ? (
              <p className="text-xs font-semibold text-red-400">
                {error("description")}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input type="date" {...form.register("startDate")} />
              {error("startDate") ? (
                <p className="text-xs font-semibold text-red-400">
                  {error("startDate")}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label>Cidade</Label>
              <Input {...form.register("city")} placeholder="Ex.: Fortaleza" />
              {error("city") ? (
                <p className="text-xs font-semibold text-red-400">{error("city")}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label>UF</Label>
              <Select
                value={form.watch("state")}
                onValueChange={(v) => form.setValue("state", v as EventFormValues["state"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {UFS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error("state") ? (
                <p className="text-xs font-semibold text-red-400">{error("state")}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Local</Label>
              <Input {...form.register("venueName")} placeholder="Ex.: Parque de Vaquejada" />
            </div>
            <div className="grid gap-2">
              <Label>Endereço</Label>
              <Input {...form.register("address")} placeholder="Rua / bairro / referência" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Imagem de capa (URL)</Label>
              <Input {...form.register("coverImageUrl")} placeholder="https://…" />
              {error("coverImageUrl") ? (
                <p className="text-xs font-semibold text-red-400">
                  {error("coverImageUrl")}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) =>
                  form.setValue("status", v as EventFormValues["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="ended">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <Button type="submit" variant="gold" size="lg" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Salvando…" : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
