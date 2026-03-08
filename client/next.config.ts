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
        // Hardcoded to ensure proxy resolves correctly across Railway deployments.
        destination: `https://alugafacil-server-production.up.railway.app/api/:path*`,
      },
    ];
  },
  // Increase Node.js HTTP parser header size limit to prevent HPE_HEADER_OVERFLOW
  // when the backend returns large headers (e.g., chunked Transfer-Encoding with many headers).
  serverExternalPackages: [],
  httpAgentOptions: {
    // Disable keep-alive so the proxy does NOT reuse TCP connections across requests.
    // This prevents HPE_HEADER_OVERFLOW caused by the Node.js HTTP parser reading
    // leftover chunked body bytes from a previous response as new response headers.
    keepAlive: false,
  },
};

export default nextConfig;
