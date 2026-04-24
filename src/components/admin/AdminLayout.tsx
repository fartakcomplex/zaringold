'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminKYC from './pages/AdminKYC';
import AdminTickets from './pages/AdminTickets';
import AdminChats from './pages/AdminChats';
import AdminTransactions from './pages/AdminTransactions';
import AdminLoans from './pages/AdminLoans';
import AdminPrices from './pages/AdminPrices';
import AdminBlog from './pages/AdminBlog';
import AdminPages from './pages/AdminPages';
import AdminSettings from './pages/AdminSettings';
import AdminBackups from './pages/AdminBackups';
import AdminEasyInstaller from './pages/AdminEasyInstaller';
import AdminSecurity from './pages/AdminSecurity';
import AdminLandingBuilder from './pages/AdminLandingBuilder';
import FraudAlertsView from '@/components/gateway/FraudAlertsView';
import GatewayAdminView from './GatewayAdminView';
import SmsSettings from '@/components/sms/SmsSettings';
import EmailSettings from '@/components/email/EmailSettings';
import ToastContainer from '@/components/shared/ToastContainer';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Admin Page Router                                                  */
/* ------------------------------------------------------------------ */

function AdminPageRouter() {
  const { adminPage } = useAppStore();

  switch (adminPage) {
    case 'dashboard': return <AdminDashboard />;
    case 'users': return <AdminUsers />;
    case 'kyc': return <AdminKYC />;
    case 'tickets': return <AdminTickets />;
    case 'chats': return <AdminChats />;
    case 'transactions': return <AdminTransactions />;
    case 'loans': return <AdminLoans />;
    case 'prices': return <AdminPrices />;
    case 'blog': return <AdminBlog />;
    case 'pages': return <AdminPages />;
    case 'settings': return <AdminSettings />;
    case 'backups': return <AdminBackups />;
    case 'easy-installer': return <AdminEasyInstaller />;
    case 'fraud-alerts': return <FraudAlertsView />;
    case 'gateway': return <GatewayAdminView />;
    case 'sms-marketing': return <SmsSettings />;
    case 'email-marketing': return <EmailSettings />;
    case 'security': return <AdminSecurity />;
    case 'landing-builder': return <AdminLandingBuilder />;
    default: return <AdminDashboard />;
  }
}

/* ------------------------------------------------------------------ */
/*  Admin Access Denied                                                */
/* ------------------------------------------------------------------ */

function AdminAccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5 text-center">
        {/* Lock icon with gold glow */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gold/5 border border-gold/20">
          <Lock className="h-10 w-10 text-gold/70" />
          <div className="absolute inset-0 rounded-full border border-gold/10 animate-ping opacity-20" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            دسترسی محدود
          </h1>
          <p className="text-sm text-muted-foreground max-w-[320px]">
            شما دسترسی لازم برای ورود به پنل مدیریت را ندارید.
            لطفاً با مدیر سیستم تماس بگیرید.
          </p>
        </div>

        {/* Version info */}
        <p className="text-xs text-muted-foreground/50 mt-4">
          زرین گلد — نسخه ۱.۰.۰
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin Footer                                                       */
/* ------------------------------------------------------------------ */

function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-gold/20 py-2 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between gap-1 text-[11px] text-muted-foreground/70 sm:flex-row">
        <span>© ۱۴۰۴ زرین گلد — تمامی حقوق محفوظ است</span>
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="transition-colors hover:text-gold/80"
            onClick={(e) => e.preventDefault()}
          >
            قوانین و مقررات
          </a>
          <span className="text-muted-foreground/30">|</span>
          <a
            href="#"
            className="transition-colors hover:text-gold/80"
            onClick={(e) => e.preventDefault()}
          >
            حریم خصوصی
          </a>
        </div>
        <span>نسخه ۱.۰.۰</span>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin Layout                                                       */
/* ------------------------------------------------------------------ */

export default function AdminLayout() {
  const { user, adminPage } = useAppStore();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  /* ── Access guard ── */
  if (!isAdmin) {
    return (
      <>
        <AdminAccessDenied />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 lg:block">
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
        </aside>
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="right"
            className="w-[280px] !p-0 bg-transparent border-none"
          >
            <SheetTitle className="sr-only">منوی مدیریت</SheetTitle>
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-1 flex-col">
        <AdminHeader onMenuToggle={() => setSidebarOpen(true)} />

        <main
          className={cn(
            'flex-1 px-4 py-6 md:px-6 lg:px-8',
            isMobile && 'pb-6'
          )}
        >
          {/* key={adminPage} forces re-mount on page change, triggering fade transition */}
          <div key={adminPage} className="admin-page-transition">
            <AdminPageRouter />
          </div>
        </main>

        <AdminFooter />
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
