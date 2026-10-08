declare module "heic-convert" {
  type HeicConvertOptions = {
    buffer: Buffer | Uint8Array | ArrayBuffer;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  function convert(options: HeicConvertOptions): Promise<ArrayBuffer>;
  export default convert;
}
