import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['recharts'],
  async rewrites() {
    // IMPORTANT: Do NOT use INTERNAL_BACKEND_PORT here.
    // next.config.ts rewrites are evaluated at BUILD TIME, not runtime.
    // INTERNAL_BACKEND_PORT is passed via the start command and is not
    // available during build, so it would resolve to undefined, breaking the proxy.
    // The backend always runs on port 4000 internally.
    const backendPort = 4000;
    return [
      {
        source: '/api/:path*',
        destination: `http://127.0.0.1:${backendPort}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
