import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

import { apiError, apiValidationError } from "@/lib/api/http";
import { hasPublicSupabaseEnv, requirePublicSupabaseEnv } from "@/lib/env/public";
import { hasServiceSupabaseEnv } from "@/lib/env/server";
import { getApiUserRole, isOrganizerOrAdmin } from "@/lib/supabase/api-auth";
import { getOrganizerIdForUser } from "@/lib/supabase/access";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
    message: "Use uma URL http(s) válida.",
  });

const createEventSchema = z.object({
  title: z.string().trim().min(3),
  slug: z.string().trim().min(3),
  description: z.string().trim().min(10),
  startDate: z.string().trim().min(4),
  endDate: z.string().optional().nullable(),
  city: z.string().trim().min(2),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  venueName: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  coverImageUrl: z.union([httpUrlSchema, z.literal("")]).optional().nullable(),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "published", "ended"]).optional(),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const state = url.searchParams.get("state")?.trim() ?? "";
  const city = url.searchParams.get("city")?.trim() ?? "";

  if (!hasPublicSupabaseEnv()) {
    return NextResponse.json({ events: [] });
  }

  const publicEnv = requirePublicSupabaseEnv();
  const supabase = createClient(publicEnv.url, publicEnv.anonKey);

  let query = supabase
    .from("events")
    .select(
      "id,organizer_id,slug,title,description,start_date,end_date,city,state,venue_name,address,cover_image_url,status,featured",
    )
    .eq("status", "published")
    .order("start_date", { ascending: true })
    .limit(60);

  if (q) query = query.ilike("title", `%${q}%`);
  if (state) query = query.eq("state", state);
  if (city) query = query.ilike("city", `%${city}%`);

  const { data, error } = await query;
  if (error) {
    return apiError(500, "Falha ao carregar eventos.", { events: [] });
  }

  return NextResponse.json({ events: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!hasServiceSupabaseEnv()) {
    return apiError(
      500,
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para criar eventos.",
    );
  }

  const auth = await getApiUserRole(request);
  if (!auth || !isOrganizerOrAdmin(auth.role)) {
    return apiError(401, "Não autorizado.");
  }

  const body = await request.json().catch(() => null);
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const supabase = createSupabaseServiceRoleClient();
  let organizerId = await getOrganizerIdForUser(supabase, auth.userId);
  if (!organizerId) {
    const { data: organizerCreated, error: organizerError } = await supabase
      .from("organizers")
      .insert({
        user_id: auth.userId,
        name: auth.email ? auth.email.split("@")[0] : "Organizador",
      })
      .select("id")
      .single();

    if (organizerError || !organizerCreated?.id) {
      return apiError(
        500,
        organizerError?.message ?? "Falha ao criar organizador para o usuário autenticado.",
      );
    }
    organizerId = organizerCreated.id;
  }

  if (!organizerId) {
    return apiError(500, "Falha ao resolver organizador.");
  }

  const values = parsed.data;
  const { data, error } = await supabase
    .from("events")
    .insert({
      organizer_id: organizerId,
      slug: values.slug,
      title: values.title,
      description: values.description,
      start_date: values.startDate,
      end_date: values.endDate ?? null,
      city: values.city,
      state: values.state,
      venue_name: values.venueName ?? null,
      address: values.address ?? null,
      cover_image_url: values.coverImageUrl || null,
      status: values.status ?? "draft",
      featured: Boolean(values.featured),
    })
    .select("id,slug")
    .single();

  if (error) {
    return apiError(500, error.message);
  }

  return NextResponse.json({ event: data }, { status: 201 });
}
