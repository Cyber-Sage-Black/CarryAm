'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { 
  Package, 
  Car, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  QrCode, 
  Smartphone, 
  Sparkles,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  ShieldAlert,
  Search
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { CorridorVisualizer } from '../components/CorridorVisualizer';
import { carryAmStore } from '../lib/store';
import { calculateDeliveryPricing } from '@carryam/shared';

export default function HomePage() {
  const [origin, setOrigin] = useState('Berger, Lagos');
  const [destination, setDestination] = useState('Iwo Road, Ibadan');
  const [weightKg, setWeightKg] = useState(2.0);
  const [bountyNaira, setBountyNaira] = useState(2500);

  const trips = carryAmStore.getTrips();
  const packages = carryAmStore.getPackages();

  const pricing = calculateDeliveryPricing(bountyNaira * 100, 2500000);
  const traditionalCourierEstimate = 7500;
  const savingsNaira = traditionalCourierEstimate - pricing.totalSenderChargeNaira;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      <Navbar />

      {/* Corridor Live Metrics Ticker */}
      <div className="bg-sky-900 text-white py-2 px-4 border-b border-amber-400/40 text-xs font-semibold overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-amber-300 font-bold uppercase tracking-wider">Corridor Status:</span>
            <span>Lagos (Berger) ⇄ Ibadan (Iwo Road) — Operating at Full Capacity</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[11px] text-sky-200">
            <span><strong>24</strong> Verified Carriers Active Today</span>
            <span>•</span>
            <span>Avg. Transit: <strong>2 Hours 15 Mins</strong></span>
            <span>•</span>
            <span className="text-amber-300 font-bold">100% Escrow Protected</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full space-y-12">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold shadow-sm">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>Next-Generation Nigerian Intercity Logistics</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Send parcels with <span className="text-sky-600 underline decoration-amber-400 decoration-4">verified travelers</span> heading your way.
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
              Turn everyday intercity commuters and drivers into instant couriers. Same-day package delivery at <strong>60% lower cost</strong> than traditional dispatch, with bank-grade escrow and physical security seals.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <NextLink
                href="/send"
                className="bg-sky-600 hover:bg-sky-700 text-white font-black text-sm px-6 py-4 rounded-xl transition-all shadow-lg shadow-sky-600/25 border-2 border-amber-400 flex items-center gap-2 hover:-translate-y-0.5"
              >
                <Package className="w-4 h-4 text-amber-300" />
                <span>Send a Package Now</span>
                <ArrowRight className="w-4 h-4" />
              </NextLink>

              <NextLink
                href="/travel"
                className="bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-sm px-6 py-4 rounded-xl transition-all border-2 border-slate-200 shadow-sm flex items-center gap-2 hover:border-amber-400"
              >
                <Car className="w-4 h-4 text-sky-600" />
                <span>I Am Traveling (Earn ₦15k+ Daily)</span>
              </NextLink>
            </div>
          </div>

          {/* Right Hero Card: Instant Savings & Route Calculator */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-xl shadow-sky-900/5 relative">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                    Live Rate Calculator
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">
                    Lagos ⇄ Ibadan Corridor
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 line-through">
                    ₦{traditionalCourierEstimate.toLocaleString()}
                  </span>
                  <div className="text-2xl font-black text-emerald-600">
                    ₦{pricing.totalSenderChargeNaira.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Calculator Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="absolute right-3 top-3 text-[11px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                      Lagos
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    Delivery Destination
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="absolute right-3 top-3 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      Ibadan
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="30"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      Carrier Bounty (₦)
                    </label>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      value={bountyNaira}
                      onChange={(e) => setBountyNaira(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Savings Pill */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Your Instant Savings:</span>
                  </span>
                  <span className="font-black text-emerald-700 text-sm">
                    ₦{savingsNaira.toLocaleString()} (~61%)
                  </span>
                </div>

                <NextLink
                  href="/send"
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black text-sm py-3.5 rounded-xl transition-all shadow-md shadow-sky-600/20 border border-amber-400 flex items-center justify-center gap-2 mt-4"
                >
                  <span>Dispatch Package on Corridor</span>
                  <ArrowRight className="w-4 h-4" />
                </NextLink>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Corridor Progress Banner */}
        <CorridorVisualizer />

        {/* Section: Live Available Trips on the Corridor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                Real-Time Corridor Feed
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                Verified Travelers Leaving Today
              </h2>
            </div>
            <NextLink href="/trips" className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1">
              <span>View All 24 Trips</span>
              <ChevronRight className="w-4 h-4" />
            </NextLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-2xl p-6 border-2 border-amber-300/80 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-sky-100 border border-amber-400 flex items-center justify-center text-sky-800 font-black text-base">
                        {trip.carrier?.firstName.charAt(0)}{trip.carrier?.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-base text-slate-900">
                            {trip.carrier?.firstName} {trip.carrier?.lastName}
                          </span>
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {trip.carrier?.kycTier}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-semibold">
                          ⭐ {trip.carrier?.trustScore} ({trip.carrier?.completedDeliveriesCount} deliveries)
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full border border-sky-200">
                      {trip.travelMode.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-bold text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500">🟢</span>
                      <span>From: {trip.originName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">🔴</span>
                      <span>To: {trip.destinationName}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-500 font-normal">
                      <span>Vehicle: <strong>{trip.vehicleRegistration}</strong></span>
                      <span>Departure: <strong className="text-sky-700">{trip.departureTime}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Available Space</span>
                    <div className="text-sm font-black text-slate-900">{trip.availableCapacityKg} KG Left</div>
                  </div>
                  <NextLink
                    href={`/send?preferredTripId=${trip.id}`}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-sky-600/20 border border-amber-400"
                  >
                    Request Delivery
                  </NextLink>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust & Safety Moat (Why CarryAm Works) */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-amber-300 shadow-md">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-300">
              Zero-Trust Architecture
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-3">
              How CarryAm Guarantees Complete Safety
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              We eliminated the risks of the informal motor park waybill system with bank-grade biometric trust and physical tamper seals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-amber-400 transition-all">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4 border border-sky-300">
                <ShieldCheck className="w-6 h-6 text-sky-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 mb-2">1. Biometric NIN & BVN</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every carrier and sender is verified via Nigerian National Identity Number (NIN) and live facial matching.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-amber-400 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 border border-amber-300">
                <QrCode className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 mb-2">2. Inspect & Seal</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Carriers never carry pre-sealed boxes. Mandatory 3-photo open-box checks and serialized security tape at hubs.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-amber-400 transition-all">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4 border border-sky-300">
                <Lock className="w-6 h-6 text-sky-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 mb-2">3. Agreement Escrow</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Payment is triggered only after mutual agreement. Funds stay locked in Paystack vault until confirmed delivery.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-amber-400 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-300">
                <Smartphone className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="font-extrabold text-slate-900 mb-2">4. Dual-OTP Handshake</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Handover OTP releases package for transit. Recipient Delivery OTP releases funds directly to carrier wallet.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-sky-100 bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-black text-sm flex items-center justify-center border border-amber-400">
              CA
            </div>
            <span className="font-black text-slate-900 text-sm">CarryAm Technologies Nigeria Ltd</span>
            <span>• Lagos ⇄ Ibadan Corridor Express</span>
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <NextLink href="/send" className="hover:text-slate-900">Send Package</NextLink>
            <NextLink href="/trips" className="hover:text-slate-900">Available Trips</NextLink>
            <NextLink href="/travel" className="hover:text-slate-900">Carrier Portal</NextLink>
            <NextLink href="/dashboard" className="hover:text-slate-900">Wallet & KYC</NextLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
