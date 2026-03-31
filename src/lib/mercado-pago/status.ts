import "server-only";

export function normalizeMercadoPagoStatus(status?: string | null) {
  const normalized = String(status ?? "").toLowerCase();

  if (normalized === "approved") return "paid";
  if (["pending", "in_process", "in_mediation"].includes(normalized)) return "pending";
  if (["rejected", "cancelled", "canceled", "refunded", "charged_back"].includes(normalized)) {
    return "canceled";
  }

  return normalized || "pending";
}

