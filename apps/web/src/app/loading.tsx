import React from 'react';

/**
 * Global loading state — shown during route transitions.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-500 flex items-center justify-center text-white font-black text-xl mx-auto border border-amber-400 animate-pulse shadow-lg shadow-sky-600/20">
          CA
        </div>
        <div className="space-y-2">
          <div className="h-2 w-32 bg-sky-200 rounded-full mx-auto animate-pulse" />
          <p className="text-xs font-bold text-slate-400">Loading CarryAm...</p>
        </div>
      </div>
    </div>
  );
}
