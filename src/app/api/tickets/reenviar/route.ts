import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Reenvio de ingressos por e-mail ainda nao configurado nesta base. Integre um provedor como Resend e dispare a partir da tabela tickets.",
    },
    { status: 501 },
  );
}
