'use client';

import React, { useState, useCallback } from 'react';
import {
  Shield,
  History,
  LayoutGrid,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { motion, AnimatePresence } from '@/lib/framer-compat';
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
    // Navigate to order history after successful purchase
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
      {/* Page Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-gold/5">
              <Shield className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">
                {/* i18n */}بیمه
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {/* i18n */}خرید و مدیریت بیمه‌نامه
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Main Navigation Tabs */}
        {showNavTabs && (
          <div className="mb-6 flex gap-2">
            {NAV_TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleMainTabChange(tab.value)}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.value
                      ? 'bg-gold/10 text-gold border border-gold/20 shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  {/* i18n */}{tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* View Content */}
        <AnimatePresence>
          {activeTab === 'categories' && (
            <InsuranceCategories onSelectCategory={handleSelectCategory} />
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
