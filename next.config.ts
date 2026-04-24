import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.continente.pt" },
      { protocol: "https", hostname: "static.continente.pt" },
    ],
  },
};

export default nextConfig;
