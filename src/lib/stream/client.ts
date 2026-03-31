import { StreamChat } from "stream-chat";

type StreamConfig = {
  apiKey: string;
  apiSecret: string;
};

let streamClient: StreamChat | null = null;

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
  return getStreamServerClient().createToken(userId);
}

export async function ensureStreamUser(user: {
  id: string;
  name?: string;
  image?: string;
}): Promise<void> {
  const client = getStreamServerClient();

  await client.upsertUser({
    id: user.id,
    name: user.name,
    image: user.image,
  });
}
