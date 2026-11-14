'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Package, 
  Clock, 
  Car, 
  CreditCard, 
  AlertCircle,
  TrendingUp,
  FileText,
  Building,
  ChevronRight
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { carryAmStore } from '../../lib/store';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'carrier' | 'sender'>('carrier');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankName, setBankName] = useState('Guaranty Trust Bank (GTBank)');
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [withdrawalSuccess, setWithdrawalSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const carrierWallet = carryAmStore.getWallet('usr_tunde');
  const carrierProfile = carryAmStore.getProfile('usr_tunde');
  const agreements = carryAmStore.getAgreements();
  const packages = carryAmStore.getPackages();

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawalAmount);
    if (!amount || amount <= 0 || amount > carrierWallet.availableBalanceNaira) {
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      carrierWallet.availableBalanceNaira -= amount;
      carrierWallet.transactions.unshift({
        id: `tx_${Date.now()}`,
        type: 'DEBIT',
        amountNaira: amount,
        description: `Bank Withdrawal to ${bankName} (${accountNumber})`,
        timestamp: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reference: `CAM-WTH-${Date.now()}`,
      });
      setIsProcessing(false);
      setWithdrawalSuccess(`₦${amount.toLocaleString()} successfully dispatched to ${bankName} via Paystack NIP.`);
      setWithdrawalAmount('');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Profile Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-500 border-2 border-amber-400 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-sky-600/20">
              TA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">
                  {carrierProfile?.firstName} {carrierProfile?.lastName}
                </h1>
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {carrierProfile?.kycTier} Gold Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {carrierProfile?.email} • {carrierProfile?.phoneNumber}
              </p>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 mt-2">
                <span>⭐ {carrierProfile?.trustScore} Trust Score</span>
                <span>•</span>
                <span>{carrierProfile?.completedDeliveriesCount} Intercity Deliveries</span>
                <span>•</span>
                <span className="text-emerald-600">0 Disputes</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <NextLink
              href="/travel"
              className="bg-sky-600 hover:bg-sky-700 text-white font-black text-xs px-5 py-3 rounded-xl transition-all shadow-sm border border-amber-400 flex items-center gap-1.5"
            >
              <Car className="w-4 h-4 text-amber-300" />
              <span>Schedule Next Trip</span>
            </NextLink>
          </div>
        </div>

        {/* Financial Wallet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Available Balance */}
          <div className="bg-white rounded-2xl p-6 border-2 border-amber-300 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              <span>Available Wallet Balance</span>
              <Wallet className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">
              ₦{carrierWallet.availableBalanceNaira.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready for instant bank transfer</span>
            </p>
          </div>

          {/* Pending Escrow */}
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              <span>Locked in Escrow Vault</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-slate-900">
              ₦{carrierWallet.pendingEscrowNaira.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Auto-releases upon Delivery OTP entry
            </p>
          </div>

          {/* Lifetime Earnings */}
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              <span>Lifetime Corridor Earnings</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-sky-600">
              ₦{carrierWallet.lifetimeEarningsNaira.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Lagos ⇄ Ibadan Corridor Transit
            </p>
          </div>
        </div>

        {/* Withdrawal Section & Active Waybills Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Active Waybills & Consignments */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-amber-300 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-sky-600" />
                  Active Consignments & Waybills
                </h2>
                <span className="text-xs bg-sky-50 text-sky-700 font-bold px-2.5 py-1 rounded-full border border-sky-200">
                  {agreements.length} Active
                </span>
              </div>

              <div className="space-y-4">
                {agreements.map((agr) => (
                  <div key={agr.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">Waybill #{agr.id}</span>
                        <h4 className="font-black text-sm text-slate-900 mt-0.5">
                          {agr.package?.items?.[0]?.title || 'Package Transit'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Recipient: <strong>{agr.package?.receiverName}</strong> ({agr.package?.destinationName})
                        </p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        agr.package?.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : agr.package?.status === 'IN_TRANSIT'
                          ? 'bg-sky-50 text-sky-800 border-sky-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {agr.package?.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Bounty: <strong className="text-sky-600 font-black">₦{(agr.agreedBountyKobo / 100).toLocaleString()}</strong>
                      </span>
                      <NextLink
                        href={`/tracking/${agr.id}`}
                        className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 underline"
                      >
                        <span>Open Tracking & OTP Console</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </NextLink>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Ledger */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                Recent Wallet Settlements
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                {carrierWallet.transactions.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{tx.description}</div>
                      <div className="text-slate-400 text-[10px]">{tx.timestamp} • Ref: {tx.reference}</div>
                    </div>
                    <div className={`font-black text-sm ${
                      tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}₦{tx.amountNaira.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Instant Bank Withdrawal (Paystack NIP) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-amber-400 shadow-md space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-sky-600" />
                  Instant Bank Withdrawal
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  NIP Rails Active
                </span>
              </div>

              {withdrawalSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{withdrawalSuccess}</span>
                </div>
              )}

              <form onSubmit={handleWithdraw} className="space-y-4 text-xs">
                <div>
                  <label className="block font-black uppercase tracking-wider text-slate-500 mb-1">
                    Withdrawal Amount (₦)
                  </label>
                  <input
                    type="number"
                    min="500"
                    max={carrierWallet.availableBalanceNaira}
                    required
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder={`Max: ₦${carrierWallet.availableBalanceNaira.toLocaleString()}`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base font-black text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-black uppercase tracking-wider text-slate-500 mb-1">
                    Destination Bank
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Guaranty Trust Bank (GTBank)">Guaranty Trust Bank (GTBank)</option>
                    <option value="Access Bank">Access Bank Plc</option>
                    <option value="Zenith Bank">Zenith Bank Plc</option>
                    <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                    <option value="Kuda Microfinance Bank">Kuda Microfinance Bank</option>
                    <option value="Moniepoint Microfinance Bank">Moniepoint MFB</option>
                    <option value="OPay">OPay Digital Services</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black uppercase tracking-wider text-slate-500 mb-1">
                    10-Digit NUBAN Account Number
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 font-mono font-black text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
                    ✓ Verified Account Name: TUNDE O. ADEYEMI
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || carrierWallet.availableBalanceNaira < 500}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black text-sm py-3.5 rounded-xl transition-all shadow-md shadow-sky-600/20 border-2 border-amber-400 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowUpRight className="w-4 h-4 text-amber-300" />
                  <span>{isProcessing ? 'Processing Transfer...' : 'Withdraw Funds to Bank'}</span>
                </button>
              </form>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                Withdrawals are routed via Paystack Transfer API directly to all 100+ CBN-licensed commercial banks and mobile money operators with zero settlement delay.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
