import { BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SalesChart({
  title = "Vendas (últimos 7 dias)",
  data = [18, 22, 14, 28, 31, 26, 40],
}: {
  title?: string;
  data?: number[];
}) {
  const max = Math.max(...data, 1);

  return (
    <Card className="border-border/60">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gold" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          {data.map((value, idx) => (
            <div key={idx} className="flex flex-1 flex-col items-center gap-2">
              <div className="h-32 w-full rounded-xl bg-muted/30">
                <div
                  className="h-full w-full origin-bottom rounded-xl bg-gradient-to-t from-gold/40 to-gold"
                  style={{ transform: `scaleY(${value / max})` }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground">D{idx + 1}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

