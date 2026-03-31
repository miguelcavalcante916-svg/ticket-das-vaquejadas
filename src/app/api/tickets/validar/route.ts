import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

import { apiError, apiValidationError } from "@/lib/api/http";
import { hasServiceSupabaseEnv } from "@/lib/env/server";
import { getApiUserRole, isOrganizerOrAdmin } from "@/lib/supabase/api-auth";
import { canManageEvent } from "@/lib/supabase/access";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  code: z.string().trim().min(3),
  eventId: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const { code, eventId } = parsed.data;

  if (!hasServiceSupabaseEnv()) {
    const valid = code.startsWith("TVQ-");
    return NextResponse.json({
      status: valid ? "valid" : "invalid",
      message: valid ? "Ingresso valido (modo demo)." : "Ingresso invalido (modo demo).",
    });
  }

  const auth = await getApiUserRole(request);
  if (!auth || !isOrganizerOrAdmin(auth.role)) {
    return apiError(401, "Nao autorizado.");
  }

  const supabase = createSupabaseServiceRoleClient();
  if (
    auth.role === "organizer" &&
    !(await canManageEvent(supabase, "organizer", auth.userId, eventId))
  ) {
    return apiError(403, "Sem acesso a este evento.");
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("id,event_id,checked_in_at,status")
    .eq("code", code)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error || !ticket) {
    return NextResponse.json(
      { status: "invalid", message: "Ingresso nao encontrado." },
      { status: 200 },
    );
  }

  if (ticket.status === "used" || ticket.checked_in_at) {
    return NextResponse.json({
      status: "used",
      message: "Ingresso ja validado.",
    });
  }

  if (ticket.status !== "active") {
    return NextResponse.json({
      status: "invalid",
      message: "Ingresso indisponivel para check-in.",
    });
  }

  const { data: checkin } = await supabase
    .from("checkins")
    .select("id,checked_in_at")
    .eq("ticket_id", ticket.id)
    .maybeSingle();

  if (checkin) {
    return NextResponse.json({
      status: "used",
      message: "Ingresso ja validado.",
    });
  }

  const now = new Date().toISOString();
  const { error: insertError } = await supabase.from("checkins").insert({
    ticket_id: ticket.id,
    event_id: eventId,
    checked_in_by: auth.userId,
    checked_in_at: now,
  });

  if (insertError) {
    const duplicateError = (insertError as { code?: string }).code === "23505";
    if (duplicateError) {
      return NextResponse.json({
        status: "used",
        message: "Ingresso ja validado.",
      });
    }

    return apiError(500, insertError.message);
  }

  await supabase
    .from("tickets")
    .update({ status: "used", checked_in_at: now })
    .eq("id", ticket.id);

  return NextResponse.json({
    status: "valid",
    message: "Check-in realizado com sucesso.",
  });
}
