/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: false,
  // Variables de entorno expuestas al frontend
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://c8l-bot-server.onrender.com',
    NEXT_PUBLIC_APP_NAME: 'C8L Agency',
    NEXT_PUBLIC_APP_VERSION: '21.0.0',
  },
  // Excluir Python del build
  webpack: (config) => {
    config.resolve.extensions = config.resolve.extensions.filter(ext => ext !== '.py')
    return config
  },
}
module.exports = nextConfig
