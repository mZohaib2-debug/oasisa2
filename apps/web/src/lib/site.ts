/**
 * Canonical public URL of the storefront.
 * Priority: explicit env → Vercel production domain → Vercel per-deploy URL → localhost.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return stripSlash(process.env.NEXT_PUBLIC_SITE_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

function stripSlash(u: string): string {
  return u.replace(/\/+$/, '');
}
