import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Reenvio de ingressos por e-mail ainda não configurado nesta base. Integre um provedor (ex.: Resend) e dispare a partir da tabela tickets.",
    },
    { status: 501 },
  );
}

