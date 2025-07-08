/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['storage.googleapis.com'], // Allow images from Google Cloud Storage domains
  },
  env: {
    // Make environment variables available to the client
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID: process.env.STRIPE_STARTER_PRICE_ID,
    NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
  },
  // Configure webpack to handle worker files
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  // Ensure service worker can be properly served
  async headers() {
    return [
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 