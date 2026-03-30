import { Card, CardContent } from "@/components/ui/card";

export default function AdminClientesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Clientes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Base de compradores (exemplo). Integre filtros e exportação conforme sua
          necessidade.
        </p>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              • Maria Oliveira — <span className="text-foreground">maria@email.com</span>
            </p>
            <p>
              • João Silva — <span className="text-foreground">joao@email.com</span>
            </p>
            <p>
              • Ana Souza — <span className="text-foreground">ana@email.com</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

