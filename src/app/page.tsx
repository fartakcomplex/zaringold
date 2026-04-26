'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Eye, LogIn } from 'lucide-react';
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

export default function Home() {
  const { isAuthenticated, setPage, user } = useAppStore();
  const [loginOpen, setLoginOpen] = useState(false);

  if (isAuthenticated) {
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    if (isAdmin) setPage('admin');
    // For now, show landing to all authenticated users too
    // The full app panel will load dynamically
  }

  return (
    <main className="min-h-screen">
      <LandingNav onLogin={() => setLoginOpen(true)} />
      <HeroSection onGetStarted={() => setLoginOpen(true)} />
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <FAQSection />
      <CTASection onGetStarted={() => setLoginOpen(true)} />
      <LandingFooter onNavigate={() => {}} />
      <ScrollToTop />
      <ToastContainer />

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={(userData: any) => {
          setLoginOpen(false);
          const role = userData?.role || userData?.user?.role;
          if (role === 'admin' || role === 'super_admin') {
            setPage('admin');
          }
        }}
      />
    </main>
  );
}
