'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import {
  getFirestoreDb,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from '@/lib/firebase';
import { UserInteraction, ReflectionMode } from '@/lib/types';
import {
  Search,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  FileText,
  Lightbulb,
  MessageSquare,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface HistorySidebarProps {
  selectedId: string | null;
  onSelectInteraction: (interaction: UserInteraction | null) => void;
  onNewReflection: () => void;
}

export function HistorySidebar({
  selectedId,
  onSelectInteraction,
  onNewReflection,
}: HistorySidebarProps) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | ReflectionMode>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let unsubscribe = () => {};
    try {
      const db = getFirestoreDb();
      // Strictly isolated to the authenticated user's interactions subcollection
      const userInteractionsRef = collection(db, 'users', user.uid, 'interactions');
      const q = query(userInteractionsRef, orderBy('createdAt', 'desc'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: UserInteraction[] = [];
          snapshot.forEach((docSnapshot) => {
            items.push({
              id: docSnapshot.id,
              ...(docSnapshot.data() as Omit<UserInteraction, 'id'>),
            });
          });
          setInteractions(items);
          setLoading(false);
        },
        (err) => {
          console.error('[Firestore Snapshot Error]', err);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('[History Load Error]', err);
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user || !id) return;
    if (!window.confirm('Are you sure you want to delete this reflection?')) return;

    setDeletingId(id);
    try {
      const db = getFirestoreDb();
      await deleteDoc(doc(db, 'users', user.uid, 'interactions', id));
      if (selectedId === id) {
        onNewReflection();
      }
    } catch (err) {
      console.error('[Delete Error]', err);
      alert('Failed to delete reflection. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredInteractions = interactions.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.response?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMode = modeFilter === 'all' || item.mode === modeFilter;
    return matchesSearch && matchesMode;
  });

  const getModeIcon = (mode: ReflectionMode) => {
    switch (mode) {
      case 'summary':
        return <FileText className="w-3.5 h-3.5 text-[#CB997E]" />;
      case 'brainstorm':
        return <Lightbulb className="w-3.5 h-3.5 text-[#A5A58D]" />;
      case 'chat':
        return <MessageSquare className="w-3.5 h-3.5 text-[#84A98C]" />;
      case 'reflection':
      default:
        return <Sparkles className="w-3.5 h-3.5 text-[#6B705C]" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <aside
      id="history-sidebar"
      className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-[#D9D4C7] bg-[#E9E5D9] flex flex-col h-full"
    >
      {/* Sidebar Header & New Reflection Action */}
      <div className="p-4 border-b border-[#D9D4C7] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#6B705C]" />
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#8A8471]">Recent History</h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FDFCF8] border border-[#D9D4C7] text-[#8A8471] font-mono">
            {interactions.length} {interactions.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <button
          id="new-reflection-button"
          onClick={onNewReflection}
          className="w-full py-2.5 px-3.5 rounded-xl bg-[#6B705C] hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#6B705C]/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Reflection</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8A8471] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search reflections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FDFCF8] border border-[#D9D4C7] rounded-xl text-[#4B4842] placeholder-[#A5A08F] focus:outline-hidden focus:border-[#6B705C] focus:ring-2 focus:ring-[#6B705C]/15"
          />
        </div>

        {/* Mode Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <button
            onClick={() => setModeFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs ${
              modeFilter === 'all'
                ? 'bg-[#6B705C] text-white font-semibold shadow-xs'
                : 'bg-[#FDFCF8]/70 border border-[#D9D4C7] text-[#8A8471] hover:text-[#4B4842]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setModeFilter('reflection')}
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs ${
              modeFilter === 'reflection'
                ? 'bg-[#6B705C] text-white font-semibold shadow-xs'
                : 'bg-[#FDFCF8]/70 border border-[#D9D4C7] text-[#8A8471] hover:text-[#4B4842]'
            }`}
          >
            Reflect
          </button>
          <button
            onClick={() => setModeFilter('summary')}
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs ${
              modeFilter === 'summary'
                ? 'bg-[#CB997E] text-white font-semibold shadow-xs'
                : 'bg-[#FDFCF8]/70 border border-[#D9D4C7] text-[#8A8471] hover:text-[#4B4842]'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setModeFilter('brainstorm')}
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs ${
              modeFilter === 'brainstorm'
                ? 'bg-[#A5A58D] text-white font-semibold shadow-xs'
                : 'bg-[#FDFCF8]/70 border border-[#D9D4C7] text-[#8A8471] hover:text-[#4B4842]'
            }`}
          >
            Brainstorm
          </button>
        </div>
      </div>

      {/* Interactions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-5 h-5 rounded-full border-2 border-[#D9D4C7] border-t-[#6B705C] animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#8A8471]">Loading your reflections from Firestore...</p>
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="py-10 text-center px-4">
            <Sparkles className="w-6 h-6 text-[#A5A08F] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#4B4842]">No reflections found</p>
            <p className="text-[11px] text-[#8A8471] mt-1">
              {searchTerm || modeFilter !== 'all'
                ? 'Try clearing your filters or search terms.'
                : 'Click "New Reflection" above to begin your first entry.'}
            </p>
          </div>
        ) : (
          filteredInteractions.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <div
                key={item.id}
                id={`interaction-item-${item.id}`}
                onClick={() => onSelectInteraction(item)}
                className={`group relative p-3.5 rounded-2xl cursor-pointer transition-all duration-200 text-left ${
                  isSelected
                    ? 'bg-[#FDFCF8] border border-[#D9D4C7] shadow-sm'
                    : 'border border-transparent hover:bg-[#F2EEE3]'
                }`}
              >
                {/* Natural tones left indicator for selected entry */}
                {isSelected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#6B705C] rounded-r-full" />
                )}

                <div className="flex items-start justify-between gap-2 pl-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{getModeIcon(item.mode)}</span>
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isSelected ? 'text-[#4B4842]' : 'text-[#4B4842] group-hover:text-[#3E3A35]'
                      }`}
                    >
                      {item.title || 'Untitled Reflection'}
                    </h3>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, item.id!)}
                    disabled={deletingId === item.id}
                    title="Delete Entry"
                    aria-label={`Delete entry: ${item.title}`}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#8A8471] hover:text-rose-600 hover:bg-rose-100/50 rounded transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[#8A8471] line-clamp-2 mt-1 pl-1 leading-relaxed">
                  {item.prompt}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1.5 text-[10px] text-[#A5A08F] uppercase tracking-wider pl-1">
                  <span>{formatDate(item.createdAt)}</span>
                  {item.messages && item.messages.length > 0 && (
                    <span className="flex items-center gap-1 text-[#8A8471] font-mono">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {item.messages.length + 1}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
