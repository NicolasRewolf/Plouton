import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
        pathname: "/media/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/contact", destination: "/honoraires-rendez-vous", permanent: true },
      {
        source: "/rendez-vous-acces-honoraires",
        destination: "/honoraires-rendez-vous",
        permanent: true,
      },
      {
        source: "/defense-penale/trafic-de-stupefiant",
        destination: "/defense-penale/trafic-de-stupefiants",
        permanent: true,
      },
      {
        source: "/indemnisation-des-victimes/accident-de-la-route",
        destination: "/indemnisation-des-victimes/accidents-de-la-route",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
