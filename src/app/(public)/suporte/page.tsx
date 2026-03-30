import Link from "next/link";
import { LifeBuoy, Mail, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Suporte",
};

export default function SuportePage() {
  return (
    <div className="container py-10">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-gold/20 bg-gold/10 p-2">
          <LifeBuoy className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Suporte</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Precisa de ajuda com pagamento, ingresso ou check-in? Fale com a gente.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-sm font-extrabold">Atendimento</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Canal oficial de suporte para dúvidas, reenvio de ingressos e status de
              pagamento.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="gold">
                <a href="mailto:suporte@ticketdasvaquejadas.com">
                  <Mail className="h-4 w-4" /> E-mail
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="https://wa.me/5585999999999" target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <p className="text-sm font-extrabold">Organizadores</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Para anunciar eventos, criar lotes e integrar pagamentos Pix, acesse o
              painel do organizador.
            </p>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link href="/admin">Ir para o painel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

