import convert from "heic-convert";

type HeicConvert = typeof convert;

/**
 * CJS interop: an externalized heic-convert may arrive as the function or as { default }.
 * @example loadConvert(convert) // function
 */
function loadConvert(mod: unknown): HeicConvert {
  if (typeof mod === "function") return mod as HeicConvert;
  if (mod && typeof mod === "object" && "default" in mod) {
    const nested = (mod as { default: unknown }).default;
    if (typeof nested === "function") return nested as HeicConvert;
  }
  throw new Error("heic-convert did not load");
}

const heicConvert = loadConvert(convert);

/**
 * Decodes a HEIC/HEIF still into a JPEG buffer browsers can display.
 * @example await heicToJpeg(buf) // JPEG bytes
 */
export async function heicToJpeg(buf: Buffer): Promise<Buffer> {
  const jpeg = await heicConvert({
    buffer: buf,
    format: "JPEG",
    quality: 0.9,
  });
  return Buffer.from(jpeg);
}
