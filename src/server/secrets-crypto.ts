/**
 * AES-GCM helpers for sensitive CMS fields at rest.
 * Key material comes from CONTENT_ENCRYPTION_KEY or CMS_SECRET (server env only).
 */

const PREFIX = "enc:v1:";

/**
 * Returns the encryption key from env.
 * @example encryptionSecret() // "my-long-secret-key…"
 */
function encryptionSecret() {
  return (
    process.env.CONTENT_ENCRYPTION_KEY?.trim() ||
    process.env.CMS_SECRET?.trim() ||
    ""
  );
}

/**
 * True when a usable encryption key (≥16 chars) is set.
 * @example encryptionConfigured() // true
 */
export function encryptionConfigured() {
  return encryptionSecret().length >= 16;
}

/**
 * Encodes bytes to URL-safe base64.
 * @example bytesToB64(new Uint8Array([1,2])) // "AQI"
 */
function bytesToB64(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/**
 * Decodes URL-safe base64 to bytes.
 * @example b64ToBytes("AQI") // Uint8Array([1,2])
 */
function b64ToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Imports AES-GCM key derived from the env secret.
 * @example await importAesKey() // CryptoKey
 */
async function importAesKey() {
  const secret = encryptionSecret();
  if (!secret) throw new Error("CONTENT_ENCRYPTION_KEY or CMS_SECRET is required for encryption.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

/**
 * Checks if a value is already encrypted.
 * @example isEncryptedValue("enc:v1:…") // true
 */
export function isEncryptedValue(value: string) {
  return value.startsWith(PREFIX);
}

/**
 * Encrypts plaintext for storage.
 * @example await encryptSecret("youtube.com/…") // "enc:v1:iv.cipher"
 */
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

/**
 * Decrypts an encrypted value, or returns plaintext as-is.
 * @example await decryptSecret("enc:v1:…") // "youtube.com/…"
 */
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
