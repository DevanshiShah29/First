export type SniffedMedia = {
  ext: "jpg" | "png" | "webp" | "gif" | "avif" | "heic" | "mp4" | "webm" | "ogv" | "mov" | "pdf";
  contentType: string;
  kind: "image" | "video" | "file";
};

const HEIC_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
]);

/**
 * True when buf starts with the given byte sequence.
 * @example startsWith(buf, [0xff, 0xd8]) // true
 */
function startsWith(buf: Buffer, bytes: number[]): boolean {
  if (buf.length < bytes.length) return false;
  return bytes.every((b, i) => buf[i] === b);
}

/**
 * True when buf has ASCII text at offset.
 * @example asciiAt(buf, 0, "%PDF") // true
 */
function asciiAt(buf: Buffer, offset: number, text: string): boolean {
  if (buf.length < offset + text.length) return false;
  for (let i = 0; i < text.length; i += 1) {
    if (buf[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * Reads the ISO BMFF ftyp major brand and compatible brands.
 * @example ftypInfo(buf) // { brand: "heic", compatible: ["mif1"] } | null
 */
function ftypInfo(buf: Buffer): { brand: string; compatible: string[] } | null {
  // ISO BMFF: size(4) + 'ftyp'(4) + major_brand(4) + minor(4) + compatible brands
  if (buf.length < 12 || !asciiAt(buf, 4, "ftyp")) return null;
  const declared = buf.readUInt32BE(0);
  const end = declared >= 16 && declared <= buf.length ? declared : Math.min(buf.length, 64);
  const compatible: string[] = [];
  for (let offset = 16; offset + 4 <= end; offset += 4) {
    compatible.push(buf.subarray(offset, offset + 4).toString("latin1").toLowerCase());
  }
  return {
    brand: buf.subarray(8, 12).toString("latin1").toLowerCase(),
    compatible,
  };
}

/**
 * True when an ftyp brand is an Apple/HEIF still photo rather than AVIF.
 * @example isHeicBrand("heic", ["mif1"]) // true
 */
function isHeicBrand(brand: string, compatible: string[]): boolean {
  if (HEIC_BRANDS.has(brand)) return true;
  if (brand !== "mif1" && brand !== "msf1") return false;
  return compatible.some((item) => {
    const token = item.trim();
    return HEIC_BRANDS.has(token) || token === "mihe" || token === "mihb";
  });
}

/**
 * Detects allowed upload type from magic bytes.
 * @example sniffUploadMagic(buf) // { ext: "png", … } | null
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

  const ftyp = ftypInfo(buf);
  if (ftyp) {
    const b = ftyp.brand;
    const hasAvif =
      b === "avif" ||
      b === "avis" ||
      ftyp.compatible.some((item) => item === "avif" || item === "avis");
    if (hasAvif) {
      return { ext: "avif", contentType: "image/avif", kind: "image" };
    }
    if (isHeicBrand(b, ftyp.compatible)) {
      return { ext: "heic", contentType: "image/heic", kind: "image" };
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
