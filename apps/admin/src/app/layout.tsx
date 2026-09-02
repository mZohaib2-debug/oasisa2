import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'OasisA2 Operations', template: '%s · OasisA2 Ops' },
  description: 'OasisA2 staff operations dashboard.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
