import { NextResponse, type NextRequest } from "next/server";

import { apiError } from "@/lib/api/http";
import { hasServiceSupabaseEnv } from "@/lib/env/server";
import { getApiUserRole, isOrganizerOrAdmin } from "@/lib/supabase/api-auth";
import { canAccessGuestOrder, canAccessOrder } from "@/lib/supabase/access";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getOrderById } from "@/services/orders";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (hasServiceSupabaseEnv()) {
    const supabase = createSupabaseServiceRoleClient();
    const auth = await getApiUserRole(request);

    if (auth) {
      const access = await canAccessOrder(
        supabase,
        isOrganizerOrAdmin(auth.role) ? (auth.role as "organizer" | "admin") : "user",
        auth.userId,
        id,
      );
      if (!access.allowed) {
        return apiError(403, "Sem acesso a este pedido.");
      }
    } else {
      const access = await canAccessGuestOrder(supabase, id);
      if (!access.allowed) {
        return apiError(403, "Este pedido exige autenticacao.");
      }
    }
  }

  const order = await getOrderById(id);
  if (!order) {
    return apiError(404, "Pedido nao encontrado.");
  }

  return NextResponse.json({ order });
}
