const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Custom service worker (InjectManifest mode) instead of the default
  // GenerateSW, so we can add push/notificationclick handlers — see
  // worker/index.js. Its own offlineFallback() call replaces what the
  // `fallbacks.document` option used to do in GenerateSW mode.
  swSrc: "worker/index.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

module.exports = withPWA(nextConfig);
