/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'jsonwebtoken', 'multer'],
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
}

export default nextConfig
