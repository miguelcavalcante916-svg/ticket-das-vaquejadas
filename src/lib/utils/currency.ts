export function formatBRLFromCents(valueCents: number) {
  const value = (valueCents ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

