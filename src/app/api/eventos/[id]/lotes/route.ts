import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

import { apiError, apiValidationError } from "@/lib/api/http";
import { hasPublicSupabaseEnv, requirePublicSupabaseEnv } from "@/lib/env/public";
import { hasServiceSupabaseEnv } from "@/lib/env/server";
import { getApiUserRole, isOrganizerOrAdmin } from "@/lib/supabase/api-auth";
import { canManageEvent } from "@/lib/supabase/access";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { mockTicketTypesForEvent } from "@/services/mock-data";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional().nullable(),
  priceCents: z.coerce.number().int().min(0),
  quantityTotal: z.coerce.number().int().min(1),
  isActive: z.boolean().default(true),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!hasPublicSupabaseEnv()) {
    return NextResponse.json({ ticketTypes: mockTicketTypesForEvent(id) });
  }

  const auth = await getApiUserRole(request);
  const canAdminRead = Boolean(auth && isOrganizerOrAdmin(auth.role) && hasServiceSupabaseEnv());
  const publicEnv = requirePublicSupabaseEnv();
  const supabase = canAdminRead
    ? createSupabaseServiceRoleClient()
    : createClient(publicEnv.url, publicEnv.anonKey);

  if (
    auth?.role === "organizer" &&
    canAdminRead &&
    !(await canManageEvent(supabase, "organizer", auth.userId, id))
  ) {
    return apiError(403, "Sem acesso a este evento.", { ticketTypes: [] });
  }

  let query = supabase
    .from("ticket_types")
    .select("id,event_id,name,description,price_cents,quantity_total,quantity_sold,is_active")
    .eq("event_id", id)
    .order("price_cents", { ascending: true });

  if (!canAdminRead) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return apiError(500, error.message);
  return NextResponse.json({ ticketTypes: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!hasServiceSupabaseEnv()) {
    return apiError(
      500,
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para criar lotes.",
    );
  }

  const auth = await getApiUserRole(request);
  if (!auth || !isOrganizerOrAdmin(auth.role)) {
    return apiError(401, "Nao autorizado.");
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (
    auth.role === "organizer" &&
    !(await canManageEvent(supabase, "organizer", auth.userId, id))
  ) {
    return apiError(403, "Sem acesso a este evento.");
  }

  const values = parsed.data;
  const { data, error } = await supabase
    .from("ticket_types")
    .insert({
      event_id: id,
      name: values.name,
      description: values.description ?? null,
      price_cents: values.priceCents,
      quantity_total: values.quantityTotal,
      is_active: values.isActive,
    })
    .select("id")
    .single();

  if (error) return apiError(500, error.message);
  return NextResponse.json({ ticketType: data }, { status: 201 });
}
