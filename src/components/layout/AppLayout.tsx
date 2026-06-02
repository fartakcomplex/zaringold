'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import ToastContainer from '@/components/shared/ToastContainer';
import NotificationBanner from '@/components/shared/NotificationBanner';
import OnboardingTour from '@/components/shared/OnboardingTour';
import MobileQuickActions from '@/components/shared/MobileQuickActions';
import ChatWidget from '@/components/shared/ChatWidget';
import NotificationWidget from '@/components/shared/NotificationWidget';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Global Page Event Fallback Handler                                 */
/*  Shows a toast for events that pages don't specifically handle       */
/* ------------------------------------------------------------------ */

function PageEventFallback() {
  const pageEvent = useAppStore((s) => s.pageEvent);
  const addToast = useAppStore((s) => s.addToast);
  const lastHandledId = useRef<string | null>(null);

  useEffect(() => {
    if (!pageEvent || pageEvent.id === lastHandledId.current) return;
    lastHandledId.current = pageEvent.id;

    // Events that are handled by specific page components (no fallback toast needed)
    const handledEvents = new Set([
      // Wallet
      'deposit', 'withdraw',
      // Trade
      'buy-gold', 'sell-gold', 'price-alert',
      // Gold Card
      'transfer', 'balance', 'freeze', 'show-number',
      // Gifts
      'send-gift', 'received',
      // Support
      'new-ticket', 'faq',
      // Referral
      'invite', 'stats',
      // Notifications
      'read-all', 'filter', 'delete-all',
      // Settings
      'security', 'privacy',
      // Chat
      'new-chat', 'support-agent',
      // Market
      'refresh',
      // Transactions
      'filter', 'search', 'export',
      // Savings
      'profit',
      // Loans
      'new-loan', 'repay',
      // Vault
      'deposit', 'withdraw',
      // Earn
      'tasks',
      // History (generic)
      'history',
      // Check-in
      'checkin', 'reward', 'streak',
      // Interest/status
      'interest', 'status',
      // Income/commission
      'income', 'commission',
      // Create/scan
      'scan', 'stores', 'create-qr',
      // New item events
      'new-invoice', 'new-goal', 'new-post', 'add-member',
      'new-chat',
      // Sell/claim
      'sell', 'claim',
      // Docs/API
      'docs', 'api-key', 'samples',
      // Join
      'join',
      // Auto-save
      'start', 'settings',
      // Predictions
      'predict', 'leaderboard', 'my-score',
      // Social
      'new-post', 'trending', 'likes',
      // Rules
      'rules', 'call',
      // Support
      'support-agent', 'faq',
      // Report/chart
      'report', 'chart',
      // Dashboard
      'dashboard',
      // Consult/suggestion
      'consult', 'suggestion',
    ]);

    if (!handledEvents.has(pageEvent.action)) {
      addToast('به زودی فعال می‌شود', 'info');
    }
  }, [pageEvent, addToast]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  Main Layout                                                       */
/* ------------------------------------------------------------------ */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentPage, setPage } = useAppStore();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Swipe-back gesture state ── */
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swipeIndicatorRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX < 30) { // Only from left edge (start in RTL)
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = Math.abs(touch.clientY - touchStartY.current);
    
    if (touchStartX.current > 0 && touchStartX.current < 30 && diffX > 20 && diffX > diffY) {
      if (swipeIndicatorRef.current) {
        const progress = Math.min(diffX / 150, 1);
        swipeIndicatorRef.current.style.opacity = String(progress);
        swipeIndicatorRef.current.style.transform = `translateX(${Math.min(diffX * 0.3, 50)}px)`;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX.current;
    
    if (swipeIndicatorRef.current) {
      swipeIndicatorRef.current.style.opacity = '0';
      swipeIndicatorRef.current.style.transform = 'translateX(0)';
    }
    
    if (diffX > 100 && touchStartX.current < 30) {
      setPage('dashboard');
    }
    
    touchStartX.current = 0;
    touchStartY.current = 0;
  }, [setPage]);

  /* ── Validate & refresh user session on mount ── */
  useSessionRefresh();

  /* ── Landing page (not authenticated) ── */
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  /* ── Authenticated layout ── */
  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      {!isMobile && (
        <aside className="sticky top-0 h-screen w-[280px] shrink-0 md:block">
          <AppSidebar onNavigate={() => setSidebarOpen(false)} />
        </aside>
      )}

      {/* ── Mobile Sidebar Sheet ── */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="right"
            className="w-[85vw] max-w-[320px] !p-0 bg-transparent border-none"
          >
            <SheetTitle className="sr-only">منوی ناوبری</SheetTitle>
            <AppSidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex min-h-screen flex-1 flex-col">
        <AppHeader onMenuToggle={() => setSidebarOpen(true)} />

        <main
          className={cn(
            'flex-1 px-4 py-4 md:px-8 md:py-6 xl:px-12',
            /* Mobile bottom padding for bottom nav */
            isMobile && 'pb-24'
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Swipe back indicator */}
          <div 
            ref={swipeIndicatorRef}
            className="pointer-events-none fixed inset-y-0 start-0 z-50 flex items-center opacity-0 transition-opacity duration-200 md:hidden"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="ms-2 flex size-10 items-center justify-center rounded-full bg-gold/20 backdrop-blur-sm">
              <ChevronRight className="size-5 text-gold" />
            </div>
          </div>
          <div key={currentPage} className="page-transition">
            <MobileQuickActions />
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      {isMobile && <BottomNav />}

      {/* ── In-Page Chat Widget (floating button + popup panel) ── */}
      <ChatWidget />

      {/* ── In-Page Notification Widget (floating button + popup panel + price alerts) ── */}
      <NotificationWidget />

      {/* ── Notification Banner ── */}
      <NotificationBanner />

      {/* ── Global Page Event Fallback ── */}
      <PageEventFallback />

      {/* ── Toast Notifications ── */}
      <ToastContainer />

      {/* ── Onboarding Tour ── */}
      <OnboardingTour />
    </div>
  );
}
