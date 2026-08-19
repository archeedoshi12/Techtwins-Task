import './globals.css';

export const metadata = {
  title: 'Application Processing System',
  description: 'Submit and track your application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
