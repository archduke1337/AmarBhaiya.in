import { StreamChat } from "stream-chat";

type StreamConfig = {
  apiKey: string;
  apiSecret: string;
};

let streamClient: StreamChat | null = null;
const ensuredStreamUsers = new Map<
  string,
  { fingerprint: string; expiresAt: number }
>();
const STREAM_TOKEN_TTL_SECONDS = 60 * 60;
const STREAM_USER_CACHE_TTL_MS = 15 * 60 * 1000;

function requireStreamConfig(): StreamConfig {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const apiSecret =
    process.env.STREAM_API_SECRET ?? process.env.STREAM_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Missing Stream API credentials.");
  }

  return { apiKey, apiSecret };
}

export function getStreamApiKey(): string {
  return requireStreamConfig().apiKey;
}

export function getStreamServerClient(): StreamChat {
  if (!streamClient) {
    const { apiKey, apiSecret } = requireStreamConfig();
    streamClient = StreamChat.getInstance(apiKey, apiSecret);
  }

  return streamClient;
}

export function createStreamUserToken(userId: string): string {
  const expirationTime = Math.floor(Date.now() / 1000) + STREAM_TOKEN_TTL_SECONDS;
  return getStreamServerClient().createToken(userId, expirationTime);
}

export async function ensureStreamUser(user: {
  id: string;
  name?: string;
  image?: string;
}): Promise<void> {
  const fingerprint = `${user.name ?? ""}::${user.image ?? ""}`;
  const cached = ensuredStreamUsers.get(user.id);
  if (cached && cached.fingerprint === fingerprint && cached.expiresAt > Date.now()) {
    return;
  }

  const client = getStreamServerClient();

  await client.upsertUser({
    id: user.id,
    name: user.name,
    image: user.image,
  });

  ensuredStreamUsers.set(user.id, {
    fingerprint,
    expiresAt: Date.now() + STREAM_USER_CACHE_TTL_MS,
  });
}
