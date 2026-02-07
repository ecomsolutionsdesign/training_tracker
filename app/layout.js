// app/layout.js
import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Training Tracker',
  description: 'KTEX Employee Training Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}