import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["heic-convert", "heic-decode", "libheif-js"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 92],
    remotePatterns: [
      { protocol: "https", hostname: "i.gr-assets.com", pathname: "/**" },
      { protocol: "https", hostname: "images.gr-assets.com", pathname: "/**" },
      { protocol: "https", hostname: "s.gr-assets.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
