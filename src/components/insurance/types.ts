// i18n: Insurance module type definitions

export interface InsuranceCategory {
  id: string;
  name: string;           // Farsi name
  slug: string;
  description: string;
  icon: string;           // Lucide icon name
  color: string;          // Theme color
  subtypes?: string[];    // e.g. ['سواری', 'وانت', 'کامیون']
  isActive: boolean;
  sortOrder: number;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  color: string;
}

export interface InsuranceCoverage {
  title: string;
  amount?: string;
  description: string;
}

export interface InsurancePlan {
  id: string;
  name: string;
  categoryId: string;
  providerId: string;
  provider?: InsuranceProvider;
  basePrice: number;
  sellingPrice: number;
  duration: string;         // e.g. '1 ماه (4 هفته)' or '1 ساله'
  durationDays: number;
  coverages: InsuranceCoverage[];
  status: 'active' | 'inactive';
  isPopular?: boolean;
}

export interface InsuranceOrder {
  id: string;
  userId: string;
  planId: string;
  plan?: InsurancePlan;
  category?: InsuranceCategory;
  providerName?: string;
  personalInfo: {
    holderName: string;
    holderPhone: string;
    holderNationalId: string;
    holderEmail?: string;
  };
  formData: Record<string, any>;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  amountPaid: number;
  policyNumber?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type InsuranceTab = 'categories' | 'products' | 'form' | 'plans' | 'checkout' | 'orders' | 'detail';

export type SortOption = 'cheapest' | 'expensive' | 'popular';
