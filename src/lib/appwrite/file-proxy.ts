import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

type AppwriteFileProxyMode = "download" | "view";

type ProxyAppwriteBucketFileInput = {
  request: Request;
  bucketId: string;
  fileId: string;
  mode?: AppwriteFileProxyMode;
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function proxyAppwriteBucketFile({
  request,
  bucketId,
  fileId,
  mode = "view",
}: ProxyAppwriteBucketFileInput): Promise<Response> {
  const apiKey = process.env.APPWRITE_API_KEY;
  if (!apiKey) {
    return jsonError("Missing APPWRITE_API_KEY environment variable.", 500);
  }

  const upstreamResponse = await fetch(
    `${APPWRITE_CONFIG.endpoint}/storage/buckets/${bucketId}/files/${fileId}/${mode}`,
    {
      method: "GET",
      headers: {
        "X-Appwrite-Project": APPWRITE_CONFIG.projectId,
        "X-Appwrite-Key": apiKey,
        ...(request.headers.get("range")
          ? { Range: request.headers.get("range") as string }
          : {}),
      },
      cache: "no-store",
    }
  ).catch(() => null);

  if (!upstreamResponse) {
    return jsonError("Failed to stream file from Appwrite.", 502);
  }

  if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
    const errorText = await upstreamResponse.text().catch(() => "");
    return jsonError(errorText || "Failed to fetch file from Appwrite.", upstreamResponse.status);
  }

  const headers = new Headers();
  const headerNames = [
    "accept-ranges",
    "cache-control",
    "content-disposition",
    "content-length",
    "content-range",
    "content-type",
    "etag",
    "last-modified",
  ];

  for (const headerName of headerNames) {
    const value = upstreamResponse.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  if (mode === "view") {
    headers.set("Content-Disposition", "inline");
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}
