import { notFound } from "next/navigation";

import { EventBanner } from "@/components/events/event-banner";
import { TicketCheckoutClient } from "@/components/tickets/ticket-checkout-client";
import { Card, CardContent } from "@/components/ui/card";
import { getEventBySlug } from "@/services/events";

export default async function EventoDetalhePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { event, ticketTypes } = await getEventBySlug(slug);
  if (!event) notFound();

  return (
    <div className="container py-10">
      <EventBanner event={event} />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <h2 className="text-lg font-extrabold">Sobre o evento</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {event.description}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="pt-6">
              <h2 className="text-lg font-extrabold">Regras (exemplo)</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Entrada sujeita à apresentação de documento.</li>
                <li>Proibida a entrada com itens cortantes.</li>
                <li>Check-in via QR Code evita uso duplicado.</li>
                <li>Política de reembolso conforme organizador.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="pt-6">
              <h2 className="text-lg font-extrabold">Mapa/Local (exemplo)</h2>
              <div className="mt-3 rounded-2xl border border-border/60 bg-black/30 p-6 text-sm text-muted-foreground">
                Integre aqui um mapa (Google Maps) usando endereço ou latitude/longitude.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <TicketCheckoutClient eventId={event.id} ticketTypes={ticketTypes} />
        </div>
      </div>
    </div>
  );
}

