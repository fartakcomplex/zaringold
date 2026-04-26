'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Eye, LogIn } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import CalculatorSection from '@/components/landing/CalculatorSection';
import SecuritySection from '@/components/landing/SecuritySection';
import PartnersSection from '@/components/landing/PartnersSection';
import AppDownloadSection from '@/components/landing/AppDownloadSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import ComparisonSection from '@/components/landing/ComparisonSection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';
import LoginDialog from '@/components/auth/LoginDialog';
import RegisterDialog from '@/components/auth/RegisterDialog';
import ToastContainer from '@/components/shared/ToastContainer';
import ScrollToTop from '@/components/shared/ScrollToTop';

/* ------------------------------------------------------------------ */
/*  Blog Landing Section (fetches latest 3 posts from API)              */
/* ------------------------------------------------------------------ */

interface BlogLandingPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  category: { name: string; slug: string; color: string } | null;
  readTime: number;
  publishedAt: string;
}

function BlogLandingSection({ onViewAll }: { onViewAll: () => void }) {
  const [posts, setPosts] = useState<BlogLandingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatestPosts() {
      try {
        const res = await fetch('/api/blog/posts?limit=3&featured=true');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const list: BlogLandingPost[] = data.posts || data || [];
        if (list.length > 0) setPosts(list);
      } catch {
        // No API posts available — section will not render
      } finally {
        setLoading(false);
      }
    }
    fetchLatestPosts();
  }, []);

  if (loading) return null;
  if (posts.length === 0) return null;

  const POST_EMOJIS = ['📊', '📈', '💎', '⭐', '💰', '🔮'];
  const getEmoji = (id: string) => POST_EMOJIS[id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % POST_EMOJIS.length];

  return (
    <section className="py-20" id="blog">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full bg-gold/10 px-4 py-1 text-xs font-medium text-gold">
            وبلاگ
          </span>
          <h2 className="mb-3 text-2xl font-extrabold sm:text-3xl">
            آخرین <span className="gold-gradient-text">مقالات</span>
          </h2>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground">
            جدیدترین اخبار، تحلیل‌ها و آموزش‌های بازار طلا را در وبلاگ زرین گلد بخوانید.
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <article
              key={post.id}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card transition-all hover:border-gold/20 hover:shadow-md"
              onClick={() => {
                useAppStore.getState().setBlogPostSlug(post.slug);
                onViewAll();
              }}
            >
              {post.featuredImage ? (
                <div className="h-40 overflow-hidden">
                  <img
                    src={post.featuredImage}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-gold/[0.08] to-gold/[0.02] text-5xl">
                  {getEmoji(post.id)}
                </div>
              )}
              <div className="p-5">
                {post.category && (
                  <span
                    className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: post.category.color + '18',
                      color: post.category.color,
                    }}
                  >
                    {post.category.name}
                  </span>
                )}
                <h3 className="mb-2 font-bold leading-relaxed line-clamp-2 group-hover:text-gold transition-colors">
                  {post.title}
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {(() => {
                      try {
                        return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(post.publishedAt));
                      } catch {
                        return post.publishedAt;
                      }
                    })()}
                  </span>
                  {post.readTime > 0 && <span>{post.readTime} دقیقه</span>}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-8 text-center">
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-6 py-2.5 text-sm font-medium text-gold transition-all hover:bg-gold/10 hover:border-gold/50"
          >
            مشاهده همه مقالات
            <svg className="size-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

/* Landing sub-pages */
import AboutPage from '@/components/landing/pages/AboutPage';
import ContactPage from '@/components/landing/pages/ContactPage';
import TermsPage from '@/components/landing/pages/TermsPage';
import PrivacyPage from '@/components/landing/pages/PrivacyPage';
import BlogPage from '@/components/landing/pages/BlogPage';
import BlogPostDetailPage from '@/components/landing/pages/BlogPostDetailPage';

/* ------------------------------------------------------------------ */
/*  Sub-page type                                                       */
/* ------------------------------------------------------------------ */

type LandingSubPage = 'about' | 'terms' | 'privacy' | 'contact' | 'blog' | 'blog-post' | null;

/* ------------------------------------------------------------------ */
/*  Landing Page Content (extracted for reuse)                          */
/* ------------------------------------------------------------------ */

function LandingPageContent({
  onLogin,
  subPage,
  onNavigate,
}: {
  onLogin: () => void;
  subPage: LandingSubPage;
  onNavigate: (page: LandingSubPage) => void;
}) {
  const handleBack = () => onNavigate(null);

  /* ── If a sub-page is active, render it with nav & footer ── */
  if (subPage) {
    let subContent: React.ReactNode;
    switch (subPage) {
      case 'about':
        subContent = <AboutPage onBack={handleBack} />;
        break;
      case 'contact':
        subContent = <ContactPage onBack={handleBack} onLogin={onLogin} />;
        break;
      case 'terms':
        subContent = <TermsPage onBack={handleBack} />;
        break;
      case 'privacy':
        subContent = <PrivacyPage onBack={handleBack} />;
        break;
      case 'blog':
        subContent = <BlogPage onBack={handleBack} onViewPost={(slug) => {
          useAppStore.getState().setBlogPostSlug(slug);
          onNavigate('blog-post');
        }} />;
        break;
      case 'blog-post':
        subContent = <BlogPostDetailPage onBack={handleBack} />;
        break;
      default:
        subContent = null;
        break;
    }

    return (
      <>
        <LandingNav onLogin={onLogin} />
        <div className="pt-16">{subContent}</div>
        <LandingFooter onNavigate={onNavigate} />
      </>
    );
  }

  return (
    <>
      <LandingNav onLogin={onLogin} />
      <HeroSection onGetStarted={onLogin} />
      <FeaturesSection />
      <HowItWorksSection />
      <CalculatorSection onLogin={onLogin} />
      <SecuritySection />
      <PartnersSection />
      <TestimonialsSection />
      <BlogLandingSection onViewAll={() => onNavigate('blog')} />
      <ComparisonSection />
      <FAQSection />
      <AppDownloadSection />
      <CTASection onGetStarted={onLogin} />
      <LandingFooter onNavigate={onNavigate} />
      <ScrollToTop />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating Preview Toggle (visible only when authenticated)            */
/* ------------------------------------------------------------------ */

function LandingPreviewToggle({ showLanding, onToggle }: { showLanding: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={showLanding ? 'بازگشت به پنل کاربری' : 'مشاهده لندینگ پیج'}
      className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full bg-[#1A1A1A] border border-white/[0.08] px-4 py-2.5 text-xs font-medium text-white shadow-[0_2px_16px_rgba(0,0,0,0.5)] transition-all duration-200 hover:bg-[#252525] active:scale-95 md:bottom-6 md:right-6"
    >
      {showLanding ? (
        <>
          <LogIn className="size-4 text-[#D4AF37]" />
          <span className="hidden sm:inline">پنل کاربری</span>
        </>
      ) : (
        <>
          <Eye className="size-4 text-[#D4AF37]" />
          <span className="hidden sm:inline">لندینگ پیج</span>
        </>
      )}
    </button>
  );
}
import DashboardView from '@/components/dashboard/DashboardView';
import TradeView from '@/components/gold/TradeView';
import WalletView from '@/components/wallet/WalletView';
import TransactionsView from '@/components/transactions/TransactionsView';
import ReferralView from '@/components/referral/ReferralView';
import ProfileView from '@/components/profile/ProfileView';
import SettingsView from '@/components/settings/SettingsView';
import SupportView from '@/components/support/SupportView';
import MarketView from '@/components/market/MarketView';
import SavingsView from '@/components/savings/SavingsView';
import EarnView from '@/components/earn/EarnView';
import NotificationsView from '@/components/notifications/NotificationsView';
import ChatView from '@/components/chat/ChatView';
import LoanView from '@/components/loan/LoanView';
/* New premium modules */
import SmartBuyAdvisor from '@/components/ai/SmartBuyAdvisor';
import PortfolioAnalytics from '@/components/analytics/PortfolioAnalytics';
import AIWealthCoach from '@/components/ai/AIWealthCoach';
import AutoSaveView from '@/components/autosave/AutoSaveView';
import SavingGoalsView from '@/components/goals/SavingGoalsView';
import GoldGiftCenter from '@/components/gifts/GoldGiftCenter';
import FamilyWalletView from '@/components/family/FamilyWalletView';
import SocialFeedView from '@/components/social/SocialFeedView';
import AchievementsView from '@/components/gamification/AchievementsView';
import DailyCheckIn from '@/components/gamification/DailyCheckIn';
import PricePredictionGame from '@/components/gamification/PricePredictionGame';
import VIPMembershipView from '@/components/vip/VIPMembershipView';
import CashbackCenter from '@/components/cashback/CashbackCenter';
import GoldVaultView from '@/components/vault/GoldVaultView';
import EmergencySellButton from '@/components/gold/EmergencySellButton';
import CreatorHub from '@/components/creator/CreatorHub';
import GoldCardView from '@/components/goldcard/GoldCardView';
import MerchantDashboard from '@/components/merchant/MerchantDashboard';
import QrPaymentView from '@/components/gateway/QrPaymentView';
import InvoiceView from '@/components/gateway/InvoiceView';
import FraudAlertsView from '@/components/gateway/FraudAlertsView';
import LoyaltyView from '@/components/gateway/LoyaltyView';
import ApiDocsView from '@/components/gateway/ApiDocsView';

/* ------------------------------------------------------------------ */
/*  Authenticated Page Router (User Panel)                             */
/* ------------------------------------------------------------------ */

function AuthenticatedPage() {
  const { currentPage } = useAppStore();

  switch (currentPage) {
    /* ── Main ── */
    case 'dashboard': return <DashboardView />;
    case 'trade': return <TradeView />;
    case 'wallet': return <WalletView />;
    case 'transactions': return <TransactionsView />;
    case 'market': return <MarketView />;

    /* ── Smart Tools ── */
    case 'smart-buy': return <SmartBuyAdvisor />;
    case 'analytics': return <PortfolioAnalytics />;
    case 'ai-coach': return <AIWealthCoach />;

    /* ── Saving & Loans ── */
    case 'autosave': return <AutoSaveView />;
    case 'goals': return <SavingGoalsView />;
    case 'savings': return <SavingsView />;
    case 'loans': return <LoanView />;

    /* ── Social ── */
    case 'creator-club': return <CreatorHub />;
    case 'referral': return <ReferralView />;
    case 'gifts': return <GoldGiftCenter />;
    case 'family-wallet': return <FamilyWalletView />;
    case 'social-feed': return <SocialFeedView />;

    /* ── Gamification ── */
    case 'achievements': return <AchievementsView />;
    case 'checkin': return <DailyCheckIn />;
    case 'prediction': return <PricePredictionGame />;
    case 'vip': return <VIPMembershipView />;
    case 'cashback': return <CashbackCenter />;
    case 'earn': return <EarnView />;

    /* ── Trust & Vault ── */
    case 'vault': return <GoldVaultView />;
    case 'emergency-sell': return <EmergencySellButton />;
    case 'gold-card': return <GoldCardView />;
    case 'merchant': return <MerchantDashboard />;
    case 'qr-payment': return <QrPaymentView />;
    case 'invoices': return <InvoiceView />;
    case 'fraud-alerts': return <FraudAlertsView />;
    case 'loyalty': return <LoyaltyView />;
    case 'api-docs': return <ApiDocsView />;

    /* ── Account ── */
    case 'notifications': return <NotificationsView />;
    case 'chat': return <ChatView />;
    case 'support': return <SupportView />;
    case 'profile': return <ProfileView />;
    case 'settings': return <SettingsView />;

    default: return <DashboardView />;
  }
}

/* ------------------------------------------------------------------ */
/*  Home Page                                                          */
/* ------------------------------------------------------------------ */

export default function Home() {
  const { isAuthenticated, currentPage, setPage, user } = useAppStore();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registeringUser, setRegisteringUser] = useState<any>(null);
  const [showLanding, setShowLanding] = useState(false);
  const [landingSubPage, setLandingSubPage] = useState<LandingSubPage>(null);

  /* ── Landing page toggle (authenticated users can preview landing) ── */
  if (isAuthenticated && showLanding) {
    return (
      <main className="min-h-screen">
        <LandingPreviewToggle showLanding={showLanding} onToggle={() => { setShowLanding(false); setLandingSubPage(null); }} />
        <LandingPageContent onLogin={() => {}} subPage={landingSubPage} onNavigate={setLandingSubPage} />
        <ToastContainer />
      </main>
    );
  }

  if (isAuthenticated) {
    // Admin users navigating to admin pages get the admin
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isOnAdminPage = currentPage === 'admin';

    if (isAdmin && isOnAdminPage) {
      return <AdminLayout />;
    }

    return (
      <>
        <LandingPreviewToggle showLanding={showLanding} onToggle={() => setShowLanding(true)} />
        <AppLayout>
          <AuthenticatedPage />
        </AppLayout>
      </>
    );
  }

  const handleLoginSuccess = (userData: any) => {
    setLoginOpen(false);
    if (userData?.isNewUser) {
      setRegisteringUser(userData);
      setRegisterOpen(true);
      return;
    }
    // If admin user logged in, go to admin panel
    const role = userData?.role || userData?.user?.role;
    if (role === 'admin' || role === 'super_admin') {
      setPage('admin');
    }
  };

  const handleRegisterComplete = () => {
    setRegisterOpen(false);
  };

  return (
    <main className="min-h-screen">
      <LandingPageContent onLogin={() => setLoginOpen(true)} subPage={landingSubPage} onNavigate={setLandingSubPage} />

      {/* Toast Notifications */}
      <ToastContainer />

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={handleLoginSuccess}
      />
      <RegisterDialog
        open={registerOpen}
        onOpenChange={(open) => {
          setRegisterOpen(open);
          if (!open) setRegisteringUser(null);
        }}
        onComplete={handleRegisterComplete}
        user={registeringUser}
      />
    </main>
  );
}
