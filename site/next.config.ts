import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Transition : images encore chez Wix tant que l'import ne les a pas rapatriées
    remotePatterns: [{ protocol: "https", hostname: "static.wixstatic.com" }],
  },
};

export default nextConfig;
