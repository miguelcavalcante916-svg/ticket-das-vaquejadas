import { createClient } from "@supabase/supabase-js";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRLFromCents } from "@/lib/utils/currency";
import { formatDateTimeBR } from "@/lib/utils/date";

function hasServiceEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export default async function AdminPedidosPage() {
  type OrderRow = {
    id: string;
    status: string;
    total_cents: number;
    buyer_name?: string | null;
    buyer_email?: string | null;
    created_at: string;
  };

  let rows: OrderRow[] = [];

  if (hasServiceEnv()) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data } = await supabase
      .from("orders")
      .select("id,status,total_cents,currency,buyer_name,buyer_email,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    rows = data ?? [];
  } else {
    rows = [
      {
        id: "ORDER-DEMO-1",
        status: "paid",
        total_cents: 12000,
        buyer_name: "Maria Oliveira",
        buyer_email: "maria@email.com",
        created_at: new Date().toISOString(),
      },
      {
        id: "ORDER-DEMO-2",
        status: "pending",
        total_cents: 5000,
        buyer_name: "João Silva",
        buyer_email: "joao@email.com",
        created_at: new Date().toISOString(),
      },
    ];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Pedidos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe pagamentos e pedidos gerados no checkout.
        </p>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="py-3 pr-4">Pedido</th>
                  <th className="py-3 pr-4">Comprador</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/40">
                    <td className="py-4 pr-4 font-mono text-xs text-muted-foreground">
                      {r.id}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="font-bold">{r.buyer_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.buyer_email ?? "—"}
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-extrabold text-gold">
                      {formatBRLFromCents(r.total_cents ?? 0)}
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant={r.status === "paid" ? "success" : "gold"}>
                        {r.status === "paid" ? "Pago" : "Pendente"}
                      </Badge>
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {formatDateTimeBR(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
