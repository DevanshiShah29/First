export type SniffedMedia = {
  ext: "jpg" | "png" | "webp" | "gif" | "avif" | "mp4" | "webm" | "ogv" | "mov" | "pdf";
  contentType: string;
  kind: "image" | "video" | "file";
};

function startsWith(buf: Buffer, bytes: number[]): boolean {
  if (buf.length < bytes.length) return false;
  return bytes.every((b, i) => buf[i] === b);
}

function asciiAt(buf: Buffer, offset: number, text: string): boolean {
  if (buf.length < offset + text.length) return false;
  for (let i = 0; i < text.length; i += 1) {
    if (buf[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

function ftypBrand(buf: Buffer): string | null {
  // ISO BMFF: size(4) + 'ftyp'(4) + major_brand(4)
  if (buf.length < 12 || !asciiAt(buf, 4, "ftyp")) return null;
  return buf.subarray(8, 12).toString("ascii");
}

/**
 * Detect allowed upload types from file magic bytes (not client MIME/extension).
 * Returns null when the buffer does not match a supported type.
 */
export function sniffUploadMagic(buf: Buffer): SniffedMedia | null {
  if (!buf.length) return null;

  if (asciiAt(buf, 0, "%PDF")) {
    return { ext: "pdf", contentType: "application/pdf", kind: "file" };
  }

  // JPEG
  if (startsWith(buf, [0xff, 0xd8, 0xff])) {
    return { ext: "jpg", contentType: "image/jpeg", kind: "image" };
  }

  // PNG
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { ext: "png", contentType: "image/png", kind: "image" };
  }

  // GIF
  if (asciiAt(buf, 0, "GIF87a") || asciiAt(buf, 0, "GIF89a")) {
    return { ext: "gif", contentType: "image/gif", kind: "image" };
  }

  // WEBP: RIFF....WEBP
  if (asciiAt(buf, 0, "RIFF") && asciiAt(buf, 8, "WEBP")) {
    return { ext: "webp", contentType: "image/webp", kind: "image" };
  }

  // WebM / Matroska EBML
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { ext: "webm", contentType: "video/webm", kind: "video" };
  }

  // Ogg container
  if (asciiAt(buf, 0, "OggS")) {
    return { ext: "ogv", contentType: "video/ogg", kind: "video" };
  }

  const brand = ftypBrand(buf);
  if (brand) {
    const b = brand.toLowerCase();
    // AVIF
    if (b === "avif" || b === "avis" || b === "mif1") {
      // mif1 is HEIF family — only accept when 'avif' also appears in compatible brands
      if (b === "avif" || b === "avis") {
        return { ext: "avif", contentType: "image/avif", kind: "image" };
      }
      const compat = buf.subarray(16, Math.min(buf.length, 64)).toString("ascii");
      if (compat.includes("avif") || compat.includes("avis")) {
        return { ext: "avif", contentType: "image/avif", kind: "image" };
      }
    }
    // QuickTime / MOV
    if (b === "qt  " || b === "moov") {
      return { ext: "mov", contentType: "video/quicktime", kind: "video" };
    }
    // MP4 family
    if (
      b === "isom" ||
      b === "iso2" ||
      b === "mp41" ||
      b === "mp42" ||
      b === "avc1" ||
      b === "dash" ||
      b === "msdh" ||
      b === "m4v "
    ) {
      return { ext: "mp4", contentType: "video/mp4", kind: "video" };
    }
  }

  return null;
}
