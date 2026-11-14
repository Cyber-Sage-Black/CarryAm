'use client';

import React from 'react';
import NextLink from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

/**
 * Global error boundary for the entire app.
 * Catches unhandled errors in route segments and displays a branded fallback.
 */
export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border-2 border-amber-300 shadow-lg text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                An unexpected error occurred. Our team has been notified.
                Please try again or return to the home page.
              </p>
              {error.digest && (
                <p className="text-xs text-slate-400 font-mono mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={reset}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-sm border border-amber-400 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-amber-300" />
                <span>Try Again</span>
              </button>

              <NextLink
                href="/"
                className="bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm px-5 py-3 rounded-xl border-2 border-slate-200 transition-all flex items-center gap-2"
              >
                <Home className="w-4 h-4 text-sky-600" />
                <span>Home</span>
              </NextLink>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
