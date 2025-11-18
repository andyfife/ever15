import type { NextConfig } from 'next';
const path = require('path');
const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint errors during build
  },
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'milkywayfiasco.sfo2.cdn.digitaloceanspaces.com',
      },
      {
        protocol: 'https',
        hostname: 'i0.wp.com',
      },
    ],
  },
};

export default nextConfig;
