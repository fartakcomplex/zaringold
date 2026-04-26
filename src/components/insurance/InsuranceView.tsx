'use client';

import React, { useState, useCallback } from 'react';
import {
  Shield,
  History,
  LayoutGrid,
  Sparkles,
  ChevronLeft,
  Zap,
  Flame,
  Car,
  Heart,
  Umbrella,
  Home,
  Plane,
  Briefcase,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import { useAppStore } from '@/lib/store';
import InsuranceCategories from './InsuranceCategories';
import InsuranceForm from './InsuranceForm';
import InsurancePlans from './InsurancePlans';
import InsuranceCheckout from './InsuranceCheckout';
import InsuranceOrderHistory from './InsuranceOrderHistory';
import InsuranceOrderDetail from './InsuranceOrderDetail';
import type {
  InsuranceTab,
  InsuranceCategory,
  InsurancePlan,
  InsuranceOrder,
} from './types';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Quick Access Categories                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const QUICK_CATEGORIES = [
  { id: 'third-party', name: 'شخص ثالث', nameEn: 'Third Party', icon: Car, color: '#34D399', bg: '#34D39915' },
  { id: 'body', name: 'بدنه', nameEn: 'Body', icon: Shield, color: '#60A5FA', bg: '#60A5FA15' },
  { id: 'fire', name: 'آتش‌سوزی', nameEn: 'Fire', icon: Flame, color: '#F87171', bg: '#F8717115' },
  { id: 'health', name: 'تکمیلی', nameEn: 'Health', icon: Heart, color: '#F472B6', bg: '#F472B615' },
  { id: 'travel', name: 'مسافرتی', nameEn: 'Travel', icon: Plane, color: '#FBBF24', bg: '#FBBF2415' },
  { id: 'life', name: 'عمر', nameEn: 'Life', icon: Umbrella, color: '#A78BFA', bg: '#A78BFA15' },
  { id: 'home', name: 'عمر', nameEn: 'Home', icon: Home, color: '#FB923C', bg: '#FB923C15' },
  { id: 'business', name: 'مسئولیت', nameEn: 'Business', icon: Briefcase, color: '#2DD4BF', bg: '#2DD4BF15' },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Nav Tabs                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const NAV_TABS: { value: InsuranceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'categories', label: 'خرید بیمه', icon: LayoutGrid },
  { value: 'orders', label: 'بیمه‌نامه‌های من', icon: History },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function InsuranceView() {
  const { dir } = useTranslation();
  const { pageEvent, setPage } = useAppStore();

  // Navigation state
  const [activeTab, setActiveTab] = useState<InsuranceTab>('categories');

  // Category/Form/Plans/Checkout flow state
  const [selectedCategory, setSelectedCategory] = useState<InsuranceCategory | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<InsurancePlan | null>(null);

  // Form data
  const [personalInfo, setPersonalInfo] = useState({
    holderName: '',
    holderPhone: '',
    holderNationalId: '',
    holderEmail: '',
  });
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Order state
  const [selectedOrder, setSelectedOrder] = useState<InsuranceOrder | null>(null);

  /* ── Handlers ── */

  const handleSelectCategory = useCallback((category: InsuranceCategory) => {
    setSelectedCategory(category);
    setActiveTab('form');
  }, []);

  const handleCalculatePrice = useCallback(() => {
    if (selectedCategory) {
      setActiveTab('plans');
    }
  }, [selectedCategory]);

  const handleSelectPlan = useCallback((plan: InsurancePlan) => {
    setSelectedPlan(plan);
    setActiveTab('checkout');
  }, []);

  const handleCheckoutSuccess = useCallback((_orderId: string) => {
    setSelectedCategory(null);
    setSelectedPlan(null);
    setPersonalInfo({
      holderName: '',
      holderPhone: '',
      holderNationalId: '',
      holderEmail: '',
    });
    setFormData({});
    setActiveTab('orders');
  }, []);

  const handleViewOrderDetail = useCallback((order: InsuranceOrder) => {
    setSelectedOrder(order);
    setActiveTab('detail');
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedOrder(null);
    setActiveTab('orders');
  }, []);

  const handleBackFromForm = useCallback(() => {
    setSelectedCategory(null);
    setActiveTab('categories');
  }, []);

  const handleBackFromPlans = useCallback(() => {
    setActiveTab('form');
  }, []);

  const handleBackFromCheckout = useCallback(() => {
    setActiveTab('plans');
  }, []);

  // Handle quick actions from MobileQuickActions
  const handleQuickAction = useCallback((slug: string) => {
    setActiveTab('categories');
    setSelectedCategory(null);
  }, []);

  // When switching main tab, reset sub-state
  const handleMainTabChange = useCallback((tab: InsuranceTab) => {
    setActiveTab(tab);
    if (tab === 'categories') {
      setSelectedCategory(null);
      setSelectedPlan(null);
      setPersonalInfo({
        holderName: '',
        holderPhone: '',
        holderNationalId: '',
        holderEmail: '',
      });
      setFormData({});
    }
    if (tab === 'orders') {
      setSelectedCategory(null);
      setSelectedPlan(null);
      setSelectedOrder(null);
    }
  }, []);

  /* ── Determine which view to show ── */
  const isSubView = ['form', 'plans', 'checkout', 'detail'].includes(activeTab);
  const showNavTabs = !isSubView;

  return (
    <div dir={dir} className="min-h-screen bg-background">
      {/* Page Header - Compact mobile-friendly */}
      {!isSubView && (
        <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
                <Shield className="h-4.5 w-4.5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-sm font-bold text-foreground leading-tight">
                  بیمه
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  خرید و مدیریت بیمه‌نامه
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('orders')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <History className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-view header with back button */}
      {isSubView && (
        <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="mx-auto max-w-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (activeTab === 'form') handleBackFromForm();
                  else if (activeTab === 'plans') handleBackFromPlans();
                  else if (activeTab === 'checkout') handleBackFromCheckout();
                  else if (activeTab === 'detail') handleBackFromDetail();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h1 className="text-sm font-bold text-foreground">
                {activeTab === 'form' && selectedCategory?.name}
                {activeTab === 'plans' && 'انتخاب طرح'}
                {activeTab === 'checkout' && 'پرداخت'}
                {activeTab === 'detail' && 'جزئیات بیمه‌نامه'}
              </h1>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* Main Navigation Tabs - Horizontal scrollable pills */}
        {showNavTabs && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {NAV_TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleMainTabChange(tab.value)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                    activeTab === tab.value
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* View Content */}
        <AnimatePresence>
          {activeTab === 'categories' && (
            <>
              {/* Hero Banner - Mobile First */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-5 mb-5">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 translate-y-8" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base">بیمه مناسب خودت رو پیدا کن</h2>
                    <p className="text-white/70 text-xs mt-0.5">بهترین قیمت از معتبرترین شرکت‌ها</p>
                  </div>
                </div>
              </div>

              {/* Quick Access Grid - 4 cols on mobile */}
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-1">دسترسی سریع</h3>
                <div className="grid grid-cols-4 gap-2.5">
                  {QUICK_CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          const mockCat: InsuranceCategory = {
                            id: cat.id,
                            name: cat.name,
                            slug: cat.id,
                            description: '',
                            icon: cat.id,
                            color: cat.color,
                            sortOrder: 0,
                            isActive: true,
                            plans: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          };
                          handleSelectCategory(mockCat);
                        }}
                        className="group flex flex-col items-center gap-2 py-3 rounded-2xl bg-card border border-border/50 transition-all duration-200 active:scale-[0.95] hover:border-border"
                      >
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                          style={{ backgroundColor: cat.bg }}
                        >
                          <CatIcon className="h-5 w-5" style={{ color: cat.color }} />
                        </div>
                        <span className="text-[10px] font-medium text-foreground leading-tight truncate">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Insurance Categories List */}
              <InsuranceCategories onSelectCategory={handleSelectCategory} />
            </>
          )}

          {activeTab === 'form' && selectedCategory && (
            <InsuranceForm
              key={selectedCategory.id}
              category={selectedCategory}
              personalInfo={personalInfo}
              setPersonalInfo={setPersonalInfo}
              formData={formData}
              setFormData={setFormData}
              onCalculatePrice={handleCalculatePrice}
              onBack={handleBackFromForm}
            />
          )}

          {activeTab === 'plans' && selectedCategory && (
            <InsurancePlans
              key={selectedCategory.id}
              category={selectedCategory}
              onSelectPlan={handleSelectPlan}
              onBack={handleBackFromPlans}
            />
          )}

          {activeTab === 'checkout' && selectedCategory && selectedPlan && (
            <InsuranceCheckout
              key={selectedPlan.id}
              category={selectedCategory}
              plan={selectedPlan}
              personalInfo={personalInfo}
              formData={formData}
              onBack={handleBackFromCheckout}
              onSuccess={handleCheckoutSuccess}
            />
          )}

          {activeTab === 'orders' && (
            <InsuranceOrderHistory onViewDetail={handleViewOrderDetail} />
          )}

          {activeTab === 'detail' && selectedOrder && (
            <InsuranceOrderDetail
              key={selectedOrder.id}
              order={selectedOrder}
              onBack={handleBackFromDetail}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
