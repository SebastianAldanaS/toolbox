import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp'],
  images: {
    domains: ['localhost'],
  }
};

export default nextConfig;
