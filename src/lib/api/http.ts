import { NextResponse } from "next/server";
import type { z } from "zod";

export function apiError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...extra }, { status });
}

export function apiValidationError(error: z.ZodError) {
  return apiError(400, "Payload inválido.", { errors: error.flatten() });
}

