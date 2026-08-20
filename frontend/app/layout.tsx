import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Application Processing System',
  description: 'track your application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
