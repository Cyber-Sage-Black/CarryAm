'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Package, 
  Car, 
  ShieldCheck, 
  Wallet, 
  Search, 
  PlusCircle, 
  Menu,
  X,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AuthModal } from './AuthModal';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();

  const navItems = [
    { label: 'Send Package', href: '/send', icon: PlusCircle },
    { label: 'Find Trips', href: '/trips', icon: Search },
    { label: 'Carrier Dashboard', href: '/travel', icon: Car },
    { label: 'Consignment Board', href: '/packages', icon: Package },
    { label: 'My Wallet', href: '/dashboard', icon: Wallet },
  ];

  return (
    <>
      <header className="border-b border-sky-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <NextLink href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-sky-600/20 border border-amber-400 group-hover:scale-105 transition-transform">
              CA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight text-slate-900">
                  Carry<span className="text-sky-600">Am</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                  Lagos ⇄ Ibadan
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wide hidden sm:block">
                Peer-to-Peer Intercity Logistics Network
              </p>
            </div>
          </NextLink>

          {/* Desktop Nav Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </NextLink>
              );
            })}
          </nav>

          {/* User Status / Quick Actions */}
          <div className="flex items-center gap-3">
            <NextLink
              href="/send"
              className="hidden sm:inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm shadow-sky-600/20 border border-amber-400/80"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Send Item</span>
            </NextLink>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <NextLink
                  href="/dashboard"
                  className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-100 to-sky-50 border border-amber-400 text-sky-800 flex items-center justify-center font-black text-xs shadow-inner">
                    {user.phone ? user.phone.slice(-2) : 'CA'}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-extrabold text-slate-900">
                        {user.phone ?? 'Verified User'}
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      Active Member
                    </span>
                  </div>
                </NextLink>
                <button
                  type="button"
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-all border border-sky-300 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-600" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-sky-100 bg-white px-4 py-3 space-y-1 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </NextLink>
              );
            })}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <NextLink
                href="/send"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black py-3 rounded-xl shadow-sm border border-amber-400"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>Dispatch Package</span>
              </NextLink>
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black py-3 rounded-xl border border-slate-300"
                >
                  <LogIn className="w-4 h-4 text-sky-600" />
                  <span>Sign In with Phone</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Interactive Phone OTP Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
