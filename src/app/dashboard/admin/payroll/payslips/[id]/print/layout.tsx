import type React from 'react';
import '@/app/globals.css';

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
        <head>
            <title>Print Payslip</title>
        </head>
      <body className="bg-white">
        {children}
      </body>
    </html>
  );
}
