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
  allowedMimes: string[]
): boolean {
  const extension = filename.split(".").pop()?.toLowerCase();

  // Magic bytes for common file types
  const magicBytes: Record<string, string> = {
    pdf: "25504446", // %PDF
    jpg: "FFD8FF",
    jpeg: "FFD8FF",
    png: "89504E47", // PNG
    gif: "47494638", // GIF
    mp4: "0000001869747970", // ftyp (MP4 signature)
    webm: "1A45DFA3", // EBML (WebM signature)
    mov: "6674797020", // ftyp (MOV signature)
    mkv: "1A45DFA3", // EBML (Matroska)
  };

  if (!extension || !magicBytes[extension]) {
    return false; // Unknown extension
  }

  const hex = buffer.slice(0, 4).toString("hex").toUpperCase();
  const expectedPrefix = magicBytes[extension];

  return hex.startsWith(expectedPrefix);
}

/**
 * Generate idempotency key for webhook operations
 * Prevents duplicate processing of the same event
 */
export function generateIdempotencyKey(
  eventId: string,
  timestamp: string
): string {
  const crypto = require("crypto");
  return crypto
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

