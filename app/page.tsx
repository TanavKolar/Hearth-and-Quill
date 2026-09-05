'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { Navbar } from '@/components/Navbar';
import { LandingPage } from '@/components/LandingPage';
import { HistorySidebar } from '@/components/HistorySidebar';
import { ReflectionComposer } from '@/components/ReflectionComposer';
import { ReflectionView } from '@/components/ReflectionView';
import { UserInteraction } from '@/lib/types';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

function DashboardContent() {
  const { user, loading } = useAuth();
  const [selectedInteraction, setSelectedInteraction] = useState<UserInteraction | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  const handleSelectInteraction = (item: UserInteraction | null) => {
    setSelectedInteraction(item);
    setIsSidebarOpenMobile(false);
  };

  const handleNewReflection = () => {
    setSelectedInteraction(null);
    setIsSidebarOpenMobile(false);
  };

  const handleReflectionCreated = (newInteraction: UserInteraction) => {
    setSelectedInteraction(newInteraction);
  };

  const handleReflectionUpdated = (updatedInteraction: UserInteraction) => {
    setSelectedInteraction(updatedInteraction);
  };

  const handleReflectionDeleted = () => {
    setSelectedInteraction(null);
  };

  if (loading) {
    return (
      <div id="initial-loading-screen" className="flex flex-col items-center justify-center min-h-[80vh] bg-[#F9F7F2]">
        <div className="w-10 h-10 rounded-full border-3 border-[#D9D4C7] border-t-[#6B705C] animate-spin mb-4" />
        <p className="text-sm font-medium text-[#4B4842]">Connecting to Google Authentication...</p>
        <p className="text-xs text-[#8A8471] mt-1">Verifying identity &amp; Firestore security permissions</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div id="authenticated-dashboard" className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-[#F9F7F2]">
      {/* Mobile Sidebar Toggle Button */}
      <div className="lg:hidden px-4 py-2.5 bg-[#E9E5D9] border-b border-[#D9D4C7] flex items-center justify-between">
        <button
          id="mobile-toggle-sidebar-btn"
          onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
          className="flex items-center gap-2 text-xs font-medium text-[#4B4842] hover:text-[#3E3A35] px-3 py-1.5 rounded-lg bg-[#FDFCF8] border border-[#D9D4C7] shadow-xs"
        >
          {isSidebarOpenMobile ? (
            <>
              <PanelLeftClose className="w-4 h-4 text-[#6B705C]" />
              <span>Hide History</span>
            </>
          ) : (
            <>
              <PanelLeftOpen className="w-4 h-4 text-[#6B705C]" />
              <span>Show History</span>
            </>
          )}
        </button>

        <button
          onClick={handleNewReflection}
          className="text-xs font-semibold text-[#6B705C] hover:opacity-80 px-2 py-1"
        >
          + New Entry
        </button>
      </div>

      {/* History Sidebar: full height on desktop, toggleable or drawer on mobile */}
      <div
        className={`${
          isSidebarOpenMobile ? 'block' : 'hidden'
        } lg:block h-full border-r border-[#D9D4C7] shrink-0`}
      >
        <HistorySidebar
          selectedId={selectedInteraction?.id || null}
          onSelectInteraction={handleSelectInteraction}
          onNewReflection={handleNewReflection}
        />
      </div>

      {/* Main Content Area */}
      <main id="main-content-scroll" className="flex-1 overflow-y-auto bg-[#F9F7F2]">
        {selectedInteraction ? (
          <ReflectionView
            key={selectedInteraction.id}
            interaction={selectedInteraction}
            onUpdate={handleReflectionUpdated}
            onDelete={handleReflectionDeleted}
            onNewReflection={handleNewReflection}
          />
        ) : (
          <ReflectionComposer onReflectionCreated={handleReflectionCreated} />
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <div id="app-root" className="min-h-screen bg-[#F9F7F2] text-[#3E3A35] flex flex-col font-sans selection:bg-[#DDBEA9] selection:text-[#4B4842]">
        <Navbar onNewReflection={() => {}} />
        <DashboardContent />
      </div>
    </AuthProvider>
  );
}
