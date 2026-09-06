/**
 * AES-GCM helpers for sensitive CMS fields at rest.
 * Key material comes from CONTENT_ENCRYPTION_KEY or CMS_SECRET (server env only).
 */

const PREFIX = "enc:v1:";

function encryptionSecret() {
  return (
    process.env.CONTENT_ENCRYPTION_KEY?.trim() ||
    process.env.CMS_SECRET?.trim() ||
    ""
  );
}

export function encryptionConfigured() {
  return encryptionSecret().length >= 16;
}

function bytesToB64(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64ToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function importAesKey() {
  const secret = encryptionSecret();
  if (!secret) throw new Error("CONTENT_ENCRYPTION_KEY or CMS_SECRET is required for encryption.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export function isEncryptedValue(value: string) {
  return value.startsWith(PREFIX);
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const trimmed = plaintext.trim();
  if (!trimmed) return "";
  if (isEncryptedValue(trimmed)) return trimmed;
  // Fail closed — never persist sensitive fields as plaintext when the key is missing/short.
  if (!encryptionConfigured()) {
    throw new Error(
      "CONTENT_ENCRYPTION_KEY or CMS_SECRET (at least 16 characters) is required to store sensitive fields.",
    );
  }
  const key = await importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(trimmed),
  );
  return `${PREFIX}${bytesToB64(iv)}.${bytesToB64(cipher)}`;
}

export async function decryptSecret(value: string): Promise<string> {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!isEncryptedValue(trimmed)) return trimmed;
  if (!encryptionConfigured()) {
    throw new Error("Encrypted content found but CONTENT_ENCRYPTION_KEY / CMS_SECRET is not set.");
  }
  const body = trimmed.slice(PREFIX.length);
  const dot = body.indexOf(".");
  if (dot < 1) throw new Error("Invalid encrypted payload.");
  const iv = b64ToBytes(body.slice(0, dot));
  const data = b64ToBytes(body.slice(dot + 1));
  const key = await importAesKey();
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(plain);
}
