const { DefinePlugin } = require('webpack');
const { readFileSync } = require('fs');
const { join } = require('path');
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
  },
  webpack: (config, { isServer }) => {
    // Replace placeholders in the service worker
    if (!isServer) {
        const env = Object.keys(process.env)
            .filter(key => key.startsWith('NEXT_PUBLIC_'))
            .reduce((acc, key) => {
                acc[key] = process.env[key];
                return acc;
            }, {});

        const serviceWorkerPath = join(__dirname, 'public', 'firebase-messaging-sw.js');
        const serviceWorkerContent = readFileSync(serviceWorkerPath, 'utf-8')
            .replace(/__FIREBASE_API_KEY__/g, env.NEXT_PUBLIC_FIREBASE_API_KEY)
            .replace(/__FIREBASE_AUTH_DOMAIN__/g, env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
            .replace(/__FIREBASE_DATABASE_URL__/g, env.NEXT_PUBLIC_FIREBASE_DATABASE_URL)
            .replace(/__FIREBASE_PROJECT_ID__/g, env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
            .replace(/__FIREBASE_STORAGE_BUCKET__/g, env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
            .replace(/__FIREBASE_MESSAGING_SENDER_ID__/g, env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)
            .replace(/__FIREBASE_APP_ID__/g, env.NEXT_PUBLIC_FIREBASE_APP_ID)
            .replace(/__FIREBASE_MEASUREMENT_ID__/g, env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)


        config.plugins.push(new DefinePlugin({
            'self.__SERVICE_WORKER_CONTENT__': JSON.stringify(serviceWorkerContent),
        }));
    }
    return config;
  },
};

export default nextConfig;
