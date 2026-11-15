'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Phone, ShieldCheck, KeyRound, X, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onAuthenticated?: () => void;
}

export function AuthModal({ isOpen, onClose, onAuthenticated }: AuthModalProps) {
  const { signInWithPhone, verifyOtp } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Format full Nigerian number (+234...)
  const getFormattedPhone = () => {
    const raw = phoneNumber.trim().replace(/^0+/, '').replace(/\D/g, '');
    return `+234${raw}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formatted = getFormattedPhone();
    if (!/^\+234\d{10}$/.test(formatted)) {
      setErrorMessage('Please enter a valid 10-digit Nigerian number (e.g. 8012345678)');
      return;
    }

    setIsLoading(true);
    const res = await signInWithPhone(formatted);
    setIsLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setStep('otp');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOtp = otpToken.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    const formatted = getFormattedPhone();
    const res = await verifyOtp(formatted, cleanOtp);
    setIsLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      // Sync profile with backend
      try {
        await fetch('/api/auth/profile');
      } catch {
        // non-blocking
      }
      onClose();
      onAuthenticated?.();
    }
  };

  const handleReset = () => {
    setStep('phone');
    setOtpToken('');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-amber-400/80 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-sky-700 px-6 py-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-amber-300 text-sm border border-amber-300/40">
              CA
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              CarryAm Identity Access
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {step === 'phone' ? 'Verify Your Phone' : 'Enter SMS Code'}
          </h2>
          <p className="text-xs text-sky-100 mt-0.5">
            {step === 'phone'
              ? 'Fast, secure phone OTP authentication for Nigerian travelers & senders.'
              : `6-digit code sent to ${getFormattedPhone()}`}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nigerian Mobile Number
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 overflow-hidden bg-white shadow-sm">
                  <div className="px-3.5 py-3 bg-slate-50 border-r border-slate-200 text-slate-700 font-extrabold text-sm flex items-center gap-1.5">
                    <span className="text-base">🇳🇬</span>
                    <span>+234</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="801 234 5678"
                    maxLength={11}
                    className="flex-1 px-4 py-3 text-slate-900 font-bold placeholder:text-slate-400 outline-none text-base"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Enter your 10-digit number without leading 0. Works on MTN, Airtel, Glo, & 9mobile.
                </p>
              </div>

              {/* Dev Hint Box */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-300/80 text-amber-900 text-xs">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Test Mode Ready</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  In Supabase test mode, you can test with configured test numbers (e.g. <span className="font-mono font-bold">+2348011112222</span>) with fixed OTP <span className="font-mono font-bold">123456</span> without burning SMS credits.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm shadow-md shadow-sky-600/20 border border-amber-400 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Sending Code...</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Enter 6-Digit OTP Token
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full tracking-widest text-center text-2xl font-black py-3 px-4 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none bg-slate-50 text-slate-900"
                    autoFocus
                  />
                  <KeyRound className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Change number</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="font-bold text-slate-700 hover:text-slate-900 disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm shadow-md shadow-sky-600/20 border border-amber-400 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
