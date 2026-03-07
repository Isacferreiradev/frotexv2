import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['recharts'],
  async rewrites() {
    // BACKEND_URL: set this in Railway frontend service env vars to point to the backend service.
    // Example: BACKEND_URL=https://alugafacil-server-production.up.railway.app
    //
    // For monorepo single-service deployments, leave unset — falls back to localhost:4000.
    //
    // IMPORTANT: Do NOT use NEXT_PUBLIC_ prefix — this must be server-side only.
    // The proxy runs server-side so there are ZERO CORS issues regardless of the URL.
    const backendUrl = process.env.BACKEND_URL
      ? process.env.BACKEND_URL.replace(/\/$/, '') // strip trailing slash
      : 'http://127.0.0.1:4000';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
