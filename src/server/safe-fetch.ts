import { lookup } from "dns/promises";
import { isIP } from "net";

/**
 * True for private, loopback, link-local, or cloud-metadata IPs.
 * @example isPrivateIp("127.0.0.1") // true
 */
function isPrivateIp(ip: string) {
  const v = ip.toLowerCase();
  if (v === "127.0.0.1" || v === "::1" || v === "0.0.0.0") return true;
  if (v.startsWith("10.") || v.startsWith("192.168.") || v.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(v)) return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80:")) return true;
  // Cloud metadata
  if (v === "169.254.169.254" || v === "metadata.google.internal") return true;
  return false;
}

/**
 * Allows only public HTTPS URLs after DNS checks.
 * @example await assertPublicHttpsUrl("example.com") // URL
 */
export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  let normalized = raw.trim();
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error("Invalid URL.");
  }
  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed.");
  }
  const host = url.hostname;
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("That host is not allowed.");
  }
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error("That host is not allowed.");
    return url;
  }
  const records = await lookup(host, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) {
    throw new Error("That host is not allowed.");
  }
  return url;
}
