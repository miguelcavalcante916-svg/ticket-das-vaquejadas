import { NextResponse, type NextRequest } from "next/server";

import { getOrderById } from "@/services/orders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ message: "Pedido não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ order });
}

