'use client';

import React from 'react';
import { useAuth } from '@/components/AuthContext';
import { Sparkles, Shield, Lock, BrainCircuit, ArrowRight, CheckCircle2, History, AlertCircle } from 'lucide-react';

export function LandingPage() {
  const { signIn, loading, error, clearError } = useAuth();

  return (
    <div id="landing-page-container" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      {/* Error Banner */}
      {error && (
        <div
          id="landing-auth-error-banner"
          className="mb-8 p-4 rounded-2xl border border-rose-300 bg-[#FDFCF8] text-rose-900 text-sm flex items-start justify-between gap-3 shadow-xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-800">Authentication Notice</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={clearError}
            className="text-xs text-rose-700 hover:text-rose-900 underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D9D4C7] bg-[#FDFCF8] text-[#6B705C] text-xs font-semibold tracking-wide mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#6B705C]" />
          <span>Powered by Gemini 3.6 Flash &amp; Cloud Firestore</span>
        </div>

        <h1
          id="landing-headline"
          className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#4B4842] leading-tight"
        >
          Intelligent Journaling &amp; Reflections, <br className="hidden sm:inline" />
          <span className="italic text-[#6B705C]">
            Strictly Isolated to You
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-[#8A8471] leading-relaxed max-w-2xl mx-auto">
          Capture multi-turn journal entries, brainstorm breakthroughs, and receive deep cognitive
          summaries with Gemini. Every interaction is cryptographically bounded to your Firebase
          authenticated identity in Cloud Firestore.
        </p>

        {/* Primary CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="hero-google-signin-btn"
            onClick={signIn}
            disabled={loading}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#6B705C] hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#6B705C]/20 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Connecting to Google Identity...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Sign In with Google</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-[#A5A08F] mt-3 font-serif italic">
          Passwordless Federated Auth. No credentials or passwords ever saved on application servers.
        </p>
      </div>

      {/* Feature Architecture Cards */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          id="feature-card-isolation"
          className="p-6 rounded-3xl border border-[#D9D4C7] bg-[#FDFCF8] flex flex-col justify-between shadow-xs hover:border-[#A5A08F] transition-all"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#E9E5D9] text-[#6B705C] flex items-center justify-center mb-4 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-[#4B4842] mb-1.5">
              Strict User-Isolation
            </h3>
            <p className="text-xs text-[#8A8471] leading-relaxed">
              Every journal entry and conversation is isolated in Firestore at{' '}
              <code className="text-[#6B705C] bg-[#E9E5D9] px-1 py-0.5 rounded-md font-mono text-[11px]">/users/{'{uid}'}/interactions</code>.
              Database security rules ensure other users cannot read or modify your reflections.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E9E5D9] flex items-center gap-1.5 text-[11px] text-[#8A8471]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#6B705C]" />
            <span>Zero cross-tenant data leaks</span>
          </div>
        </div>

        <div
          id="feature-card-gemini"
          className="p-6 rounded-3xl border border-[#D9D4C7] bg-[#FDFCF8] flex flex-col justify-between shadow-xs hover:border-[#A5A08F] transition-all"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#E9E5D9] text-[#CB997E] flex items-center justify-center mb-4 shadow-xs">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-[#4B4842] mb-1.5">
              Gemini 3.6 Flash Intelligence
            </h3>
            <p className="text-xs text-[#8A8471] leading-relaxed">
              Equipped with our resilient fallback ladder (3.6 Flash &rarr; 3.1 Flash-Lite &rarr; Flash Latest &rarr; 3.7 Flash) to generate cognitive reflections, executive summaries, and creative brainstorming without service drops.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E9E5D9] flex items-center gap-1.5 text-[11px] text-[#8A8471]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>Multi-turn follow-up dialogue</span>
          </div>
        </div>

        <div
          id="feature-card-history"
          className="p-6 rounded-3xl border border-[#D9D4C7] bg-[#FDFCF8] flex flex-col justify-between shadow-xs hover:border-[#A5A08F] transition-all"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#E9E5D9] text-[#A5A58D] flex items-center justify-center mb-4 shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-[#4B4842] mb-1.5">
              Persistent Real-Time Sync
            </h3>
            <p className="text-xs text-[#8A8471] leading-relaxed">
              Explore your past journal entries anytime with instant full-text filtering and chronological sorting. All data writes strictly sanitize payloads to eliminate undefined properties.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E9E5D9] flex items-center gap-1.5 text-[11px] text-[#8A8471]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#A5A58D]" />
            <span>Guaranteed input-to-save integrity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
