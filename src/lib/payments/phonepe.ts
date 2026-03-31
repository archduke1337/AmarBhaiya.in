import crypto from "node:crypto";

const PHONEPE_PAY_PATH = "/pg/v1/pay";

export type PhonePeCreateOrderInput = {
  amount: number;
  merchantTransactionId: string;
  merchantUserId: string;
  redirectUrl: string;
  callbackUrl: string;
};

export type PhonePePayResponse = {
  success?: boolean;
  code?: string;
  message?: string;
  data?: {
    merchantId?: string;
    merchantTransactionId?: string;
    instrumentResponse?: {
      type?: string;
      redirectInfo?: {
        url?: string;
        method?: string;
      };
    };
  };
};

export type PhonePeWebhookDecoded = {
  success?: boolean;
  code?: string;
  message?: string;
  data?: {
    merchantId?: string;
    merchantTransactionId?: string;
    transactionId?: string;
    amount?: number;
    state?: string;
    responseCode?: string;
  };
};

type PhonePeConfig = {
  merchantId: string;
  saltKey: string;
  saltIndex: string;
  baseUrl: string;
};

function requirePhonePeConfig(): PhonePeConfig {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX;
  const baseUrl =
    process.env.PHONEPE_BASE_URL ??
    "https://api-preprod.phonepe.com/apis/pg-sandbox";

  if (!merchantId || !saltKey || !saltIndex) {
    throw new Error("Missing PhonePe configuration.");
  }

  return {
    merchantId,
    saltKey,
    saltIndex,
    baseUrl,
  };
}

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createPhonePeChecksum(
  encodedPayload: string,
  path: string,
  saltKey: string,
  saltIndex: string
): string {
  const digest = sha256(`${encodedPayload}${path}${saltKey}`);
  return `${digest}###${saltIndex}`;
}

export async function createPhonePeOrder(input: PhonePeCreateOrderInput) {
  const config = requirePhonePeConfig();

  const payload = {
    merchantId: config.merchantId,
    merchantTransactionId: input.merchantTransactionId,
    merchantUserId: input.merchantUserId,
    amount: input.amount,
    redirectUrl: input.redirectUrl,
    redirectMode: "POST",
    callbackUrl: input.callbackUrl,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64"
  );

  const xVerify = createPhonePeChecksum(
    encodedPayload,
    PHONEPE_PAY_PATH,
    config.saltKey,
    config.saltIndex
  );

  const response = await fetch(`${config.baseUrl}${PHONEPE_PAY_PATH}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
    },
    body: JSON.stringify({ request: encodedPayload }),
  });

  const responseJson = (await response.json().catch(() => ({}))) as PhonePePayResponse;

  if (!response.ok) {
    throw new Error(
      `PhonePe order request failed with status ${response.status}.`
    );
  }

  return {
    merchantTransactionId: input.merchantTransactionId,
    response: responseJson,
  };
}

export function verifyPhonePeWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const { saltKey, saltIndex } = requirePhonePeConfig();
  const expected = `${sha256(rawBody + saltKey)}###${saltIndex}`;
  return safeEqual(expected, signature);
}

export function decodePhonePeWebhookBody(rawBody: string): PhonePeWebhookDecoded | null {
  const parsed = JSON.parse(rawBody) as { response?: string };

  if (!parsed.response) {
    return null;
  }

  const decoded = Buffer.from(parsed.response, "base64").toString("utf8");
  return JSON.parse(decoded) as PhonePeWebhookDecoded;
}
