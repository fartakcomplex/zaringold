'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAppStore } from '@/lib/store';
import { Eye, LogIn } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import SecuritySection from '@/components/landing/SecuritySection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';
import LoginDialog from '@/components/auth/LoginDialog';
import ToastContainer from '@/components/shared/ToastContainer';
import ScrollToTop from '@/components/shared/ScrollToTop';
import { useTranslation } from '@/lib/i18n';

/* Lazy-loaded landing sections */
const CalculatorSection = lazy(() => import('@/components/landing/CalculatorSection').then(m => ({ default: m.default })));
const PartnersSection = lazy(() => import('@/components/landing/PartnersSection').then(m => ({ default: m.default })));
const TestimonialsSection = lazy(() => import('@/components/landing/TestimonialsSection').then(m => ({ default: m.default })));
const ComparisonSection = lazy(() => import('@/components/landing/ComparisonSection').then(m => ({ default: m.default })));
const AppDownloadSection = lazy(() => import('@/components/landing/AppDownloadSection').then(m => ({ default: m.default })));
const RegisterDialog = lazy(() => import('@/components/auth/RegisterDialog').then(m => ({ default: m.default })));

/* Lazy-loaded authenticated views */
const DashboardView = lazy(() => import('@/components/dashboard/DashboardView').then(m => ({ default: m.default })));
const TradeView = lazy(() => import('@/components/gold/TradeView').then(m => ({ default: m.default })));
const WalletView = lazy(() => import('@/components/wallet/WalletView').then(m => ({ default: m.default })));
const TransactionsView = lazy(() => import('@/components/transactions/TransactionsView').then(m => ({ default: m.default })));
const MarketView = lazy(() => import('@/components/market/MarketView').then(m => ({ default: m.default })));
const ProfileView = lazy(() => import('@/components/profile/ProfileView').then(m => ({ default: m.default })));
const SettingsView = lazy(() => import('@/components/settings/SettingsView').then(m => ({ default: m.default })));
const SupportView = lazy(() => import('@/components/support/SupportView').then(m => ({ default: m.default })));
const NotificationsView = lazy(() => import('@/components/notifications/NotificationsView').then(m => ({ default: m.default })));
const ChatView = lazy(() => import('@/components/chat/ChatView').then(m => ({ default: m.default })));
const ReferralView = lazy(() => import('@/components/referral/ReferralView').then(m => ({ default: m.default })));
const SavingsView = lazy(() => import('@/components/savings/SavingsView').then(m => ({ default: m.default })));
const EarnView = lazy(() => import('@/components/earn/EarnView').then(m => ({ default: m.default })));
const LoanView = lazy(() => import('@/components/loan/LoanView').then(m => ({ default: m.default })));
const SmartBuyAdvisor = lazy(() => import('@/components/ai/SmartBuyAdvisor').then(m => ({ default: m.default })));
const PortfolioAnalytics = lazy(() => import('@/components/analytics/PortfolioAnalytics').then(m => ({ default: m.default })));
const AIWealthCoach = lazy(() => import('@/components/ai/AIWealthCoach').then(m => ({ default: m.default })));
const AutoSaveView = lazy(() => import('@/components/autosave/AutoSaveView').then(m => ({ default: m.default })));
const SavingGoalsView = lazy(() => import('@/components/goals/SavingGoalsView').then(m => ({ default: m.default })));
const GoldGiftCenter = lazy(() => import('@/components/gifts/GoldGiftCenter').then(m => ({ default: m.default })));
const FamilyWalletView = lazy(() => import('@/components/family/FamilyWalletView').then(m => ({ default: m.default })));
const SocialFeedView = lazy(() => import('@/components/social/SocialFeedView').then(m => ({ default: m.default })));
const AchievementsView = lazy(() => import('@/components/gamification/AchievementsView').then(m => ({ default: m.default })));
const DailyCheckIn = lazy(() => import('@/components/gamification/DailyCheckIn').then(m => ({ default: m.default })));
const PricePredictionGame = lazy(() => import('@/components/gamification/PricePredictionGame').then(m => ({ default: m.default })));
const VIPMembershipView = lazy(() => import('@/components/vip/VIPMembershipView').then(m => ({ default: m.default })));
const CashbackCenter = lazy(() => import('@/components/cashback/CashbackCenter').then(m => ({ default: m.default })));
const GoldVaultView = lazy(() => import('@/components/vault/GoldVaultView').then(m => ({ default: m.default })));
const EmergencySellButton = lazy(() => import('@/components/gold/EmergencySellButton').then(m => ({ default: m.default })));
const CreatorHub = lazy(() => import('@/components/creator/CreatorHub').then(m => ({ default: m.default })));
const GoldCardView = lazy(() => import('@/components/goldcard/GoldCardView').then(m => ({ default: m.default })));
const GoldTransferView = lazy(() => import('@/components/transfer/GoldTransferView').then(m => ({ default: m.default })));
const MerchantDashboard = lazy(() => import('@/components/merchant/MerchantDashboard').then(m => ({ default: m.default })));
const QrPaymentView = lazy(() => import('@/components/gateway/QrPaymentView').then(m => ({ default: m.default })));
const InvoiceView = lazy(() => import('@/components/gateway/InvoiceView').then(m => ({ default: m.default })));
const FraudAlertsView = lazy(() => import('@/components/gateway/FraudAlertsView').then(m => ({ default: m.default })));
const LoyaltyView = lazy(() => import('@/components/gateway/LoyaltyView').then(m => ({ default: m.default })));
const ApiDocsView = lazy(() => import('@/components/gateway/ApiDocsView').then(m => ({ default: m.default })));
const InsuranceView = lazy(() => import('@/components/insurance/InsuranceView').then(m => ({ default: m.default })));
const CarServicesView = lazy(() => import('@/components/car-services/CarServicesView').then(m => ({ default: m.default })));
const UtilityServicesView = lazy(() => import('@/components/utility-services/UtilityServicesView').then(m => ({ default: m.default })));

/* ── Loading fallback ── */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
      </div>
    </div>
  );
}

/* ── Authenticated Page Router ── */
function AuthenticatedPage() {
  const { currentPage } = useAppStore();
  switch (currentPage) {
    case 'dashboard': return <DashboardView />;
    case 'trade': return <TradeView />;
    case 'wallet': return <WalletView />;
    case 'transactions': return <TransactionsView />;
    case 'market': return <MarketView />;
    case 'smart-buy': return <SmartBuyAdvisor />;
    case 'analytics': return <PortfolioAnalytics />;
    case 'ai-coach': return <AIWealthCoach />;
    case 'autosave': return <AutoSaveView />;
    case 'goals': return <SavingGoalsView />;
    case 'savings': return <SavingsView />;
    case 'loans': return <LoanView />;
    case 'creator-club': return <CreatorHub />;
    case 'referral': return <ReferralView />;
    case 'gifts': return <GoldGiftCenter />;
    case 'family-wallet': return <FamilyWalletView />;
    case 'social-feed': return <SocialFeedView />;
    case 'achievements': return <AchievementsView />;
    case 'checkin': return <DailyCheckIn />;
    case 'prediction': return <PricePredictionGame />;
    case 'vip': return <VIPMembershipView />;
    case 'cashback': return <CashbackCenter />;
    case 'earn': return <EarnView />;
    case 'vault': return <GoldVaultView />;
    case 'emergency-sell': return <EmergencySellButton />;
    case 'gold-card': return <GoldCardView />;
    case 'gold-transfer': return <GoldTransferView />;
    case 'merchant': return <MerchantDashboard />;
    case 'qr-payment': return <QrPaymentView />;
    case 'invoices': return <InvoiceView />;
    case 'fraud-alerts': return <FraudAlertsView />;
    case 'loyalty': return <LoyaltyView />;
    case 'api-docs': return <ApiDocsView />;
    case 'insurance': return <InsuranceView />;
    case 'car-services': return <CarServicesView />;
    case 'utility': return <UtilityServicesView />;
    case 'notifications': return <NotificationsView />;
    case 'chat': return <ChatView />;
    case 'support': return <SupportView />;
    case 'profile': return <ProfileView />;
    case 'settings': return <SettingsView />;
    default: return <DashboardView />;
  }
}

/* ── Floating Preview Toggle ── */
function LandingPreviewToggle({ showLanding, onToggle }: { showLanding: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onToggle}
      title={showLanding ? t('toggle.backToDashboard') : t('toggle.viewLanding')}
      className="fixed bottom-20 right-4 z-[60] flex items-center gap-2 rounded-full bg-[#1A1A1A] border border-white/[0.08] px-4 py-2.5 text-xs font-medium text-white shadow-[0_2px_16px_rgba(0,0,0,0.5)] transition-all duration-200 hover:bg-[#252525] active:scale-95 md:bottom-6 md:right-6"
    >
      {showLanding ? (
        <><LogIn className="size-4 text-[#D4AF37]" /><span className="hidden sm:inline">{t('toggle.dashboard')}</span></>
      ) : (
        <><Eye className="size-4 text-[#D4AF37]" /><span className="hidden sm:inline">{t('toggle.landingPage')}</span></>
      )}
    </button>
  );
}

/* ── Home Page ── */
export default function Home() {
  const { isAuthenticated, currentPage, setPage, user } = useAppStore();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registeringUser, setRegisteringUser] = useState<any>(null);
  const [showLanding, setShowLanding] = useState(false);

  /* Authenticated → dashboard or admin */
  if (isAuthenticated) {
    if (showLanding) {
      return (
        <main className="min-h-screen">
          <LandingPreviewToggle showLanding={showLanding} onToggle={() => setShowLanding(false)} />
          <LandingNav onLogin={() => {}} />
          <HeroSection onGetStarted={() => {}} />
          <FeaturesSection />
          <HowItWorksSection />
          <SecuritySection />
          <FAQSection />
          <CTASection onGetStarted={() => {}} />
          <LandingFooter onNavigate={() => {}} />
          <ScrollToTop />
          <ToastContainer />
        </main>
      );
    }

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    if (isAdmin && currentPage === 'admin') return <AdminLayout />;

    return (
      <>
        <LandingPreviewToggle showLanding={showLanding} onToggle={() => setShowLanding(true)} />
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            <AuthenticatedPage />
          </Suspense>
        </AppLayout>
      </>
    );
  }

  /* Guest → Landing Page */
  return (
    <main className="min-h-screen">
      <LandingNav onLogin={() => setLoginOpen(true)} />
      <HeroSection onGetStarted={() => setLoginOpen(true)} />
      <FeaturesSection />
      <HowItWorksSection />
      <Suspense fallback={<PageLoader />}>
        <CalculatorSection onLogin={() => setLoginOpen(true)} />
        <SecuritySection />
        <PartnersSection />
        <TestimonialsSection />
        <ComparisonSection />
        <FAQSection />
        <AppDownloadSection />
      </Suspense>
      <CTASection onGetStarted={() => setLoginOpen(true)} />
      <LandingFooter onNavigate={() => {}} />
      <ScrollToTop />
      <ToastContainer />

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={(userData: any) => {
          setLoginOpen(false);
          if (userData?.isNewUser) { setRegisteringUser(userData); setRegisterOpen(true); return; }
          const role = userData?.role || userData?.user?.role;
          if (role === 'admin' || role === 'super_admin') setPage('admin');
        }}
      />
      {registerOpen && (
        <Suspense fallback={null}>
          <RegisterDialog
            open={registerOpen}
            onOpenChange={(open) => { setRegisterOpen(open); if (!open) setRegisteringUser(null); }}
            onComplete={() => setRegisterOpen(false)}
            user={registeringUser}
          />
        </Suspense>
      )}
    </main>
  );
}
