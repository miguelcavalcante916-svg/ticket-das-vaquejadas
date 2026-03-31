import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

import { apiError, apiValidationError } from "@/lib/api/http";
import { hasPublicSupabaseEnv, requirePublicSupabaseEnv } from "@/lib/env/public";
import { hasServiceSupabaseEnv } from "@/lib/env/server";
import { getApiUserRole, isOrganizerOrAdmin } from "@/lib/supabase/api-auth";
import { canManageEvent } from "@/lib/supabase/access";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
    message: "Use uma URL http(s) valida.",
  });

const updateSchema = z.object({
  title: z.string().trim().min(3).optional(),
  slug: z.string().trim().min(3).optional(),
  description: z.string().trim().min(10).optional(),
  startDate: z.string().trim().min(4).optional(),
  endDate: z.string().optional().nullable(),
  city: z.string().trim().min(2).optional(),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  venueName: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  coverImageUrl: z.union([httpUrlSchema, z.literal("")]).optional().nullable(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "published", "ended"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!hasPublicSupabaseEnv()) {
    return NextResponse.json({ event: null, ticketTypes: [] });
  }

  const auth = await getApiUserRole(request);
  const canAdminRead = Boolean(auth && isOrganizerOrAdmin(auth.role) && hasServiceSupabaseEnv());
  const publicEnv = requirePublicSupabaseEnv();

  const supabase = canAdminRead
    ? createSupabaseServiceRoleClient()
    : createClient(publicEnv.url, publicEnv.anonKey);

  let eventQuery = supabase
    .from("events")
    .select(
      "id,organizer_id,slug,title,description,start_date,end_date,city,state,venue_name,address,cover_image_url,status,featured",
    )
    .eq("id", id);

  if (!canAdminRead) eventQuery = eventQuery.eq("status", "published");

  const { data: event, error } = await eventQuery.maybeSingle();
  if (error || !event) {
    return NextResponse.json({ event: null, ticketTypes: [] });
  }

  if (
    auth?.role === "organizer" &&
    canAdminRead &&
    !(await canManageEvent(supabase, "organizer", auth.userId, id))
  ) {
    return apiError(403, "Sem acesso a este evento.", {
      event: null,
      ticketTypes: [],
    });
  }

  let ticketTypesQuery = supabase
    .from("ticket_types")
    .select("id,event_id,name,description,price_cents,quantity_total,quantity_sold,is_active")
    .eq("event_id", id)
    .order("price_cents", { ascending: true });

  if (!canAdminRead) ticketTypesQuery = ticketTypesQuery.eq("is_active", true);

  const { data: ticketTypes } = await ticketTypesQuery;
  return NextResponse.json({ event, ticketTypes: ticketTypes ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!hasServiceSupabaseEnv()) {
    return apiError(
      500,
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para editar eventos.",
    );
  }

  const auth = await getApiUserRole(request);
  if (!auth || !isOrganizerOrAdmin(auth.role)) {
    return apiError(401, "Nao autorizado.");
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
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
  const patch: Record<string, unknown> = {};

  if (values.title !== undefined) patch.title = values.title;
  if (values.slug !== undefined) patch.slug = values.slug;
  if (values.description !== undefined) patch.description = values.description;
  if (values.startDate !== undefined) patch.start_date = values.startDate;
  if (values.endDate !== undefined) patch.end_date = values.endDate;
  if (values.city !== undefined) patch.city = values.city;
  if (values.state !== undefined) patch.state = values.state;
  if (values.venueName !== undefined) patch.venue_name = values.venueName;
  if (values.address !== undefined) patch.address = values.address;
  if (values.coverImageUrl !== undefined) patch.cover_image_url = values.coverImageUrl || null;
  if (values.featured !== undefined) patch.featured = values.featured;
  if (values.status !== undefined) patch.status = values.status;

  const { data, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", id)
    .select("id,slug")
    .single();

  if (error) return apiError(500, error.message);
  return NextResponse.json({ event: data });
}
