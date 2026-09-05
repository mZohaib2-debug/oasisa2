import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(__dirname, '../..');

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
  // Monorepo: Prisma's query engine binary lives in packages/database's
  // node_modules, outside this app. Without this, Next's serverless bundler
  // doesn't discover it and every DB call fails at runtime with
  // "could not locate the Query Engine for runtime ...".
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    '**': ['../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*'],
  },
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
