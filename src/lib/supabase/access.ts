import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type Role = "user" | "organizer" | "admin";

type OrderAccessResult = {
  allowed: boolean;
  order: { user_id: string | null; event_id: string } | null;
};

export async function getOrganizerIdForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  return organizer?.id ?? null;
}

export async function canManageEvent(
  supabase: SupabaseClient,
  role: Role,
  userId: string,
  eventId: string,
): Promise<boolean> {
  if (role === "admin") return true;
  if (role !== "organizer") return false;

  const organizerId = await getOrganizerIdForUser(supabase, userId);
  if (!organizerId) return false;

  const { data: event } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", eventId)
    .maybeSingle();

  return Boolean(event?.organizer_id && event.organizer_id === organizerId);
}

export async function canAccessOrder(
  supabase: SupabaseClient,
  role: Role,
  userId: string,
  orderId: string,
): Promise<OrderAccessResult> {
  const { data: order } = await supabase
    .from("orders")
    .select("user_id,event_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { allowed: false, order: null };
  if (role === "admin") return { allowed: true, order };

  if (role === "organizer") {
    const allowed = await canManageEvent(supabase, role, userId, order.event_id);
    return { allowed, order };
  }

  return { allowed: order.user_id === userId, order };
}

export async function canAccessGuestOrder(
  supabase: SupabaseClient,
  orderId: string,
): Promise<OrderAccessResult> {
  const { data: order } = await supabase
    .from("orders")
    .select("user_id,event_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { allowed: false, order: null };
  return { allowed: !order.user_id, order };
}
