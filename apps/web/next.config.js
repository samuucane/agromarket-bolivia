/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverActions: { allowedOrigins: ['localhost:3001', 'agromarket.bo'] } },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'agromarket-files.nyc3.digitaloceanspaces.com' },
      { protocol: 'http', hostname: 'minio' },
      { protocol: 'https', hostname: 'openweathermap.org' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
};

module.exports = nextConfig;
