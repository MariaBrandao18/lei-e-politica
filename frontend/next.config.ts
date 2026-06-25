import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Fixa a raiz de tracing neste diretório (evita warning de múltiplos lockfiles no deploy)
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.camara.leg.br',
      },
    ],
  },
}

export default nextConfig
