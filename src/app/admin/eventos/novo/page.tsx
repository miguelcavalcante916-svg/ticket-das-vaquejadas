"use client";

import { useRouter } from "next/navigation";

import { EventForm, type EventFormValues } from "@/components/admin/event-form";

export default function AdminNovoEventoPage() {
  const router = useRouter();

  const submit = async (values: EventFormValues) => {
    const res = await fetch("/api/eventos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = (await res.json()) as { event?: { id: string }; message?: string };
    if (!res.ok || !data.event?.id) {
      throw new Error(data.message ?? "Falha ao criar evento.");
    }

    router.push(`/admin/eventos/${data.event.id}`);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Novo evento</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre o evento e depois configure os lotes de ingressos.
        </p>
      </div>

      <EventForm onSubmit={submit} submitLabel="Criar evento" />
    </div>
  );
}

