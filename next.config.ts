const { DefinePlugin } = require('webpack');
const { readFileSync } = require('fs');
const { join } = require('path');
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Add the output: 'export' configuration
  output: 'export',
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    // Make images compatible with static export
    unoptimized: true,
  },
};

export default nextConfig;
