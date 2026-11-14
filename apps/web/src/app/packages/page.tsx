'use client';

import React from 'react';
import NextLink from 'next/link';
import { 
  Package, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Camera, 
  DollarSign, 
  Tag
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { carryAmStore } from '../../lib/store';

export default function PackagesMarketplacePage() {
  const packages = carryAmStore.getPackages();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <NextLink href="/" className="hover:text-slate-600">Home</NextLink>
              <span>/</span>
              <span className="text-sky-600">Consignment Board</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">
              Corridor Consignments Waiting for Travelers
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse listed packages along the Lagos ⇄ Ibadan corridor. Pick up an item along your route and earn the bounty upon delivery.
            </p>
          </div>

          <NextLink
            href="/send"
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-3 rounded-xl border border-amber-400 shadow-sm transition-all"
          >
            <Package className="w-4 h-4 text-amber-300" />
            <span>Post a Consignment</span>
          </NextLink>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map((pkg) => {
            const firstItem = pkg.items?.[0];
            const photos = firstItem?.unsealedPhotoUrls || [];
            return (
              <div 
                key={pkg.id}
                className="bg-white rounded-2xl p-6 border-2 border-amber-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                      {pkg.category}
                    </span>
                    <span className="text-xs font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Status: {pkg.status}
                    </span>
                  </div>

                  {/* Title & Sender */}
                  <h3 className="text-base font-black text-slate-900 mb-1">
                    {firstItem?.title || 'Consignment Package'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <span>Sender: <strong>{pkg.sender?.firstName} {pkg.sender?.lastName}</strong></span>
                    <span>•</span>
                    <span>⭐ {pkg.sender?.trustScore}</span>
                  </div>

                  {/* Inspection Photos Preview */}
                  {photos.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
                        <Camera className="w-3.5 h-3.5 text-sky-600" />
                        Unsealed Inspection Proof ({photos.length} photos)
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.slice(0, 3).map((url, idx) => (
                          <div key={idx} className="rounded-lg overflow-hidden border border-slate-200 aspect-video">
                            <img src={url} alt={`Inspection ${idx+1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Route & Weight */}
                  <div className="space-y-2 text-xs font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500">🟢</span>
                      <span>From: {pkg.originName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">🔴</span>
                      <span>To: {pkg.destinationName}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-500 font-normal">
                      <span>Weight: <strong className="text-slate-900">{pkg.totalWeightKg} KG</strong></span>
                      <span>Declared Value: <strong className="text-slate-900">₦{(pkg.declaredValueKobo / 100).toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bounty & Agreement Link */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Carrier Bounty</span>
                    <span className="text-xl font-black text-sky-600">
                      ₦{(pkg.offeredBountyKobo / 100).toLocaleString()}
                    </span>
                  </div>

                  <NextLink
                    href={`/agreements/agr_001_skincare`}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm shadow-sky-600/20 border border-amber-400 flex items-center gap-1.5"
                  >
                    <span>Accept Consignment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </NextLink>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
