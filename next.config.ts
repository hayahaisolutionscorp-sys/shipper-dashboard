import type { NextConfig } from "next";

const BACKEND_URL = (
  process.env.AYAHAY_API_URL ||
  process.env.NEXT_PUBLIC_V2_API_URL ||
  "http://localhost:3002"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
