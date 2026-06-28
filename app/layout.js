import './globals.css';

export const metadata = {
  title: 'Mein Query Dashboard',
  description: 'Sales query performance dashboard for Mein team',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
