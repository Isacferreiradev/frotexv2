import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['recharts'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // We hardcode the external backend URL to ensure the proxy always resolves correctly
        // across differing Docker configurations. Next.js handles proxying natively this way.
        destination: `https://alugafacil-server-production.up.railway.app/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
