import type { Metadata } from 'next';
import Link from 'next/link';
import { ScanLine } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: 'CardScanner — TCG Price Tracker',
  description: 'Scan and track TCG card prices for Magic, Pokémon, and Yu-Gi-Oh!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy antialiased">
        <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sky-400 font-bold text-lg">
              <ScanLine className="w-6 h-6" />
              CardScanner
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="px-4 py-2 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
              >
                Scanner
              </Link>
              <Link
                href="/search"
                className="px-4 py-2 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
              >
                Search
              </Link>
              <Link
                href="/collection"
                className="px-4 py-2 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
              >
                Collection
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
