'use client';

import React from 'react';
import { ShieldCheck, Lock, Database, KeyRound, X, AlertTriangle } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="security-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="security-modal-content"
        className="bg-[#F9F7F2] border border-[#D9D4C7] text-[#4B4842] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#D9D4C7] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E9E5D9] text-[#6B705C] border border-[#D9D4C7]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 id="security-modal-title" className="font-serif text-lg font-bold text-[#4B4842]">
                Security Architecture &amp; Threat Model
              </h2>
              <p className="text-xs text-[#8A8471]">
                OWASP Top 10 &amp; LLM Threat Defense Verification
              </p>
            </div>
          </div>
          <button
            id="close-security-modal-btn"
            onClick={onClose}
            aria-label="Close Security Modal"
            className="p-2 text-[#8A8471] hover:text-[#4B4842] rounded-xl hover:bg-[#E9E5D9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Threat Zones Summary Table */}
        <div className="mb-6">
          <h3 className="font-serif text-sm font-bold text-[#4B4842] flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#CB997E]" />
            5 Threat Zones: Mitigations &amp; Safeguards
          </h3>
          <div className="overflow-x-auto border border-[#D9D4C7] rounded-2xl bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E9E5D9] text-[#4B4842] font-semibold">
                <tr>
                  <th className="p-3">Threat Zone</th>
                  <th className="p-3">Attack Vector</th>
                  <th className="p-3">Countermeasure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5D9] text-[#4B4842]">
                <tr className="hover:bg-[#F9F7F2]/60">
                  <td className="p-3 font-semibold text-[#CB997E]">1. Input Surfaces</td>
                  <td className="p-3 text-[#8A8471]">Journal prompt injection, oversized payload flooding (&gt;1MB), XSS.</td>
                  <td className="p-3 text-[#4B4842]">Defensive payload parsing, 12,000 char bounding, safe React markdown output encoding.</td>
                </tr>
                <tr className="hover:bg-[#F9F7F2]/60">
                  <td className="p-3 font-semibold text-[#6B705C]">2. Planning &amp; Reasoning</td>
                  <td className="p-3 text-[#8A8471]">Indirect prompt injection coercing Gemini system instructions.</td>
                  <td className="p-3 text-[#4B4842]">System prompt isolation (OWASP LLM01): user reflection is treated as data, not instruction.</td>
                </tr>
                <tr className="hover:bg-[#F9F7F2]/60">
                  <td className="p-3 font-semibold text-[#A5A58D]">3. Tool Execution</td>
                  <td className="p-3 text-[#8A8471]">Model quota exhaustion, 503 unavailability, client secret leakage.</td>
                  <td className="p-3 text-[#4B4842]">Resilient Model Fallback Ladder (3.6-flash &rarr; 3.1-flash-lite &rarr; flash-latest &rarr; 3.7-flash), server-only execution.</td>
                </tr>
                <tr className="hover:bg-[#F9F7F2]/60">
                  <td className="p-3 font-semibold text-[#52796F]">4. Memory &amp; State</td>
                  <td className="p-3 text-[#8A8471]">Cross-user data leakage in Firestore, unauthorized reads of other users&apos; reflections.</td>
                  <td className="p-3 text-[#4B4842]">Owner-bound Firestore rules (<code className="text-[#52796F] font-mono font-bold">request.auth.uid == userId</code>), zero blanket permissions, zero-crash undefined-stripping.</td>
                </tr>
                <tr className="hover:bg-[#F9F7F2]/60">
                  <td className="p-3 font-semibold text-[#B7B7A4]">5. Inter-System Comm</td>
                  <td className="p-3 text-[#8A8471]">API key exposure in client bundles, credential leakage.</td>
                  <td className="p-3 text-[#4B4842]">Zero hardcoding; Google Secret Manager / server-side env vars; federated OAuth via Google Sign-In.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Firestore Security Rules Block */}
        <div className="mb-6">
          <h3 className="font-serif text-sm font-bold text-[#4B4842] flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-[#6B705C]" />
            Active Deployed Firestore Security Rules
          </h3>
          <p className="text-xs text-[#8A8471] mb-2">
            Path-isolated security rules ensure each authenticated user has exclusive access to their own reflections subcollection.
          </p>
          <pre className="p-4 bg-[#2D2A26] border border-[#4B4842]/40 rounded-2xl text-xs font-mono text-[#DDBEA9] overflow-x-auto leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
          </pre>
        </div>

        {/* Secret Management Hygiene */}
        <div className="mb-2">
          <h3 className="font-serif text-sm font-bold text-[#4B4842] flex items-center gap-2 mb-2">
            <KeyRound className="w-4 h-4 text-[#6B705C]" />
            Secret Management &amp; Zero-Hardcoding Hygiene
          </h3>
          <p className="text-xs text-[#8A8471] leading-relaxed">
            All AI processing runs on the Next.js server route (<code className="text-[#6B705C] bg-[#E9E5D9] px-1 py-0.5 rounded-md font-mono">/api/reflect</code>). The Gemini API key is never exposed to the client or browser network inspection. Credentials are dynamically provisioned via Google Cloud Secret Manager.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-[#D9D4C7] flex justify-end">
          <button
            id="dismiss-security-modal-btn"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#6B705C] hover:opacity-90 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
