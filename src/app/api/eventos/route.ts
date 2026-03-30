import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

import { getApiUserRole, isOrganizerOrAdmin } from "@/lib/supabase/api-auth";
import { MOCK_EVENTS } from "@/services/mock-data";

const createEventSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(10),
  startDate: z.string().min(4),
  endDate: z.string().optional().nullable(),
  city: z.string().min(2),
  state: z.string().length(2),
  venueName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  featured: z.boolean().optional(),
  status: z.enum(["draft", "published", "ended"]).optional(),
});

function hasAnonEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function hasServiceEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const state = url.searchParams.get("state")?.trim() ?? "";
  const city = url.searchParams.get("city")?.trim() ?? "";

  if (!hasAnonEnv()) {
    return NextResponse.json({ events: MOCK_EVENTS });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

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
    return NextResponse.json({ events: [] }, { status: 500 });
  }

  return NextResponse.json({ events: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!hasServiceEnv()) {
    return NextResponse.json(
      { message: "Configure SUPABASE_SERVICE_ROLE_KEY para criar eventos." },
      { status: 500 },
    );
  }

  const auth = await getApiUserRole(request);
  if (!auth || !isOrganizerOrAdmin(auth.role)) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: organizerExisting } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  const organizerId =
    organizerExisting?.id ??
    (
      await supabase
        .from("organizers")
        .insert({
          user_id: auth.userId,
          name: auth.email ? auth.email.split("@")[0] : "Organizador",
        })
        .select("id")
        .single()
    ).data?.id;

  if (!organizerId) {
    return NextResponse.json(
      { message: "Falha ao resolver organizador." },
      { status: 500 },
    );
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
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data }, { status: 201 });
}
