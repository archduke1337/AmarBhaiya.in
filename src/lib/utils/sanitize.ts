import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize user-generated HTML content to prevent XSS attacks
 * Allows safe tags: p, br, strong, em, u, h1-h6, ul, ol, li, a, code, pre
 */
export function sanitizeHtml(dirty: string): string {
  const config = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "code",
      "pre",
      "blockquote",
    ],
    ALLOWED_ATTR: ["href", "title"],
    ALLOW_DATA_ATTR: false,
  };

  return DOMPurify.sanitize(dirty, config);
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

