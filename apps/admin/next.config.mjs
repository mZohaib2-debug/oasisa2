/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@oasisa2/api',
    '@oasisa2/commerce',
    '@oasisa2/config',
    '@oasisa2/database',
    '@oasisa2/types',
    '@oasisa2/validation',
  ],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
