import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import type { Event } from "@/types";
import { formatDateBR } from "@/lib/utils/date";
import { formatBRLFromCents } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function EventCard({
  event,
  startingPriceCents,
}: {
  event: Event;
  startingPriceCents?: number | null;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-gold/15 via-black to-black">
        {event.coverImageUrl ? (
          <Image
            src={event.coverImageUrl}
            alt={event.title}
            fill
            className="object-cover opacity-85"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          {event.featured ? <Badge variant="gold">Destaque</Badge> : null}
          <Badge variant="outline">{event.state}</Badge>
        </div>
      </div>

      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="line-clamp-2 text-lg font-extrabold tracking-tight">
              {event.title}
            </h3>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gold" />
                <span>{formatDateBR(event.startDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold" />
                <span>
                  {event.city}/{event.state}
                </span>
              </div>
            </div>
          </div>

          {typeof startingPriceCents === "number" ? (
            <div className="rounded-2xl border border-gold/20 bg-gold/10 px-4 py-3 text-right">
              <div className="text-xs text-muted-foreground">A partir de</div>
              <div className="text-sm font-extrabold text-gold">
                {formatBRLFromCents(startingPriceCents)}
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/eventos/${event.slug}`}>Ver detalhes</Link>
        </Button>
        <Button asChild variant="gold" className="w-full">
          <Link href={`/eventos/${event.slug}#ingressos`}>Comprar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

