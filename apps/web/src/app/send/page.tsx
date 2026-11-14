'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { 
  Package, 
  MapPin, 
  Camera, 
  UploadCloud, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle,
  User,
  Phone,
  DollarSign
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { carryAmStore } from '../../lib/store';
import { calculateDeliveryPricing, PackageCategory } from '@carryam/shared';

export default function SendPackagePage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('Bespoke Organic Glow Skincare Lotions (Pack of 3)');
  const [category, setCategory] = useState<PackageCategory>('COSMETICS');
  const [weightKg, setWeightKg] = useState(2.0);
  const [declaredValueNaira, setDeclaredValueNaira] = useState(25000);
  const [bountyNaira, setBountyNaira] = useState(3000);
  const [isFragile, setIsFragile] = useState(true);
  
  // Route
  const [originName, setOriginName] = useState('Magodo Phase 2 Main Gate, Lagos');
  const [destinationName, setDestinationName] = useState('Bodija Market Extension, Ibadan');
  
  // Recipient
  const [receiverName, setReceiverName] = useState('Mrs. Funke Adeleke');
  const [receiverPhone, setReceiverPhone] = useState('+2348055554444');

  // Inspection Photos (Mandatory 3)
  const [photoUrls, setPhotoUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&auto=format&fit=crop&q=80',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Financial breakdown
  const pricing = calculateDeliveryPricing(bountyNaira * 100, declaredValueNaira * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newPackage = carryAmStore.createPackage({
        senderId: 'usr_amina',
        receiverName,
        receiverPhone,
        originName,
        originCoordinates: { lat: 6.6180, lng: 3.3850 },
        destinationName,
        destinationCoordinates: { lat: 7.4325, lng: 3.9056 },
        totalWeightKg: Number(weightKg),
        category,
        declaredValueKobo: declaredValueNaira * 100,
        offeredBountyKobo: bountyNaira * 100,
        pickupWindowStart: 'Today 12:00 PM',
        pickupWindowEnd: 'Today 3:00 PM',
        items: [
          {
            id: `item_${Date.now()}`,
            title,
            quantity: 3,
            itemValueKobo: declaredValueNaira * 100,
            isFragile,
            isPerishable: false,
            unsealedPhotoUrls: photoUrls,
          },
        ],
      });

      // Also create auto-agreement with first available trip for instant interactive demonstration
      const firstTrip = carryAmStore.getTrips()[0];
      if (firstTrip) {
        const agreement = carryAmStore.createAgreement({
          packageId: newPackage.id,
          tripId: firstTrip.id,
          senderId: 'usr_amina',
          carrierId: firstTrip.carrierId,
          bountyNaira,
          pickupLocation: originName,
          dropoffLocation: destinationName,
        });

        // Redirect directly to the Agreement room
        router.push(`/agreements/${agreement.id}`);
      } else {
        router.push('/packages');
      }
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
            <span className="text-sky-600">Dispatch Package</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">
            Dispatch Package Along Corridor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill in your package specs. Verified travelers on the Lagos ⇄ Ibadan expressway will review and accept your delivery bounty.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Item Specs & Category */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-amber-300/80 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Package className="w-5 h-5 text-sky-600" />
              1. Package Specifications
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Item Description / Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. Bespoke Skincare Jars / Aso-Oke Fabrics / Laptop"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PackageCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="COSMETICS">Cosmetics & Beauty</option>
                    <option value="FASHION">Fashion & Apparel</option>
                    <option value="DOCUMENTS">Official Documents</option>
                    <option value="ELECTRONICS">Electronics & Gadgets</option>
                    <option value="GENERAL">General Goods</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="30"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                    Declared Value (₦)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    required
                    value={declaredValueNaira}
                    onChange={(e) => setDeclaredValueNaira(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFragile}
                    onChange={(e) => setIsFragile(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-700">Fragile Consignment (Handle with Care)</span>
                </label>
              </div>
            </div>

            {/* Anti-Contraband Inspection Photos */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-sky-600" />
                    Mandatory Anti-Contraband Inspection Photos
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Boxes must be open. Take photos showing inside contents clearly to reassure the traveler.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                  {photoUrls.length} of 3 Captured
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                {photoUrls.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video group">
                    <img src={url} alt={`Inspection ${i+1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 text-[9px] font-black bg-slate-900/80 text-white px-1.5 py-0.5 rounded">
                      View {i+1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Origin, Destination & Recipient */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-amber-300/80 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-sky-600" />
              2. Corridor Route & Recipient Contact
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Pickup Hub (Lagos Corridor)
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
                  Destination Hub (Ibadan Corridor)
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
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  Receiver Full Name
                </label>
                <input
                  type="text"
                  required
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-sky-600" />
                  Receiver Phone (For SMS Delivery OTP)
                </label>
                <input
                  type="text"
                  required
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Delivery Bounty & Agreement-First Escrow Breakdown */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-amber-300 shadow-md space-y-6">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="w-5 h-5 text-sky-600" />
              3. Delivery Bounty & Agreement-First Escrow
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Offer Carrier Bounty (₦)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    required
                    value={bountyNaira}
                    onChange={(e) => setBountyNaira(Number(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-sky-500 rounded-xl px-4 py-3 text-lg font-black text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">
                    Direct to Traveler
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Recommended rate for 2.5kg Lagos ⇄ Ibadan: ₦2,500 – ₦3,500.
                </p>
              </div>

              {/* Escrow Transparent Breakdown */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Carrier Net Bounty:</span>
                  <span className="font-bold text-slate-900">₦{pricing.carrierBountyNaira.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Commission (18%):</span>
                  <span className="font-bold text-slate-900">₦{(pricing.platformFeeKobo / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Micro-Guarantee Protection Fee:</span>
                  <span className="font-bold text-slate-900">₦{(pricing.protectionFeeKobo / 100).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span>Total Escrow Deposit:</span>
                  <span className="text-sky-600 font-black">₦{pricing.totalSenderChargeNaira.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Agreement-First Rule:</strong> No payment is charged right now! You will only be prompted to fund the escrow after a verified traveler accepts your consignment.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black text-base py-4 rounded-xl transition-all shadow-lg shadow-sky-600/25 border-2 border-amber-400 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Posting Consignment...' : 'Dispatch Package to Corridor'}</span>
              <ArrowRight className="w-5 h-5 text-amber-300" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
