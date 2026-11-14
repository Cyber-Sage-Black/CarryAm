'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { 
  Car, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  PlusCircle, 
  CheckCircle2, 
  Fuel, 
  Coins,
  Truck
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { carryAmStore } from '../../lib/store';
import { TravelMode } from '@carryam/shared';

export default function TravelPlannerPage() {
  const router = useRouter();

  // Form State
  const [originName, setOriginName] = useState('TotalEnergies Station, Berger, Lagos');
  const [destinationName, setDestinationName] = useState('Iwo Road Interchange, Ibadan');
  const [departureTime, setDepartureTime] = useState('Today at 3:00 PM');
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState('Today at 5:30 PM');
  const [travelMode, setTravelMode] = useState<TravelMode>('PRIVATE_CAR');
  const [vehicleRegistration, setVehicleRegistration] = useState('Toyota Corolla (KJA-492-AA)');
  const [maxCapacityKg, setMaxCapacityKg] = useState(25.0);
  const [pricePerKgNaira, setPricePerKgNaira] = useState(1200);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      carryAmStore.createTrip({
        carrierId: 'usr_tunde',
        originName,
        originCoordinates: { lat: 6.6433, lng: 3.3742 },
        destinationName,
        destinationCoordinates: { lat: 7.4019, lng: 3.9398 },
        departureTime,
        estimatedArrivalTime,
        travelMode,
        vehicleRegistration,
        maxCapacityKg: Number(maxCapacityKg),
        pricePerKgKobo: pricePerKgNaira * 100,
      });

      router.push('/packages');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2">
            <NextLink href="/" className="hover:text-slate-600">Home</NextLink>
            <span>/</span>
            <span className="text-sky-600">Carrier Portal</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">
            Schedule Intercity Trip & Monetize Boot Space
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Heading to Ibadan from Lagos? Carry 2–4 verified packages along your route and earn ₦10,000 – ₦25,000 per trip safely.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-amber-300 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Car className="w-5 h-5 text-sky-600" />
              1. Vehicle & Route Trajectory
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Travel Mode
                </label>
                <select
                  value={travelMode}
                  onChange={(e) => setTravelMode(e.target.value as TravelMode)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="PRIVATE_CAR">Private Car / Sedan</option>
                  <option value="COMMERCIAL_BUS">Commercial Interstate Bus</option>
                  <option value="TRAIN">NRC Standard Gauge Railway</option>
                  <option value="MOTORCYCLE">Express Courier Bike</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Vehicle Registration / Model
                </label>
                <input
                  type="text"
                  required
                  value={vehicleRegistration}
                  onChange={(e) => setVehicleRegistration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. Toyota Corolla (KJA-492-AA)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Departure Point (Lagos)
                </label>
                <input
                  type="text"
                  required
                  value={originName}
                  onChange={(e) => setOriginName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Arrival Point (Ibadan)
                </label>
                <input
                  type="text"
                  required
                  value={destinationName}
                  onChange={(e) => setDestinationName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  Departure Time
                </label>
                <input
                  type="text"
                  required
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  Estimated Arrival Time
                </label>
                <input
                  type="text"
                  required
                  value={estimatedArrivalTime}
                  onChange={(e) => setEstimatedArrivalTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Capacity & Target Earnings */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-amber-300 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Coins className="w-5 h-5 text-sky-600" />
              2. Available Space & Pricing Guidance
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Available Weight Capacity (kg)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  required
                  value={maxCapacityKg}
                  onChange={(e) => setMaxCapacityKg(Number(e.target.value))}
                  className="w-full bg-slate-50 border-2 border-sky-500 rounded-xl px-4 py-3 text-lg font-black text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Average passenger car trunk has 25kg – 40kg of clean spare capacity.
                </p>
              </div>

              <div className="bg-sky-50 rounded-xl p-5 border border-sky-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-800">
                  Estimated Trip Earnings
                </span>
                <div className="text-2xl font-black text-sky-700 mt-1">
                  ₦{(maxCapacityKg * pricePerKgNaira).toLocaleString()}
                </div>
                <p className="text-xs text-sky-900 mt-1">
                  Offset 100% of your petrol costs for the Lagos ⇄ Ibadan return journey!
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black text-base py-4 rounded-xl transition-all shadow-lg shadow-sky-600/25 border-2 border-amber-400 flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              <span>{isSubmitting ? 'Registering Route...' : 'Publish Trip & Browse Consignments'}</span>
              <ArrowRight className="w-5 h-5 text-amber-300" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
