import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['recharts'],
  // API proxy is handled by app/api/[...path]/route.ts (runs at request time, not build time)
  // This avoids env var issues with rewrites() which are evaluated at build time.
};

export default nextConfig;
