import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['recharts'],
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
