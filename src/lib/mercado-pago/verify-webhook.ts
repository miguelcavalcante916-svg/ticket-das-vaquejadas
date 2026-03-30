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
  rawBody,
  signatureHeader,
  secret,
}: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string | undefined;
}) {
  if (!secret) return true;
  if (!signatureHeader) return false;

  const parsed = parseSignature(signatureHeader);
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const provided = parsed.v1 ?? signatureHeader;
  return timingSafeEqual(provided, expected);
}

