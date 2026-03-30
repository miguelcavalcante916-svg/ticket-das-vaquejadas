"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

import { EventForm, type EventFormValues } from "@/components/admin/event-form";
import { LoadingSpinner } from "@/components/loading-spinner";

type ApiEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_date: string;
  city: string;
  state: string;
  venue_name?: string | null;
  address?: string | null;
  cover_image_url?: string | null;
  status?: string;
  featured?: boolean;
};

export default function AdminEditarEventoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = React.useState(true);
  const [defaultValues, setDefaultValues] = React.useState<
    Partial<EventFormValues> | undefined
  >(undefined);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/eventos/${id}`, { cache: "no-store" });
        const data = (await res.json()) as { event: ApiEvent | null };
        if (!active) return;
        if (!data.event) return;
        setDefaultValues({
          title: data.event.title,
          slug: data.event.slug,
          description: data.event.description,
          startDate: String(data.event.start_date).slice(0, 10),
          city: data.event.city,
          state: data.event.state as EventFormValues["state"],
          venueName: data.event.venue_name ?? "",
          address: data.event.address ?? "",
          coverImageUrl: data.event.cover_image_url ?? "",
          status: (data.event.status as EventFormValues["status"]) ?? "draft",
        });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const submit = async (values: EventFormValues) => {
    const res = await fetch(`/api/eventos/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = (await res.json()) as { event?: { id: string }; message?: string };
    if (!res.ok) {
      throw new Error(data.message ?? "Falha ao salvar.");
    }
    router.push(`/admin/eventos/${id}`);
    router.refresh();
  };

  if (loading && !defaultValues) {
    return (
      <div className="py-10">
        <LoadingSpinner label="Carregando evento…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Editar evento</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Atualize informações e mantenha o slug consistente.
        </p>
      </div>

      <EventForm
        defaultValues={defaultValues}
        onSubmit={submit}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}
