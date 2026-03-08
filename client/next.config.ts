import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['recharts'],
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
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
