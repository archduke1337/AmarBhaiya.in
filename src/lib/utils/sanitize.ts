const SCRIPT_OR_STYLE_BLOCK_PATTERN =
  /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const HTML_TAG_PATTERN = /<\/?[^>]+>/g;

/**
 * Sanitize user-generated text to prevent XSS attacks in server actions.
 *
 * These inputs are rendered back as plain text, not rich HTML, so we strip tags
 * instead of depending on a DOM-based sanitizer that would pull `jsdom` into the
 * server bundle.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) {
    return "";
  }

  return dirty
    .replace(/\0/g, "")
    .replace(SCRIPT_OR_STYLE_BLOCK_PATTERN, " ")
    .replace(HTML_TAG_PATTERN, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Escape user input for safe plain text display
 * Removes all HTML tags
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Validate file MIME type by checking magic bytes
 */
export function validateFileMimeType(
  buffer: Buffer,
  filename: string,
  allowedMimes?: string[]
): boolean {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) {
    return false;
  }

  const fileTypeByExtension: Record<string, { mime: string; matches: (input: Buffer) => boolean }> = {
    pdf: {
      mime: "application/pdf",
      matches: (input) => input.subarray(0, 4).toString("hex").toUpperCase() === "25504446",
    },
    jpg: {
      mime: "image/jpeg",
      matches: (input) => input.subarray(0, 3).toString("hex").toUpperCase() === "FFD8FF",
    },
    jpeg: {
      mime: "image/jpeg",
      matches: (input) => input.subarray(0, 3).toString("hex").toUpperCase() === "FFD8FF",
    },
    png: {
      mime: "image/png",
      matches: (input) => input.subarray(0, 4).toString("hex").toUpperCase() === "89504E47",
    },
    gif: {
      mime: "image/gif",
      matches: (input) => input.subarray(0, 4).toString("hex").toUpperCase() === "47494638",
    },
    webp: {
      mime: "image/webp",
      matches: (input) =>
        input.subarray(0, 4).toString("ascii") === "RIFF" &&
        input.subarray(8, 12).toString("ascii") === "WEBP",
    },
    mp4: {
      mime: "video/mp4",
      matches: (input) => input.subarray(4, 8).toString("ascii") === "ftyp",
    },
    mov: {
      mime: "video/quicktime",
      matches: (input) => input.subarray(4, 8).toString("ascii") === "ftyp",
    },
    webm: {
      mime: "video/webm",
      matches: (input) => input.subarray(0, 4).toString("hex").toUpperCase() === "1A45DFA3",
    },
    mkv: {
      mime: "video/x-matroska",
      matches: (input) => input.subarray(0, 4).toString("hex").toUpperCase() === "1A45DFA3",
    },
  };

  const fileType = fileTypeByExtension[extension];
  if (!fileType) {
    return false;
  }

  if (allowedMimes && allowedMimes.length > 0 && !allowedMimes.includes(fileType.mime)) {
    return false;
  }

  return fileType.matches(buffer);
}

/**
 * Generate idempotency key for webhook operations
 * Prevents duplicate processing of the same event
 */
export function generateIdempotencyKey(
  eventId: string,
  timestamp: string
): string {
  // Use dynamic import workaround for server-side crypto
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require("crypto") as typeof import("crypto");
  return nodeCrypto
    .createHash("sha256")
    .update(`${eventId}:${timestamp}`)
    .digest("hex");
}

/**
 * Check if idempotency key was already processed
 */
export function isIdempotencyKeyProcessed(key: string, processedKeys: Set<string>): boolean {
  return processedKeys.has(key);
}

