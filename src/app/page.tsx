"use client";

import { Navbar } from "@/components/zaringold/Navbar";
import { HeroSection } from "@/components/zaringold/HeroSection";
import { GoldPricesSection } from "@/components/zaringold/GoldPrices";
import { FeatureGrid } from "@/components/zaringold/FeatureGrid";
import { MobileServices } from "@/components/zaringold/MobileServices";
import { ServicesGrid } from "@/components/zaringold/ServicesGrid";
import { WalletOverview } from "@/components/zaringold/WalletOverview";
import { AIAdvisor } from "@/components/zaringold/AIAdvisor";
import { Footer } from "@/components/zaringold/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24">
        <HeroSection />
        <GoldPricesSection />

        {/* Features Section */}
        <section id="features" className="scroll-mt-24">
          <FeatureGrid />
        </section>

        <MobileServices />
        <ServicesGrid />
        <WalletOverview />
        <AIAdvisor />
      </main>

      <Footer />
    </div>
  );
}
