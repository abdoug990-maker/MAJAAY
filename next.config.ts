import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify gère le déploiement — PAS de "standalone"
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true, // Netlify Functions ne supportent pas l'optimisation d'images
  },
};

export default nextConfig;
