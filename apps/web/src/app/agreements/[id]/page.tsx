'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  Package, 
  CreditCard, 
  ArrowRight, 
  Clock, 
  FileText,
  AlertCircle,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { carryAmStore } from '../../../lib/store';

export default function AgreementEscrowRoom() {
  const params = useParams();
  const router = useRouter();
  const agreementId = (params?.id as string) || 'agr_001_skincare';

  const agreement = carryAmStore.getAgreement(agreementId) || carryAmStore.getAgreements()[0];
  const pkg = agreement?.package;
  const trip = agreement?.trip;

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(pkg?.status === 'ESCROW_FUNDED' || pkg?.status === 'IN_TRANSIT' || pkg?.status === 'DELIVERED');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'ussd'>('card');

  if (!agreement || !pkg || !trip) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50">
        <Navbar />
        <div className="text-center py-20 text-slate-500 font-bold">Agreement Record Not Found.</div>
      </div>
    );
  }

  const handleFundEscrow = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      const paystackRef = `PAYSTACK_REF_${Date.now()}`;
      carryAmStore.fundEscrow(agreement.id, paystackRef);
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
    }, 1200);
  };

  const totalNaira = agreement.totalSenderChargeKobo / 100;
  const bountyNaira = agreement.agreedBountyKobo / 100;
  const platformFeeNaira = agreement.platformFeeKobo / 100;
  const protectionFeeNaira = agreement.protectionFeeKobo / 100;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <NextLink href="/" className="hover:text-slate-600">Home</NextLink>
              <span>/</span>
              <span>Agreements</span>
              <span>/</span>
              <span className="text-sky-600 font-mono">{agreement.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-sky-600" />
              Delivery Contract & Escrow Room
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>Mutual Agreement: Signed & Accepted</span>
          </div>
        </div>

        {/* Contract Summary Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-amber-300 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Consignment</span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                {pkg.items?.[0]?.title || 'Package Delivery'}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total Bounty</span>
              <div className="text-2xl font-black text-sky-600">
                ₦{bountyNaira.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Contracting Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sender (Client)</span>
              <div className="flex items-center gap-2.5 mt-2">
                <div className="w-10 h-10 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center font-bold text-sky-800 text-xs">
                  AB
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">{pkg.sender?.firstName} {pkg.sender?.lastName}</div>
                  <div className="text-xs text-slate-500">{pkg.sender?.phoneNumber} • Tier 1 Verified</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Carrier (Traveler)</span>
              <div className="flex items-center gap-2.5 mt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-sky-500 border border-amber-400 flex items-center justify-center font-bold text-white text-xs">
                  TA
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1">
                    <span>{trip.carrier?.firstName} {trip.carrier?.lastName}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xs text-slate-500">{trip.carrier?.phoneNumber} • Gold Tier 2 Verified</div>
                </div>
              </div>
            </div>
          </div>

          {/* Agreed Handover Logistics */}
          <div className="space-y-3 bg-sky-50/50 p-4 rounded-xl border border-sky-100 text-xs font-semibold text-slate-700">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-black block">Agreed Departure Pickup:</span>
                <span className="text-slate-900 font-bold">{agreement.pickupLocationDetail}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-black block">Agreed Destination Dropoff:</span>
                <span className="text-slate-900 font-bold">{agreement.dropoffLocationDetail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Escrow Deposit Checkout Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-amber-400 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-sky-600" />
              Agreement-First Escrow Vault (Paystack)
            </h2>
            <span className="text-xs font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-300">
              Zero Upfront Risk
            </span>
          </div>

          {!paymentSuccess ? (
            <div className="space-y-6">
              <p className="text-xs text-slate-600 leading-relaxed">
                Both you and Tunde Adeyemi have mutually confirmed terms. Fund the escrow now to generate your <strong>Handover OTP</strong> and initiate physical pickup. Carrier cannot withdraw until delivery is completed.
              </p>

              {/* Price Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Agreed Traveler Bounty:</span>
                  <span className="font-bold text-slate-900">₦{bountyNaira.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee (18%):</span>
                  <span className="font-bold text-slate-900">₦{platformFeeNaira.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Micro-Guarantee Protection Fee:</span>
                  <span className="font-bold text-slate-900">₦{protectionFeeNaira.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                  <span>Total Escrow Deposit:</span>
                  <span className="text-sky-600">₦{totalNaira.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Select Paystack Rail
                </label>
                <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border transition-all ${
                      paymentMethod === 'card'
                        ? 'border-sky-600 bg-sky-50 text-sky-800 ring-2 ring-sky-200'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Debit Card (Mastercard/Visa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-xl border transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-sky-600 bg-sky-50 text-sky-800 ring-2 ring-sky-200'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    Direct Bank Transfer (NIP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ussd')}
                    className={`p-3 rounded-xl border transition-all ${
                      paymentMethod === 'ussd'
                        ? 'border-sky-600 bg-sky-50 text-sky-800 ring-2 ring-sky-200'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    USSD Rail (*737#, *894#)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFundEscrow}
                disabled={isProcessingPayment}
                className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-black text-base py-4 rounded-xl transition-all shadow-lg shadow-sky-600/25 border-2 border-amber-400 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5 text-amber-300" />
                <span>
                  {isProcessingPayment 
                    ? 'Connecting to Paystack Escrow Rail...' 
                    : `Deposit ₦${totalNaira.toLocaleString()} to Escrow`}
                </span>
              </button>
            </div>
          ) : (
            <div className="p-6 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 space-y-4">
              <div className="flex items-center gap-2 font-black text-base text-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>Escrow Funded! ₦{totalNaira.toLocaleString()} Locked in Vault.</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Your payment has been safely confirmed by Paystack. The booking is locked, and your secret Handover Code has been dispatched.
              </p>

              <NextLink
                href={`/tracking/${agreement.id}`}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-6 py-3.5 rounded-xl transition-all shadow-md"
              >
                <KeyRound className="w-4 h-4 text-emerald-200" />
                <span>Proceed to Live Tracking & OTP Handshake</span>
                <ArrowRight className="w-4 h-4" />
              </NextLink>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
