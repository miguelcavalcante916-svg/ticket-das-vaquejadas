import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";

import type { Event } from "@/types";
import { formatDateBR } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";

export function EventBanner({ event }: { event: Event }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-glow">
      <div className="absolute inset-0">
        {event.coverImageUrl ? (
          <Image
            src={event.coverImageUrl}
            alt={event.title}
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,155,60,0.25),transparent_50%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-black/0" />
      </div>

      <div className="relative p-8 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          {event.featured ? <Badge variant="gold">Destaque</Badge> : null}
          <Badge variant="outline">
            {event.city}/{event.state}
          </Badge>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {event.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {event.description}
        </p>

        <div className="mt-6 flex flex-col gap-3 text-sm text-foreground/90 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold" />
            <span>{formatDateBR(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gold" />
            <span>
              {event.city}/{event.state}
              {event.venueName ? ` • ${event.venueName}` : ""}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

