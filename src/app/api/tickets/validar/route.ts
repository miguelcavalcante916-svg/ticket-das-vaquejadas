import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { NextResponse, type NextRequest } from "next/server";

const schema = z.object({
  code: z.string().min(3),
  eventId: z.string().min(1),
});

function hasServiceEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const { code, eventId } = parsed.data;

  if (!hasServiceEnv()) {
    const ok = code.startsWith("TVQ-");
    return NextResponse.json({
      status: ok ? "valid" : "invalid",
      message: ok ? "Ingresso válido (modo demo)." : "Ingresso inválido (modo demo).",
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("id,event_id,checked_in_at,status")
    .eq("code", code)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error || !ticket) {
    return NextResponse.json(
      { status: "invalid", message: "Ingresso não encontrado." },
      { status: 200 },
    );
  }

  const { data: checkin } = await supabase
    .from("checkins")
    .select("id,checked_in_at")
    .eq("ticket_id", ticket.id)
    .maybeSingle();

  if (checkin) {
    return NextResponse.json({
      status: "used",
      message: "Ingresso já validado.",
    });
  }

  const { error: insertError } = await supabase.from("checkins").insert({
    ticket_id: ticket.id,
    event_id: eventId,
    checked_in_at: new Date().toISOString(),
  });

  if (insertError) {
    return NextResponse.json(
      { status: "error", message: insertError.message },
      { status: 500 },
    );
  }

  await supabase
    .from("tickets")
    .update({ status: "used", checked_in_at: new Date().toISOString() })
    .eq("id", ticket.id);

  return NextResponse.json({
    status: "valid",
    message: "Check-in realizado com sucesso.",
  });
}

