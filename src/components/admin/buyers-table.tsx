import { formatBRLFromCents } from "@/lib/utils/currency";
import { formatDateTimeBR } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type BuyerRow = {
  id: string;
  name: string;
  email: string;
  totalCents: number;
  status: string;
  createdAt: string;
};

export function BuyersTable({
  title = "Compradores",
  rows,
}: {
  title?: string;
  rows: BuyerRow[];
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="py-3 pr-4">Comprador</th>
                <th className="py-3 pr-4">Total</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/40">
                  <td className="py-4 pr-4">
                    <div className="font-bold">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                  </td>
                  <td className="py-4 pr-4 font-extrabold text-gold">
                    {formatBRLFromCents(row.totalCents)}
                  </td>
                  <td className="py-4 pr-4">
                    <Badge variant={row.status === "paid" ? "success" : "gold"}>
                      {row.status === "paid" ? "Pago" : "Pendente"}
                    </Badge>
                  </td>
                  <td className="py-4 text-muted-foreground">
                    {formatDateTimeBR(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

