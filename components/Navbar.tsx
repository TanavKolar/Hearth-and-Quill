'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { SecurityModal } from '@/components/SecurityModal';
import { Sparkles, Shield, LogOut, LogIn, User as UserIcon } from 'lucide-react';
import Image from 'next/image';

interface NavbarProps {
  onNewReflection?: () => void;
}

export function Navbar({ onNewReflection }: NavbarProps) {
  const { user, loading, signIn, signOut } = useAuth();
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  return (
    <>
      <header
        id="app-navbar"
        className="sticky top-0 z-40 w-full border-b border-[#D9D4C7] bg-[#F9F7F2]/85 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNewReflection}
              className="flex items-center gap-2.5 text-left group transition-transform active:scale-98"
              id="navbar-brand-button"
            >
              <div className="w-9 h-9 rounded-2xl bg-[#6B705C] shadow-md shadow-[#6B705C]/20 rotate-3 flex items-center justify-center text-white transition-transform group-hover:rotate-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-[#4B4842] block leading-snug">
                  Gemini Reflections
                </span>
                <span className="text-[10px] text-[#8A8471] uppercase tracking-[0.15em] font-semibold block">
                  Isolated Cloud Firestore
                </span>
              </div>
            </button>

            {/* Security Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDFCF8] border border-[#D9D4C7] text-[#6B705C] text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#84A98C]" />
              <Shield className="w-3 h-3 text-[#6B705C]" />
              <span>RBAC &amp; Owner-Isolated</span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            <button
              id="open-security-model-btn"
              onClick={() => setIsSecurityModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-[#D9D4C7] bg-[#FDFCF8] hover:bg-[#E9E5D9] text-[#4B4842] text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              title="Inspect 5 Threat Zones & Firestore Security Rules"
            >
              <Shield className="w-3.5 h-3.5 text-[#6B705C]" />
              <span className="hidden sm:inline">Threat Model &amp; Rules</span>
              <span className="sm:hidden">Rules</span>
            </button>

            {loading ? (
              <div
                id="auth-loading-spinner"
                className="w-8 h-8 rounded-full border-2 border-[#D9D4C7] border-t-[#6B705C] animate-spin"
              />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 pl-2 py-1 rounded-full border border-[#D9D4C7] bg-[#FDFCF8] shadow-xs">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'User profile'}
                      width={28}
                      height={28}
                      className="rounded-full ring-2 ring-white border border-[#CB997E] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#CB997E] text-white flex items-center justify-center">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-[#4B4842] hidden sm:inline max-w-[120px] truncate pr-2">
                    {user.displayName || user.email?.split('@')[0] || 'Authenticated'}
                  </span>
                </div>

                <button
                  id="sign-out-button"
                  onClick={signOut}
                  className="px-3 py-1.5 rounded-xl border border-[#D9D4C7] bg-[#FDFCF8] hover:bg-[#E9E5D9] hover:border-rose-300 text-[#4B4842] hover:text-rose-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                id="navbar-sign-in-button"
                onClick={signIn}
                className="px-3.5 py-1.5 rounded-xl bg-[#6B705C] hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-[#6B705C]/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </>
  );
}
