"use client";

import Image, { type ImageProps } from "next/image";

type MediaImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

/** Hosts configured in next.config.ts `images.remotePatterns`. */
function isOptimizedRemoteHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === "i.gr-assets.com" ||
    host === "images.gr-assets.com" ||
    host === "s.gr-assets.com"
  ) {
    return true;
  }
  if (host.endsWith(".public.blob.vercel-storage.com")) return true;
  return false;
}

/**
 * True when next/image can optimize this src (local path or allowlisted remote).
 * CMS skill icons / memory photos may use arbitrary HTTPS hosts — those fall back to <img>.
 */
export function canOptimizeImageSrc(src: string): boolean {
  const clean = src.trim();
  if (!clean) return false;
  if (clean.startsWith("/") && !clean.startsWith("//")) return true;
  if (clean.startsWith("data:")) return false;
  try {
    const url = new URL(clean);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return isOptimizedRemoteHost(url.hostname);
  } catch {
    return false;
  }
}

/** next/image for local + allowlisted remotes; plain <img> for other CMS/external URLs. */
export function MediaImage({
  src,
  alt,
  className,
  style,
  width,
  height,
  sizes,
  priority,
  loading,
  draggable,
  fill,
  ...rest
}: MediaImageProps) {
  const clean = src.trim();
  if (!clean) return null;

  if (!canOptimizeImageSrc(clean)) {
    return (
      // Arbitrary CMS/external hosts are not in remotePatterns.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={clean}
        alt={alt}
        className={className}
        style={style}
        width={typeof width === "number" ? width : undefined}
        height={typeof height === "number" ? height : undefined}
        loading={priority ? "eager" : loading === "eager" ? "eager" : "lazy"}
        decoding="async"
        draggable={draggable}
        {...rest}
      />
    );
  }

  return (
    <Image
      src={clean}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={loading}
      draggable={draggable}
      fill={fill}
      {...rest}
    />
  );
}
