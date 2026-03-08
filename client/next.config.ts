import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['recharts'],
  // Note: The /api rewrites proxy has been removed.
  // All API calls now go directly from the browser to the backend URL
  // defined in NEXT_PUBLIC_BACKEND_URL (see client/src/lib/api.ts).
  // This prevents HPE_HEADER_OVERFLOW errors caused by Next.js proxy
  // mishandling chunked HTTP responses from the backend.
};

export default nextConfig;
