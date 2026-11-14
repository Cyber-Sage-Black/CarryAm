'use client';

import React from 'react';
import NextLink from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

/**
 * Route-level error boundary.
 * Shows a branded error fallback for individual page errors.
 */
export default function Error({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border-2 border-amber-300 shadow-lg text-center space-y-6">
          <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Page Error
            </h2>
            <p className="text-sm text-slate-500">
              This page encountered an error. Please try again.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm border border-amber-400 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span>Try Again</span>
            </button>
            <NextLink
              href="/"
              className="bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl border-2 border-slate-200 transition-all flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-sky-600" />
              <span>Home</span>
            </NextLink>
          </div>
        </div>
      </div>
    </div>
  );
}
