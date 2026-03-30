import { CheckinScanner } from "@/components/admin/checkin-scanner";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminCheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Check-in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Valide ingressos por código e evite dupla entrada.
        </p>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Dica: use um leitor de QR Code para colar automaticamente o código no campo.
        </CardContent>
      </Card>

      <CheckinScanner eventId={id} />
    </div>
  );
}

