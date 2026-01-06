// FILE: app/layout.js
// ============================================
import './globals.css';

export const metadata = {
  title: 'Training Tracker',
  description: 'Employee Training Management System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}