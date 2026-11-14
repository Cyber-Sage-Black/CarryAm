'use client';

import React from 'react';
import NextLink from 'next/link';
import { 
  Car, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Search,
  Filter,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { carryAmStore } from '../../lib/store';

export default function TripsPage() {
  const trips = carryAmStore.getTrips();

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
              <span className="text-sky-600">Corridor Trips</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900">
              Verified Travelers on Corridor
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse travelers heading from Lagos to Ibadan today with spare luggage capacity.
            </p>
          </div>

          <NextLink
            href="/travel"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs px-4 py-3 rounded-xl border-2 border-slate-200 shadow-sm hover:border-amber-400 transition-all"
          >
            <Car className="w-4 h-4 text-sky-600" />
            <span>Post Your Own Trip</span>
          </NextLink>
        </div>

        {/* Trips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.map((trip) => (
            <div 
              key={trip.id}
              className="bg-white rounded-2xl p-6 border-2 border-amber-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Traveler Profile Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 to-sky-500 text-white font-black text-base flex items-center justify-center border-2 border-amber-300 shadow-sm">
                      {trip.carrier?.firstName.charAt(0)}{trip.carrier?.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-base text-slate-900">
                          {trip.carrier?.firstName} {trip.carrier?.lastName}
                        </span>
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {trip.carrier?.kycTier}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-semibold mt-0.5">
                        ⭐ {trip.carrier?.trustScore} • {trip.carrier?.completedDeliveriesCount} Completed Deliveries
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full border border-sky-200">
                    {trip.travelMode.replace('_', ' ')}
                  </span>
                </div>

                {/* Route Details */}
                <div className="space-y-2 text-xs font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">🟢</span>
                    <span className="text-slate-900">{trip.originName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">🔴</span>
                    <span className="text-slate-900">{trip.destinationName}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-500 font-normal">
                    <span>Vehicle: <strong>{trip.vehicleRegistration}</strong></span>
                    <span>Departs: <strong className="text-sky-700">{trip.departureTime}</strong></span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Boot Space</span>
                  <span className="text-base font-black text-slate-900">{trip.availableCapacityKg} KG Available</span>
                </div>
                <NextLink
                  href={`/send?preferredTripId=${trip.id}`}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm shadow-sky-600/20 border border-amber-400 flex items-center gap-1.5"
                >
                  <span>Request to Carry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NextLink>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
