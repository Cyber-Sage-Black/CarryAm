import NextLink from 'next/link';
import { Package, Home, Search } from 'lucide-react';

/**
 * Custom 404 page with CarryAm branding.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-500 flex items-center justify-center text-white font-black text-2xl mx-auto border-2 border-amber-400 shadow-lg shadow-sky-600/20">
          CA
        </div>

        <div>
          <h1 className="text-6xl font-black text-slate-200 mb-2">404</h1>
          <h2 className="text-xl font-black text-slate-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            This route doesn&apos;t exist on the CarryAm corridor.
            The package you&apos;re looking for may have been delivered already.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <NextLink
            href="/"
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-sm border border-amber-400 flex items-center gap-2"
          >
            <Home className="w-4 h-4 text-amber-300" />
            <span>Go Home</span>
          </NextLink>

          <NextLink
            href="/trips"
            className="bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm px-5 py-3 rounded-xl border-2 border-slate-200 transition-all flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-sky-600" />
            <span>Browse Trips</span>
          </NextLink>
        </div>
      </div>
    </div>
  );
}
