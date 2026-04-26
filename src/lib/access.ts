/**
 * Access Control & Diamond Plan for Super Admin
 * 
 * Super admin automatically gets Diamond plan with ALL restrictions removed:
 * - Zero fees on all transactions
 * - Unlimited price alerts
 * - Unlimited gift amounts
 * - Unlimited social posts
 * - No loan restrictions
 * - 10x cashback multiplier
 * - All VIP features unlocked
 */

import { db } from '@/lib/db'

export type UserPlan = 'free' | 'silver' | 'gold' | 'black' | 'diamond'

export interface AccessInfo {
  isSuperAdmin: boolean
  plan: UserPlan
  planLabel: string
  /** Zero fees for diamond/super_admin */
  zeroFees: boolean
  /** Buy fee rate (0 for diamond) */
  buyFeeRate: number
  /** Sell fee rate (0 for diamond) */
  sellFeeRate: number
  /** Max price alerts (∞ for diamond) */
  maxAlerts: number
  /** Max gift grams (∞ for diamond) */
  maxGiftGrams: number
  /** Max social post characters (∞ for diamond) */
  maxPostChars: number
  /** Cashback multiplier (10x for diamond) */
  cashbackMultiplier: number
  /** All features unlocked */
  allFeaturesUnlocked: boolean
}

const PLAN_LABELS: Record<UserPlan, string> = {
  free: 'رایگان',
  silver: 'نقره‌ای',
  gold: 'طلایی',
  black: 'مشکی',
  diamond: 'الماس 💎',
}

const DIAMOND_ACCESS: AccessInfo = {
  isSuperAdmin: true,
  plan: 'diamond',
  planLabel: PLAN_LABELS.diamond,
  zeroFees: true,
  buyFeeRate: 0,
  sellFeeRate: 0,
  maxAlerts: Infinity,
  maxGiftGrams: Infinity,
  maxPostChars: Infinity,
  cashbackMultiplier: 10,
  allFeaturesUnlocked: true,
}

/**
 * Get access info for a user. 
 * Super admin always gets Diamond plan regardless of VIP subscription.
 */
export async function getUserAccess(userId: string): Promise<AccessInfo> {
  // Check if user is super_admin
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (user?.role === 'super_admin') {
    return DIAMOND_ACCESS
  }

  // Check VIP subscription for other users
  const subscription = await db.vIPSubscription.findFirst({
    where: { userId, isActive: true, expiresAt: { gt: new Date() } },
  })

  if (!subscription) {
    return {
      isSuperAdmin: false,
      plan: 'free',
      planLabel: PLAN_LABELS.free,
      zeroFees: false,
      buyFeeRate: 0.005,
      sellFeeRate: 0.003,
      maxAlerts: 10,
      maxGiftGrams: 100,
      maxPostChars: 500,
      cashbackMultiplier: 1,
      allFeaturesUnlocked: false,
    }
  }

  const plan = subscription.plan as UserPlan

  switch (plan) {
    case 'silver':
      return {
        isSuperAdmin: false,
        plan: 'silver',
        planLabel: PLAN_LABELS.silver,
        zeroFees: false,
        buyFeeRate: 0.004,
        sellFeeRate: 0.0025,
        maxAlerts: 20,
        maxGiftGrams: 200,
        maxPostChars: 700,
        cashbackMultiplier: 2,
        allFeaturesUnlocked: false,
      }
    case 'gold':
      return {
        isSuperAdmin: false,
        plan: 'gold',
        planLabel: PLAN_LABELS.gold,
        zeroFees: true,
        buyFeeRate: 0,
        sellFeeRate: 0,
        maxAlerts: 50,
        maxGiftGrams: 500,
        maxPostChars: 1000,
        cashbackMultiplier: 3,
        allFeaturesUnlocked: true,
      }
    case 'black':
      return {
        isSuperAdmin: false,
        plan: 'black',
        planLabel: PLAN_LABELS.black,
        zeroFees: true,
        buyFeeRate: 0,
        sellFeeRate: 0,
        maxAlerts: 100,
        maxGiftGrams: 1000,
        maxPostChars: 2000,
        cashbackMultiplier: 5,
        allFeaturesUnlocked: true,
      }
    default:
      return {
        isSuperAdmin: false,
        plan: 'free',
        planLabel: PLAN_LABELS.free,
        zeroFees: false,
        buyFeeRate: 0.005,
        sellFeeRate: 0.003,
        maxAlerts: 10,
        maxGiftGrams: 100,
        maxPostChars: 500,
        cashbackMultiplier: 1,
        allFeaturesUnlocked: false,
      }
  }
}
