import Link from "next/link";
import { CalendarDays, QrCode, ShoppingCart, Wallet } from "lucide-react";

import { BuyersTable } from "@/components/admin/buyers-table";
import { SalesChart } from "@/components/admin/sales-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-gold">
              {value}
            </p>
            {helper ? (
              <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-gold/20 bg-gold/10 p-3">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Métricas, próximos eventos e vendas recentes.
          </p>
        </div>
        <Button asChild variant="gold">
          <Link href="/admin/eventos/novo">Novo evento</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Wallet className="h-5 w-5 text-gold" />}
          label="Total vendido"
          value="R$ 125.400"
          helper="Últimos 30 dias (exemplo)"
        />
        <MetricCard
          icon={<ShoppingCart className="h-5 w-5 text-gold" />}
          label="Pedidos"
          value="1.284"
          helper="Pagos + pendentes (exemplo)"
        />
        <MetricCard
          icon={<QrCode className="h-5 w-5 text-gold" />}
          label="Ingressos validados"
          value="392"
          helper="Check-in (exemplo)"
        />
        <MetricCard
          icon={<CalendarDays className="h-5 w-5 text-gold" />}
          label="Próximos eventos"
          value="3"
          helper="Na agenda (exemplo)"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SalesChart />
        <BuyersTable
          title="Vendas recentes"
          rows={[
            {
              id: "1",
              name: "Maria Oliveira",
              email: "maria@email.com",
              totalCents: 12000,
              status: "paid",
              createdAt: new Date().toISOString(),
            },
            {
              id: "2",
              name: "João Silva",
              email: "joao@email.com",
              totalCents: 5000,
              status: "pending",
              createdAt: new Date().toISOString(),
            },
            {
              id: "3",
              name: "Ana Souza",
              email: "ana@email.com",
              totalCents: 20000,
              status: "paid",
              createdAt: new Date().toISOString(),
            },
          ]}
        />
      </div>
    </div>
  );
}

