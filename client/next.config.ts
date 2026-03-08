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
        // IMPORTANT: proxy to the INTERNAL backend port (localhost:4000), NOT the external URL.
        // Pointing to the external HTTPS URL caused HPE_HEADER_OVERFLOW because Node.js's HTTP
        // parser couldn't handle the TLS-chunked responses from the external server over keep-alive.
        // localhost:4000 is the Express backend running in the same Railway container.
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
