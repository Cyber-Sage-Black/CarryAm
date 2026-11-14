'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  KeyRound, 
  QrCode, 
  Smartphone, 
  Clock, 
  AlertCircle,
  RotateCcw,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { CorridorVisualizer } from '../../../components/CorridorVisualizer';
import { carryAmStore } from '../../../lib/store';

export default function TrackingHandshakePage() {
  const params = useParams();
  const agreementId = (params?.id as string) || 'agr_001_skincare';

  const agreement = carryAmStore.getAgreement(agreementId) || carryAmStore.getAgreements()[0];
  const pkg = agreement?.package;
  const trip = agreement?.trip;
  const handover = carryAmStore.getHandover(agreementId);

  const [handoverOtpInput, setHandoverOtpInput] = useState('');
  const [deliveryOtpInput, setDeliveryOtpInput] = useState('');
  const [sealSerial, setSealSerial] = useState(handover?.sealSerialNumber || 'CAM-SEAL-2026-9921');
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!agreement || !pkg || !trip || !handover) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50">
        <Navbar />
        <div className="text-center py-20 text-slate-500 font-bold">Consignment Not Found.</div>
      </div>
    );
  }

  // Handover submission
  const handleVerifyHandover = () => {
    const success = carryAmStore.verifyHandover(agreement.id, handoverOtpInput, sealSerial);
    if (!success) {
      setErrorMessage(`Invalid Handover OTP. For testing, use the secret sender code: ${handover.handoverOtp}`);
      return;
    }
    setErrorMessage('');
    setRefreshKey(k => k + 1);
  };

  // Delivery submission
  const handleVerifyDelivery = () => {
    const success = carryAmStore.verifyDelivery(agreement.id, deliveryOtpInput);
    if (!success) {
      setErrorMessage(`Invalid Delivery OTP. For testing, use the secret receiver code: ${handover.deliveryOtp}`);
      return;
    }
    setErrorMessage('');
    setRefreshKey(k => k + 1);
  };

  const currentStatus = pkg.status;
  const bountyNaira = agreement.agreedBountyKobo / 100;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <NextLink href="/" className="hover:text-slate-600">Home</NextLink>
              <span>/</span>
              <span>Tracking</span>
              <span>/</span>
              <span className="text-sky-600 font-mono">{agreement.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-7 h-7 text-sky-600" />
              Live Waybill Tracking & Handshake Console
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
              currentStatus === 'DELIVERED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : currentStatus === 'IN_TRANSIT'
                ? 'bg-sky-50 text-sky-800 border-sky-300 animate-pulse'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              Status: {currentStatus.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Visual Route Corridor Progress */}
        <CorridorVisualizer 
          currentStage={currentStatus === 'DELIVERED' ? 'DELIVERED' : currentStatus === 'IN_TRANSIT' ? 'IN_TRANSIT' : 'SCHEDULED'}
          pickupName={agreement.pickupLocationDetail}
          dropoffName={agreement.dropoffLocationDetail}
        />

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border-2 border-red-300 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Protocol Execution Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-amber-400 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-sky-600" />
              Cryptographic Dual-OTP Protocol
            </h2>
            <span className="text-xs font-bold text-slate-500">
              Escrow Bounty: <strong className="text-emerald-600 font-black">₦{bountyNaira.toLocaleString()}</strong>
            </span>
          </div>

          {/* Step 1: Handover at Departure (Lagos) */}
          {(currentStatus === 'AGREED' || currentStatus === 'ESCROW_FUNDED') && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-2 text-xs text-sky-950">
                <div className="flex items-center gap-2 font-black text-sm text-sky-900">
                  <QrCode className="w-4 h-4 text-sky-600" />
                  <span>Step 1: Physical Pickup Handover at Departure (Berger)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  The traveler inspects open package contents, applies the CarryAm security seal tape, and requests the 4-digit Handover Code from the sender.
                </p>
                <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-300 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-amber-900 font-sans text-[11px] font-bold block">
                      🔒 Test Mode Sandbox Handover Code
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">
                      (In live production, sent via Termii SMS to sender {agreement.senderId})
                    </span>
                  </div>
                  <span className="text-lg font-black text-sky-800 bg-white px-3 py-1 rounded border border-amber-300 shadow-inner">
                    {handover.handoverOtp}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                    Security Seal Serial Number
                  </label>
                  <input
                    type="text"
                    value={sealSerial}
                    onChange={(e) => setSealSerial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                    Enter 4-Digit Handover OTP
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={handoverOtpInput}
                    onChange={(e) => setHandoverOtpInput(e.target.value)}
                    placeholder={`e.g. ${handover.handoverOtp}`}
                    className="w-full bg-slate-50 border-2 border-sky-500 rounded-xl px-4 py-3 text-lg font-mono font-black text-center tracking-widest text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleVerifyHandover}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black text-base py-3.5 rounded-xl transition-all shadow-md shadow-sky-600/20 border-2 border-amber-400 flex items-center justify-center gap-2"
              >
                <span>Verify Handover & Start Corridor Transit</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          )}

          {/* Step 2: In-Transit to Ibadan */}
          {currentStatus === 'IN_TRANSIT' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 border border-sky-300 rounded-xl space-y-2 text-xs text-sky-950">
                <div className="flex items-center gap-2 font-black text-sm text-sky-900">
                  <Truck className="w-5 h-5 text-sky-600 animate-bounce" />
                  <span>Package is Currently In Transit Along the Expressway</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Security Seal <strong>#{sealSerial}</strong> is locked. When the traveler arrives at the destination in Ibadan, the recipient ({pkg.receiverName}) verifies the seal and provides the Delivery OTP.
                </p>
                <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-300 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-amber-900 font-sans text-[11px] font-bold block">
                      🔒 Test Mode Sandbox Delivery Code
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">
                      (In live production, sent via Termii SMS to recipient {pkg.receiverPhone})
                    </span>
                  </div>
                  <span className="text-lg font-black text-sky-800 bg-white px-3 py-1 rounded border border-amber-300 shadow-inner">
                    {handover.deliveryOtp}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
                  Enter 4-Digit Delivery OTP (from Recipient)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={deliveryOtpInput}
                  onChange={(e) => setDeliveryOtpInput(e.target.value)}
                  placeholder={`e.g. ${handover.deliveryOtp}`}
                  className="w-full bg-slate-50 border-2 border-emerald-500 rounded-xl px-4 py-3 text-lg font-mono font-black text-center tracking-widest text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleVerifyDelivery}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base py-3.5 rounded-xl transition-all shadow-md border-2 border-amber-400 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-amber-300" />
                <span>Confirm Delivery & Release Escrow Payout</span>
              </button>
            </div>
          )}

          {/* Step 3: Delivered & Settled */}
          {currentStatus === 'DELIVERED' && (
            <div className="p-6 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 space-y-4">
              <div className="flex items-center gap-2 font-black text-lg text-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span>Consignment Successfully Delivered & Settled!</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Tamper Seal <strong>#{sealSerial}</strong> was verified intact by Mrs. Funke Adeleke at Bodija Market, Ibadan. The escrow has automatically credited <strong>₦{bountyNaira.toLocaleString()}</strong> to Tunde Adeyemi's wallet!
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <NextLink
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-3 rounded-xl transition-all shadow-sm"
                >
                  <Wallet className="w-4 h-4 text-emerald-200" />
                  <span>View Updated Wallet Balance</span>
                </NextLink>

                <button
                  type="button"
                  onClick={() => {
                    pkg.status = 'ESCROW_FUNDED';
                    setHandoverOtpInput('');
                    setDeliveryOtpInput('');
                    setRefreshKey(k => k + 1);
                  }}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo Handshake</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
