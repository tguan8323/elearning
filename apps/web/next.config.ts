import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  transpilePackages: [
    '@family-english/contracts',
    '@family-english/design-system',
  ],
}

export default nextConfig
