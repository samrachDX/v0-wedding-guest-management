/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["mongoose", "bcryptjs", "exceljs"],
}

export default nextConfig
