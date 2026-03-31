import { z } from "zod";

export const PRODUCTION_SITE_URL = "https://ticketdavaquejada.netlify.app";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cached: PublicEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (cached) return cached;
  const parsed = publicEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Env pública inválida: ${parsed.error.message}`);
  }
  cached = parsed.data;
  return cached;
}

export function hasPublicSupabaseEnv() {
  const env = getPublicEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function requirePublicSupabaseEnv() {
  const env = getPublicEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env ausente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return { url, anonKey };
}

export function getPublicSiteUrl() {
  const env = getPublicEnv();
  if (env.NEXT_PUBLIC_SITE_URL) {
    return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }

  return "http://localhost:3000";
}
