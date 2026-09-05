'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import {
  getFirestoreDb,
  doc,
  updateDoc,
  deleteDoc,
  stripUndefined,
} from '@/lib/firebase';
import { UserInteraction, ChatMessage, ReflectionMode } from '@/lib/types';
import Markdown from 'react-markdown';
import {
  Sparkles,
  FileText,
  Lightbulb,
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  Calendar,
  User as UserIcon,
  Cpu,
  Plus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';

interface ReflectionViewProps {
  interaction: UserInteraction;
  onUpdate: (updated: UserInteraction) => void;
  onDelete: (id: string) => void;
  onNewReflection: () => void;
}

export function ReflectionView({
  interaction,
  onUpdate,
  onDelete,
  onNewReflection,
}: ReflectionViewProps) {
  const { user } = useAuth();
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDelete = async () => {
    if (!user || !interaction.id) return;
    if (!window.confirm('Are you sure you want to permanently delete this reflection?')) return;

    setIsDeleting(true);
    try {
      const db = getFirestoreDb();
      await deleteDoc(doc(db, 'users', user.uid, 'interactions', interaction.id));
      onDelete(interaction.id);
    } catch (err: any) {
      console.error('[Delete Interaction Error]', err);
      alert('Failed to delete reflection from Firestore: ' + err.message);
      setIsDeleting(false);
    }
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpPrompt.trim() || !user || !interaction.id || isSendingFollowUp) return;

    setIsSendingFollowUp(true);
    setFollowUpError(null);

    const userMessage: ChatMessage = {
      role: 'user',
      content: followUpPrompt.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      // Build conversation history for multi-turn context
      const historyPayload: Array<{
        role: 'user' | 'model';
        parts: Array<{ text: string }>;
      }> = [
        {
          role: 'user',
          parts: [{ text: interaction.prompt }],
        },
        {
          role: 'model',
          parts: [{ text: interaction.response }],
        },
      ];

      // Add prior multi-turn messages
      if (Array.isArray(interaction.messages)) {
        for (const msg of interaction.messages) {
          historyPayload.push({
            role: msg.role,
            parts: [{ text: msg.content }],
          });
        }
      }

      // Call server API route with mode 'chat' and history
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: followUpPrompt.trim(),
          mode: 'chat',
          history: historyPayload,
          title: interaction.title,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate follow-up reply.');
      }

      const modelMessage: ChatMessage = {
        role: 'model',
        content: data.text,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...(interaction.messages || []), userMessage, modelMessage];

      // Persist to Cloud Firestore strictly within users/{userId}/interactions/{interactionId}
      const db = getFirestoreDb();
      const docRef = doc(db, 'users', user.uid, 'interactions', interaction.id);

      const updatePayload = stripUndefined({
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
        modelUsed: data.modelUsed || interaction.modelUsed || 'gemini-3.6-flash',
      });

      await updateDoc(docRef, updatePayload);

      const updatedInteraction: UserInteraction = {
        ...interaction,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
        modelUsed: data.modelUsed || interaction.modelUsed,
      };

      setFollowUpPrompt('');
      onUpdate(updatedInteraction);
    } catch (err: any) {
      console.error('[Follow-up Error]', err);
      setFollowUpError(err.message || 'Failed to send follow-up message. Please try again.');
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  const getModeBadge = (mode: ReflectionMode) => {
    switch (mode) {
      case 'summary':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#CB997E]/15 border border-[#CB997E]/30 text-[#CB997E] text-[11px] font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Summary</span>
          </span>
        );
      case 'brainstorm':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#A5A58D]/20 border border-[#A5A58D]/40 text-[#6B705C] text-[11px] font-bold uppercase tracking-wider">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Brainstorming</span>
          </span>
        );
      case 'chat':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#84A98C]/20 border border-[#84A98C]/40 text-[#52796F] text-[11px] font-bold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Multi-turn Chat</span>
          </span>
        );
      case 'reflection':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#6B705C]/15 border border-[#6B705C]/30 text-[#6B705C] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deep Reflection</span>
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div id="reflection-view-container" className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9D4C7]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {getModeBadge(interaction.mode)}

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDFCF8] border border-[#D9D4C7] shadow-xs">
              <div className="w-2 h-2 rounded-full bg-[#84A98C]" />
              <span className="text-[10px] font-bold text-[#6B705C] uppercase tracking-wider">Cloud Synced</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FDFCF8] border border-[#D9D4C7] text-[#8A8471] text-xs font-mono">
              <Cpu className="w-3 h-3 text-[#6B705C]" />
              <span>{interaction.modelUsed || 'gemini-3.6-flash'}</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[#A5A08F]">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(interaction.createdAt)}</span>
            </div>
          </div>

          <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#4B4842] tracking-tight">
            {interaction.title || 'Untitled Reflection'}
          </h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="start-new-entry-btn"
            onClick={onNewReflection}
            className="px-3.5 py-2 rounded-xl border border-[#D9D4C7] bg-[#FDFCF8] hover:bg-[#E9E5D9] text-[#4B4842] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#6B705C]" />
            <span>New Reflection</span>
          </button>

          <button
            id="delete-reflection-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-xl border border-[#D9D4C7] bg-[#FDFCF8] hover:bg-rose-50 hover:border-rose-300 text-[#8A8471] hover:text-rose-600 transition-colors shadow-xs"
            title="Delete this reflection permanently"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Turn 1: User Prompt Card */}
      <div className="flex justify-end">
        <div id="original-prompt-card" className="max-w-2xl w-full bg-[#DDBEA9] p-5 sm:p-6 rounded-3xl rounded-tr-none shadow-xs text-[#4B4842] space-y-3">
          <div className="flex items-center justify-between border-b border-[#CB997E]/30 pb-2">
            <div className="flex items-center gap-2.5">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  width={24}
                  height={24}
                  className="rounded-full ring-1 ring-[#CB997E]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#CB997E]/40 flex items-center justify-center text-[#4B4842]">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="text-xs font-bold text-[#4B4842]">
                {user?.displayName || 'Your Journal Entry'}
              </span>
            </div>

            <button
              onClick={() => copyToClipboard(interaction.prompt, 'prompt')}
              className="p-1 text-[#4B4842]/70 hover:text-[#4B4842] text-xs flex items-center gap-1 transition-colors"
              title="Copy prompt"
            >
              {copiedSection === 'prompt' ? (
                <Check className="w-3.5 h-3.5 text-[#6B705C]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <p className="text-xs sm:text-sm text-[#4B4842] leading-relaxed whitespace-pre-wrap font-medium">
            {interaction.prompt}
          </p>
        </div>
      </div>

      {/* Turn 1: Gemini Initial Response Card */}
      <div className="flex justify-start items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-2xl bg-[#A5A58D] shrink-0 flex items-center justify-center text-white shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>

        <div id="gemini-initial-response-card" className="flex-1 bg-white p-6 sm:p-7 rounded-3xl rounded-tl-none border border-[#E9E5D9] shadow-sm text-[#4B4842] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E9E5D9] pb-3">
            <div>
              <span className="text-xs font-bold text-[#6B705C] font-serif block">
                Gemini 3.6 Flash Reflection
              </span>
              <span className="text-[10px] text-[#A5A08F] block font-mono">
                Isolated Cloud Firestore Document
              </span>
            </div>

            <button
              onClick={() => copyToClipboard(interaction.response, 'response')}
              className="px-2.5 py-1 rounded-lg bg-[#FDFCF8] hover:bg-[#E9E5D9] border border-[#D9D4C7] text-[#4B4842] text-xs flex items-center gap-1 transition-colors shadow-xs"
              title="Copy reflection"
            >
              {copiedSection === 'response' ? (
                <>
                  <Check className="w-3 h-3 text-[#6B705C]" />
                  <span className="text-[11px] text-[#6B705C] font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#8A8471]" />
                  <span className="text-[11px] font-medium">Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Formatted Markdown Content */}
          <div className="prose prose-stone max-w-none text-[#4B4842] leading-relaxed text-xs sm:text-sm space-y-3 prose-headings:font-serif prose-headings:text-[#4B4842] prose-strong:text-[#6B705C] prose-blockquote:border-[#6B705C] prose-blockquote:text-[#6B705C] prose-blockquote:font-serif">
            <Markdown>{interaction.response}</Markdown>
          </div>
        </div>
      </div>

      {/* Multi-Turn Conversation History (Turns 2+) */}
      {interaction.messages && interaction.messages.length > 0 && (
        <div id="multi-turn-messages-section" className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#8A8471] uppercase tracking-[0.2em]">
            <MessageSquare className="w-3.5 h-3.5 text-[#6B705C]" />
            <span>Multi-turn Follow-up Dialogue</span>
          </div>

          {interaction.messages.map((msg, idx) => (
            <div key={idx}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-2xl w-full bg-[#DDBEA9] p-4 sm:p-5 rounded-3xl rounded-tr-none text-[#4B4842] shadow-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-[#CB997E]/30 pb-1.5">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-[#4B4842]">
                        <UserIcon className="w-3 h-3" />
                        <span>You</span>
                      </span>
                      <span className="text-[10px] text-[#4B4842]/70">{formatDate(msg.timestamp)}</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 rounded-2xl bg-[#A5A58D] shrink-0 flex items-center justify-center text-white shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 bg-white p-5 sm:p-6 rounded-3xl rounded-tl-none border border-[#E9E5D9] text-[#4B4842] shadow-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-[#E9E5D9] pb-1.5">
                      <span className="text-xs font-bold text-[#6B705C] font-serif">
                        Gemini
                      </span>
                      <span className="text-[10px] text-[#A5A08F]">{formatDate(msg.timestamp)}</span>
                    </div>
                    <div className="prose prose-stone max-w-none text-xs sm:text-sm text-[#4B4842] leading-relaxed prose-headings:font-serif prose-headings:text-[#4B4842] prose-strong:text-[#6B705C]">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Follow-up Error Notice */}
      {followUpError && (
        <div className="p-3.5 rounded-2xl border border-rose-300 bg-[#FDFCF8] text-rose-900 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <p className="flex-1">{followUpError}</p>
          <button
            onClick={() => setFollowUpError(null)}
            className="text-xs text-rose-700 hover:text-rose-900 underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Multi-Turn Input Composer */}
      <div id="follow-up-composer-container" className="pt-4 border-t border-[#D9D4C7]">
        <form onSubmit={handleSendFollowUp} className="space-y-3">
          <label htmlFor="follow-up-input" className="block text-xs font-semibold text-[#4B4842]">
            Continue conversation with Gemini on this reflection:
          </label>

          <div className="flex gap-2.5">
            <input
              id="follow-up-input"
              type="text"
              placeholder="Ask a clarifying question, explore a theme deeper, or respond..."
              value={followUpPrompt}
              onChange={(e) => setFollowUpPrompt(e.target.value)}
              disabled={isSendingFollowUp}
              className="flex-1 px-4 py-3 bg-white border border-[#D9D4C7] rounded-2xl text-xs sm:text-sm text-[#4B4842] placeholder-[#A5A08F] focus:outline-hidden focus:border-[#6B705C] focus:ring-4 focus:ring-[#6B705C]/10 shadow-xs"
            />
            <button
              type="submit"
              id="send-follow-up-btn"
              disabled={!followUpPrompt.trim() || isSendingFollowUp}
              className="px-5 py-3 rounded-2xl bg-[#6B705C] hover:opacity-90 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-[#6B705C]/20 shrink-0"
            >
              {isSendingFollowUp ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Reply</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-[#8A8471] font-serif italic">
            Multi-turn replies are automatically committed to your user document in Cloud Firestore.
          </p>
        </form>
      </div>
    </div>
  );
}
