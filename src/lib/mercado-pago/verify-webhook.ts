import "server-only";

import crypto from "crypto";

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function parseSignature(header: string) {
  // Ex.: "ts=1700000000;v1=abcdef..." ou somente "abcdef..."
  const parts = header.split(/[;,]/g).map((p) => p.trim());
  const kv = new Map<string, string>();
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (!rest.length) continue;
    kv.set(k, rest.join("="));
  }
  return {
    ts: kv.get("ts") ?? null,
    v1: kv.get("v1") ?? null,
  };
}

export function verifyMercadoPagoWebhookSignature({
  signatureHeader,
  secret,
  rawBody,
  dataId,
  requestId,
}: {
  signatureHeader: string | null;
  secret: string | undefined;
  rawBody: string;
  dataId?: string | null;
  requestId?: string | null;
}) {
  if (!secret) return false;
  if (!signatureHeader) return false;

  const parsed = parseSignature(signatureHeader);
  const provided = parsed.v1 ?? signatureHeader;
  if (!provided) return false;

  const normalizedId = dataId?.trim().toLowerCase() ?? null;
  const normalizedRequestId = requestId?.trim() ?? null;

  if (parsed.ts && normalizedId && normalizedRequestId) {
    const manifest = `id:${normalizedId};request-id:${normalizedRequestId};ts:${parsed.ts};`;
    const expectedManifest = crypto
      .createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");

    if (timingSafeEqual(provided, expectedManifest)) {
      return true;
    }
  }

  const expectedRawBody = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(provided, expectedRawBody);
}
