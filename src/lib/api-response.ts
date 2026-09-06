export type ApiResponse<T = void> =
  | ([T] extends [void]
      ? { ok: true; data?: undefined; error?: undefined }
      : { ok: true; data: T; error?: undefined })
  | { ok: false; error: string; data?: undefined };
