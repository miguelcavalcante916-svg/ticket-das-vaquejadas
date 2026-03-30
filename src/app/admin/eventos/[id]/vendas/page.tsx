import { BuyersTable } from "@/components/admin/buyers-table";

export default async function AdminVendasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Vendas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Evento: <span className="font-mono">{id}</span>
        </p>
      </div>

      <BuyersTable
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
        ]}
      />
    </div>
  );
}

