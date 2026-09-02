import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-4xl font-black text-forest-700">404</p>
        <p className="mt-1 text-ink-600">That page doesn&apos;t exist.</p>
        <Link href="/" className="btn-primary mt-3">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
