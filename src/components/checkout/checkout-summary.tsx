import type { Order } from "@/types";
import { formatBRLFromCents } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function CheckoutSummary({ order }: { order: Order }) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Resumo do pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatBRLFromCents(item.unitPriceCents)}
                </p>
              </div>
              <p className="text-sm font-extrabold">
                {formatBRLFromCents(item.totalCents)}
              </p>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Total</p>
          <p className="text-lg font-extrabold text-gold">
            {formatBRLFromCents(order.totalCents)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

