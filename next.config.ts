import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://task-manager-backend-gamma-silk.vercel.app/api/:path*',
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://task-manager-backend-gamma-silk.vercel.app/api',
  },
};

export default nextConfig;
