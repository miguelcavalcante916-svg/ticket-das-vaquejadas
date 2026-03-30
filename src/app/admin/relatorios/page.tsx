import { SalesChart } from "@/components/admin/sales-chart";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminRelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Relatórios</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visão consolidada de vendas e desempenho.
        </p>
      </div>

      <SalesChart />

      <Card className="border-border/60">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Sugestão: adicione exportação CSV, filtros por período e relatório por evento.
        </CardContent>
      </Card>
    </div>
  );
}

