'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import {
  getFirestoreDb,
  collection,
  addDoc,
  stripUndefined,
} from '@/lib/firebase';
import { UserInteraction, ReflectionMode, ReflectionResponsePayload } from '@/lib/types';
import {
  Sparkles,
  FileText,
  Lightbulb,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface ReflectionComposerProps {
  onReflectionCreated: (newInteraction: UserInteraction) => void;
}

const STARTER_PROMPTS = [
  {
    label: 'Daily Retrospective',
    mode: 'reflection' as ReflectionMode,
    text: 'Reflecting on what went well today, what felt draining, and one key insight I gained from a challenge I encountered.',
  },
  {
    label: 'Executive Summary',
    mode: 'summary' as ReflectionMode,
    text: 'Here are my notes and ideas from today\'s product strategy brainstorm. Please synthesize the core theme, key takeaways, and actionable next steps.',
  },
  {
    label: 'Creative Brainstorm',
    mode: 'brainstorm' as ReflectionMode,
    text: 'I am looking to improve user engagement on our platform. What are innovative angles, experiment clusters, and low-friction prototypes we can test?',
  },
  {
    label: 'Decision Framework',
    mode: 'reflection' as ReflectionMode,
    text: 'I am weighing two choices: prioritizing speed-to-market versus investing in deep architectural refactoring. Help me examine blind spots and trade-offs.',
  },
];

export function ReflectionComposer({ onReflectionCreated }: ReflectionComposerProps) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<ReflectionMode>('reflection');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedData, setLastFailedData] = useState<{
    prompt: string;
    mode: ReflectionMode;
    title: string;
    geminiResponse?: ReflectionResponsePayload;
  } | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || !user || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    let geminiResult: ReflectionResponsePayload | null = null;

    try {
      // Step 1: Call resilient Gemini Server-side Route
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode,
          title: title.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate reflection with Gemini.');
      }

      geminiResult = data;

      // Step 2: Persist both user input and Gemini output to Firestore
      // Strictly isolated to users/{userId}/interactions
      const db = getFirestoreDb();
      const interactionsCollection = collection(db, 'users', user.uid, 'interactions');

      const interactionRecord: Omit<UserInteraction, 'id'> = {
        userId: user.uid,
        title: title.trim() || data.title || 'Untitled Reflection',
        prompt: prompt.trim(),
        response: data.text,
        mode,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        modelUsed: data.modelUsed || 'gemini-3.6-flash',
        tags: [mode],
      };

      // Sanitize payload to strip all undefined values before passing to Firestore SDK
      const cleanPayload = stripUndefined(interactionRecord);

      const docRef = await addDoc(interactionsCollection, cleanPayload);

      const createdItem: UserInteraction = {
        id: docRef.id,
        ...interactionRecord,
      };

      // Persistence confirmed: safe to clear buffer and notify parent view
      setPrompt('');
      setTitle('');
      setLastFailedData(null);
      onReflectionCreated(createdItem);
    } catch (err: any) {
      console.error('[Reflection Creation Error]', err);
      // Preserve user input and provide clear retry mechanism
      setErrorMessage(
        err.message || 'An error occurred while creating or saving your reflection. Your text is safely preserved.'
      );
      setLastFailedData({
        prompt,
        mode,
        title,
        geminiResponse: geminiResult || undefined,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (!lastFailedData || !user) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const db = getFirestoreDb();
      const interactionsCollection = collection(db, 'users', user.uid, 'interactions');

      let responseText = lastFailedData.geminiResponse?.text;
      let finalTitle = lastFailedData.title || lastFailedData.geminiResponse?.title || 'Reflection Entry';
      let modelUsed = lastFailedData.geminiResponse?.modelUsed || 'gemini-3.6-flash';

      // If Gemini call had not completed yet, call it again
      if (!responseText) {
        const response = await fetch('/api/reflect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: lastFailedData.prompt.trim(),
            mode: lastFailedData.mode,
            title: lastFailedData.title.trim() || undefined,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Gemini API call failed during retry.');
        }
        responseText = data.text;
        finalTitle = data.title;
        modelUsed = data.modelUsed;
      }

      if (!responseText) {
        throw new Error('Unable to retrieve reflection response text for retry.');
      }

      const interactionRecord: Omit<UserInteraction, 'id'> = {
        userId: user.uid,
        title: finalTitle,
        prompt: lastFailedData.prompt.trim(),
        response: responseText,
        mode: lastFailedData.mode,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        modelUsed,
        tags: [lastFailedData.mode],
      };

      const cleanPayload = stripUndefined(interactionRecord);
      const docRef = await addDoc(interactionsCollection, cleanPayload);

      const createdItem: UserInteraction = {
        id: docRef.id,
        ...interactionRecord,
      };

      setPrompt('');
      setTitle('');
      setLastFailedData(null);
      onReflectionCreated(createdItem);
    } catch (err: any) {
      console.error('[Retry Save Error]', err);
      setErrorMessage(err.message || 'Retry attempt failed. Please check network and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="reflection-composer" className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      {/* Header / Intro */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[#6B705C] text-xs font-bold uppercase tracking-[0.2em] mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Journal Reflection</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#4B4842] tracking-tight">
          What is on your mind today?
        </h1>
        <p className="text-xs sm:text-sm text-[#8A8471] mt-1.5 leading-relaxed">
          Pour your thoughts out freely. Gemini will reflect with introspective questions, structured executive summaries, or creative brainstorming.
        </p>
      </div>

      {/* Error & Retry Banner */}
      {errorMessage && (
        <div
          id="composer-error-banner"
          className="mb-6 p-4 rounded-2xl border border-rose-300 bg-[#FDFCF8] text-rose-900 text-xs flex items-start justify-between gap-3 shadow-xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-800">Transaction Notice</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            id="retry-save-button"
            onClick={handleRetry}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Retry Save</span>
          </button>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="mb-6">
        <label className="block text-xs uppercase tracking-wider font-semibold text-[#8A8471] mb-2.5">
          Select Analysis &amp; Reflection Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            id="mode-btn-reflection"
            onClick={() => setMode('reflection')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              mode === 'reflection'
                ? 'bg-[#FDFCF8] border-[#6B705C] ring-2 ring-[#6B705C]/20 shadow-xs'
                : 'bg-[#FDFCF8]/60 border-[#D9D4C7] hover:bg-[#FDFCF8] hover:border-[#A5A08F]'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-[#6B705C]" />
              <span className="text-[#4B4842]">Deep Reflection</span>
            </div>
            <p className="text-[11px] text-[#8A8471] leading-relaxed">
              Empathetic perspective, cognitive patterns, and introspective journaling questions.
            </p>
          </button>

          <button
            type="button"
            id="mode-btn-summary"
            onClick={() => setMode('summary')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              mode === 'summary'
                ? 'bg-[#FDFCF8] border-[#CB997E] ring-2 ring-[#CB997E]/20 shadow-xs'
                : 'bg-[#FDFCF8]/60 border-[#D9D4C7] hover:bg-[#FDFCF8] hover:border-[#A5A08F]'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs mb-1">
              <FileText className="w-4 h-4 text-[#CB997E]" />
              <span className="text-[#4B4842]">Executive Summary</span>
            </div>
            <p className="text-[11px] text-[#8A8471] leading-relaxed">
              Concise synthesis of themes, scannable key takeaways, and action items.
            </p>
          </button>

          <button
            type="button"
            id="mode-btn-brainstorm"
            onClick={() => setMode('brainstorm')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              mode === 'brainstorm'
                ? 'bg-[#FDFCF8] border-[#A5A58D] ring-2 ring-[#A5A58D]/20 shadow-xs'
                : 'bg-[#FDFCF8]/60 border-[#D9D4C7] hover:bg-[#FDFCF8] hover:border-[#A5A08F]'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs mb-1">
              <Lightbulb className="w-4 h-4 text-[#A5A58D]" />
              <span className="text-[#4B4842]">Brainstorm &amp; Ideas</span>
            </div>
            <p className="text-[11px] text-[#8A8471] leading-relaxed">
              Innovative viewpoints, creative idea clusters, and low-friction micro-experiments.
            </p>
          </button>
        </div>
      </div>

      {/* Starter Prompt Inspiration */}
      <div className="mb-5">
        <span className="text-[11px] font-semibold text-[#8A8471] flex items-center gap-1.5 mb-2.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#8A8471]" />
          Need inspiration? Click a starter topic:
        </span>
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((starter, idx) => (
            <button
              key={idx}
              type="button"
              id={`starter-chip-${idx}`}
              onClick={() => {
                setPrompt(starter.text);
                setMode(starter.mode);
                setTitle(starter.label);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#FDFCF8] hover:bg-[#E9E5D9] border border-[#D9D4C7] text-[#4B4842] hover:text-[#3E3A35] text-xs font-medium transition-colors shadow-xs"
            >
              {starter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reflection Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title input (optional) */}
        <div>
          <label htmlFor="reflection-title-input" className="block text-xs font-semibold text-[#4B4842] mb-1.5">
            Entry Title <span className="text-[#8A8471] font-normal">(Optional)</span>
          </label>
          <input
            id="reflection-title-input"
            type="text"
            placeholder="e.g. Overcoming the migration blocker, Weekly growth review..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="w-full px-4 py-2.5 bg-white border border-[#D9D4C7] rounded-2xl text-xs sm:text-sm text-[#4B4842] placeholder-[#A5A08F] focus:outline-hidden focus:border-[#6B705C] focus:ring-4 focus:ring-[#6B705C]/10 shadow-xs"
          />
        </div>

        {/* Journal Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="reflection-body-input" className="block text-xs font-semibold text-[#4B4842]">
              Your Reflection / Journal Content <span className="text-[#CB997E]">*</span>
            </label>
            <span className="text-[11px] text-[#A5A08F] font-mono">
              {prompt.length}/10,000
            </span>
          </div>
          <textarea
            id="reflection-body-input"
            rows={7}
            placeholder="Pour your thoughts out here freely..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={10000}
            required
            className="w-full p-5 bg-white border border-[#D9D4C7] rounded-3xl text-xs sm:text-sm text-[#4B4842] placeholder-[#A5A08F] leading-relaxed focus:outline-hidden focus:border-[#6B705C] focus:ring-4 focus:ring-[#6B705C]/10 shadow-sm resize-y"
          />
        </div>

        {/* Security & Action Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#8A8471] font-serif italic">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#6B705C] shrink-0" />
            <span>Encrypted with Cloud Firestore &amp; Auth security isolation</span>
          </div>

          <button
            type="submit"
            id="submit-reflection-btn"
            disabled={!prompt.trim() || isProcessing}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#6B705C] hover:opacity-90 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#6B705C]/20 active:scale-98"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Reflecting with Gemini 3.6 Flash...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit &amp; Reflect with Gemini</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
