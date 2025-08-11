import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed rewrites since we're making direct calls to Vercel backend
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://task-manager-backend-gamma-silk.vercel.app/api',
  },
};

export default nextConfig;
