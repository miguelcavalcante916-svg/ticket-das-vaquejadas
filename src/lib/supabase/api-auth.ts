import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

import { hasPublicSupabaseEnv, requirePublicSupabaseEnv } from "@/lib/env/public";

export async function getApiUserRole(request: NextRequest) {
  if (!hasPublicSupabaseEnv()) return null;
  const { url, anonKey } = requirePublicSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // no-op
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    role: (profile?.role as string | undefined) ?? "user",
    email: user.email ?? null,
  };
}

export function isOrganizerOrAdmin(role: string | undefined) {
  return role === "organizer" || role === "admin";
}
