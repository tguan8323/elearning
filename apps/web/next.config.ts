import type { NextConfig } from 'next'

const apiUrl = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001/api'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/:path*` }]
  },
  transpilePackages: [
    '@family-english/contracts',
    '@family-english/design-system',
  ],
}

export default nextConfig
