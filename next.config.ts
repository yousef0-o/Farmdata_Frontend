import type { NextConfig } from 'next'

const apiProxyTarget = process.env.API_PROXY_TARGET

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.12', 'localhost:3000'],

  async rewrites() {
    if (!apiProxyTarget) return []

    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget.replace(/\/$/, '')}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
