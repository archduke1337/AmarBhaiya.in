import crypto from "node:crypto";
import Razorpay from "razorpay";

export type RazorpayOrderInput = {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
};

type RazorpayConfig = {
  keyId: string;
  keySecret: string;
};

let razorpayClient: Razorpay | null = null;

function requireRazorpayConfig(): RazorpayConfig {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials.");
  }

  return { keyId, keySecret };
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function getRazorpayPublicKey(): string {
  return requireRazorpayConfig().keyId;
}

export function getRazorpayClient(): Razorpay {
  if (!razorpayClient) {
    const { keyId, keySecret } = requireRazorpayConfig();
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayClient;
}

export async function createRazorpayOrder(input: RazorpayOrderInput) {
  const client = getRazorpayClient();

  return client.orders.create({
    amount: input.amount,
    currency: input.currency ?? "INR",
    receipt: input.receipt,
    notes: input.notes,
  });
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  // Use dedicated webhook secret if available, fall back to API key secret
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const { keySecret } = requireRazorpayConfig();
  const secret = webhookSecret || keySecret;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return safeEqual(expected, signature);
}
