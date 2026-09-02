import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-5xl font-black text-forest-700">404</p>
      <h1 className="mt-2 text-xl font-bold text-charcoal-900">We couldn&apos;t find that page</h1>
      <p className="mt-1 text-sm text-charcoal-700/70">
        The item may be out of stock or the link may be old.
      </p>
      <Link href="/" className="btn-primary mt-4">
        Back to home
      </Link>
    </div>
  );
}
