import { Card, CardContent } from "@/components/ui/card";

export default function AdminConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Configurações</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajustes do organizador, integração de pagamentos e preferências.
        </p>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Defina chave Mercado Pago</p>
            <p>• Configure URL de webhook</p>
            <p>• Ajuste políticas e termos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

