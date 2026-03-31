import Link from "next/link";
import { ArrowRight, BadgeCheck, Sparkles, Ticket } from "lucide-react";

import { EventsExplorer } from "@/components/events/events-explorer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listPublicEvents } from "@/services/events";

export default async function HomePage() {
  const { events, error } = await listPublicEvents();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,155,60,0.28),transparent_55%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-background to-background" />
        <div className="container relative py-16 sm:py-20">
          <Badge variant="gold">Premium • Pix • QR Code</Badge>
          <h1 className="mt-5 font-display text-5xl tracking-wide text-foreground sm:text-6xl">
            Sua próxima <span className="text-gold">vaquejada</span> começa aqui
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Descubra eventos, compre ingressos antecipados e faça check-in com
            segurança. Um sistema profissional, rápido e elegante — do anúncio ao
            QR Code.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="gold" size="xl">
              <Link href="/eventos">
                Ver eventos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/admin">Sou organizador</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Card className="border-border/60 bg-black/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-gold/20 bg-gold/10 p-2">
                    <Ticket className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold">Ingressos por lote</p>
                    <p className="text-xs text-muted-foreground">
                      Oferta limitada com preço progressivo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-black/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-gold/20 bg-gold/10 p-2">
                    <Sparkles className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold">Checkout Pix</p>
                    <p className="text-xs text-muted-foreground">
                      QR Code + copia e cola com status ao vivo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-black/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-gold/20 bg-gold/10 p-2">
                    <BadgeCheck className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold">Check-in seguro</p>
                    <p className="text-xs text-muted-foreground">
                      Validação impede uso duplicado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Encontre sua próxima vaquejada
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Busque por nome, filtre por estado e cidade, e compre em poucos
              passos.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <EventsExplorer events={events} errorMessage={error} />
        </div>
      </section>

      <section className="container pb-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60 bg-black/25">
            <CardContent className="pt-6">
              <p className="text-sm font-extrabold text-gold">Como funciona</p>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>
                  <span className="font-semibold text-foreground">1.</span>{" "}
                  Escolha o evento e selecione o lote.
                </li>
                <li>
                  <span className="font-semibold text-foreground">2.</span> Pague
                  via Pix com QR Code.
                </li>
                <li>
                  <span className="font-semibold text-foreground">3.</span> Receba
                  seu ingresso com código e check-in rápido.
                </li>
              </ol>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-black/25">
            <CardContent className="pt-6">
              <p className="text-sm font-extrabold text-gold">Para organizadores</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Anuncie eventos, gerencie lotes e acompanhe vendas com métricas e
                relatórios. Uma base pronta para escalar no Netlify com Supabase.
              </p>
              <div className="mt-6">
                <Button asChild variant="gold">
                  <Link href="/admin">Acessar painel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
