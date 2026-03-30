import { EventsExplorer } from "@/components/events/events-explorer";
import { listPublicEvents } from "@/services/events";

export const metadata = {
  title: "Eventos",
};

export default async function EventosPage() {
  const events = await listPublicEvents();

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Vaquejadas</h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        Encontre eventos, filtre por estado/cidade e compre ingressos com Pix.
      </p>
      <div className="mt-8">
        <EventsExplorer events={events} />
      </div>
    </div>
  );
}

