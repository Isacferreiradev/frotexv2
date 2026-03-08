import type { NextConfig } from "next";

// On Vercel, next.config.ts is evaluated at BUILD time. 
// If the user forgot to add NEXT_PUBLIC_BACKEND_URL before deploying,
// it might have baked in the wrong URL. We provide a strong default fallback
// to the known Railway URL, or localhost in dev.
const isDev = process.env.NODE_ENV !== 'production';
const defaultProxy = isDev
  ? 'http://localhost:4000/api'
  : 'https://alugafacil-server-production.up.railway.app/api';

let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || defaultProxy;

// Vercel build fails if the URL doesn't have http:// or https://
if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
  backendUrl = isDev ? `http://${backendUrl}` : `https://${backendUrl}`;
}

// Ensure we don't end up with /api/api if the URL already has /api
const destination = backendUrl.endsWith('/api')
  ? `${backendUrl}/:path*`
  : `${backendUrl}/api/:path*`;

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
        destination,
      },
    ];
  },
};

export default nextConfig;
