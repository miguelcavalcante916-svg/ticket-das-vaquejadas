import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { CalendarDays, Pencil, QrCode, Ticket, Users } from "lucide-react";

import type { Event, TicketType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateBR } from "@/lib/utils/date";
import { MOCK_EVENTS, mockTicketTypesForEvent } from "@/services/mock-data";

type DisplayEvent = {
  id: string;
  organizerId: string | null;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  city: string;
  state: string;
  venueName: string | null;
  status: string;
  featured: boolean;
};

type DisplayTicketType = {
  id: string;
  name: string;
  isActive: boolean;
};

function hasAnonEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function mapMockEvent(mock: Event): DisplayEvent {
  return {
    id: mock.id,
    organizerId: mock.organizerId ?? null,
    slug: mock.slug,
    title: mock.title,
    description: mock.description,
    startDate: mock.startDate,
    city: mock.city,
    state: mock.state,
    venueName: mock.venueName ?? null,
    status: mock.status,
    featured: Boolean(mock.featured),
  };
}

function mapMockTicketTypes(types: TicketType[]): DisplayTicketType[] {
  return types.map((t) => ({ id: t.id, name: t.name, isActive: t.isActive }));
}

export default async function AdminEventoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let event: DisplayEvent | null = null;
  let ticketTypes: DisplayTicketType[] = [];

  const hasServiceEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!hasAnonEnv() || !hasServiceEnv) {
    const mock = MOCK_EVENTS.find((e) => e.id === id) ?? null;
    event = mock ? mapMockEvent(mock) : null;
    ticketTypes = mock ? mapMockTicketTypes(mockTicketTypesForEvent(mock.id)) : [];
  } else {
    const auth = await createSupabaseServerClient();
    const {
      data: { user },
    } = await auth.auth.getUser();

    const { data: profile } = await auth
      .from("profiles")
      .select("role")
      .eq("id", user?.id ?? "")
      .maybeSingle();

    const role = (profile?.role as string | undefined) ?? "user";

    let organizerId: string | null = null;
    if (role === "organizer" && user?.id) {
      const { data: organizer } = await auth
        .from("organizers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      organizerId = organizer?.id ?? null;
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data } = await adminSupabase
      .from("events")
      .select(
        "id,organizer_id,slug,title,description,start_date,city,state,venue_name,status,featured",
      )
      .eq("id", id)
      .maybeSingle();

    if (data && role === "organizer" && organizerId && data.organizer_id !== organizerId) {
      event = null;
      ticketTypes = [];
    } else if (data) {
      event = {
        id: data.id,
        organizerId: data.organizer_id ?? null,
        slug: data.slug,
        title: data.title,
        description: data.description ?? "",
        startDate: data.start_date,
        city: data.city,
        state: data.state,
        venueName: data.venue_name ?? null,
        status: data.status ?? "draft",
        featured: Boolean(data.featured),
      };

      const { data: types } = await adminSupabase
        .from("ticket_types")
        .select("id,name,is_active,price_cents")
        .eq("event_id", id)
        .order("price_cents", { ascending: true });

      ticketTypes = (types ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        isActive: Boolean(t.is_active),
      }));
    } else {
      event = null;
      ticketTypes = [];
    }
  }

  if (!event) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold">Evento não encontrado</h1>
        <Button asChild variant="outline">
          <Link href="/admin/eventos">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {event.featured ? <Badge variant="gold">Destaque</Badge> : null}
            <Badge variant="outline">
              {event.city}/{event.state}
            </Badge>
            <Badge variant="outline">{event.status}</Badge>
          </div>
          <h1 className="mt-3 truncate text-3xl font-extrabold tracking-tight">
            {event.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <CalendarDays className="mr-2 inline h-4 w-4 text-gold" />
            {formatDateBR(event.startDate)}
            {event.venueName ? <> • {event.venueName}</> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/eventos/${id}/editar`}>
              <Pencil className="h-4 w-4" /> Editar
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/eventos/${id}/lotes`}>
              <Ticket className="h-4 w-4" /> Lotes
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/eventos/${id}/vendas`}>
              <Users className="h-4 w-4" /> Vendas
            </Link>
          </Button>
          <Button asChild variant="gold" size="sm">
            <Link href={`/admin/eventos/${id}/checkin`}>
              <QrCode className="h-4 w-4" /> Check-in
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <h2 className="text-lg font-extrabold">Ingressos/lotes</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {ticketTypes.length} tipo(s) cadastrado(s).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ticketTypes.slice(0, 6).map((t) => (
              <Badge key={t.id} variant={t.isActive ? "gold" : "outline"}>
                {t.name}
              </Badge>
            ))}
          </div>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href={`/admin/eventos/${id}/lotes`}>Gerenciar lotes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

