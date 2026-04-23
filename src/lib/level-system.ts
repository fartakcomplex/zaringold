/**
 * Level System — User Trust & Feature Gating
 * 
 * Levels: none → bronze → silver → gold → diamond
 * 
 * none:    New user, must complete profile
 * bronze:  Profile completed (fullName + nationalId)
 * silver:  KYC verified
 * gold:    At least 1 successful gold purchase
 * diamond: Elite — high activity + wallet balance thresholds
 */

export type UserLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond'

export interface LevelInfo {
  key: UserLevel
  labelFa: string
  labelEn: string
  icon: string          // emoji
  color: string         // Tailwind color class
  bgColor: string       // Background class
  borderColor: string   // Border class
  textColor: string     // Text class
  gradient: string      // CSS gradient
  description: string
  requirements: string[]
  unlockedFeatures: string[]
  minFiatBalance: number   // For diamond
  minGoldBalance: number   // For diamond
  minTransactions: number  // For diamond
}

export const LEVELS: Record<UserLevel, LevelInfo> = {
  none: {
    key: 'none',
    labelFa: 'تازه‌کار',
    labelEn: 'New',
    icon: '👶',
    color: 'text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800/50',
    borderColor: 'border-gray-300 dark:border-gray-700',
    textColor: 'text-gray-500 dark:text-gray-400',
    gradient: 'from-gray-400 to-gray-500',
    description: 'کاربر جدید — لطفاً پروفایل خود را تکمیل کنید',
    requirements: ['تکمیل نام و نام خانوادگی', 'وارد کردن کد ملی'],
    unlockedFeatures: ['مشاهده قیمت طلا', 'صفحه فرود'],
    minFiatBalance: 0,
    minGoldBalance: 0,
    minTransactions: 0,
  },
  bronze: {
    key: 'bronze',
    labelFa: 'برنزی',
    labelEn: 'Bronze',
    icon: '🥉',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-300 dark:border-amber-700',
    textColor: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-600 to-amber-800',
    description: 'سطح برنزی — امکانات پایه فعال شد',
    requirements: ['تکمیل پروفایل کاربری'],
    unlockedFeatures: [
      'خرید و فروش طلای خام',
      'مشاهده کیف پول واحد طلایی و طلایی',
      'مشاهده نمودار قیمت',
      'تنظیم هشدار قیمت',
      'شارژ کیف پول واحد طلایی',
      'باشگاه مشتریان',
      'دریافت هدیه طلا',
    ],
    minFiatBalance: 0,
    minGoldBalance: 0,
    minTransactions: 0,
  },
  silver: {
    key: 'silver',
    labelFa: 'نقره‌ای',
    labelEn: 'Silver',
    icon: '🥈',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800/30',
    borderColor: 'border-gray-300 dark:border-gray-600',
    textColor: 'text-gray-500 dark:text-gray-300',
    gradient: 'from-gray-300 to-gray-500',
    description: 'سطح نقره‌ای — احراز هویت انجام شد',
    requirements: ['احراز هویت (KYC) تأیید شده'],
    unlockedFeatures: [
      'تمام امکانات سطح برنزی',
      'انتقال طلا به دیگران',
      'کارت طلایی مجازی',
      'ثبت اهداف پس‌انداز',
      'خرید خودکار طلای خرد',
      'وام طلایی',
      'جامعه اجتماعی',
      'بخش آموزش',
      'پشتیبانی تیکت',
    ],
    minFiatBalance: 0,
    minGoldBalance: 0,
    minTransactions: 0,
  },
  gold: {
    key: 'gold',
    labelFa: 'طلایی',
    labelEn: 'Gold',
    icon: '🥇',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-400 dark:border-yellow-600',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    gradient: 'from-yellow-400 to-amber-600',
    description: 'سطح طلایی — معامله‌گر فعال',
    requirements: ['حداقل ۱ خرید طلای موفق'],
    unlockedFeatures: [
      'تمام امکانات سطح نقره‌ای',
      'معاملات خودکار',
      'تحلیل‌گر هوشمند بازار',
      'گزارش حرفه‌ای سبد دارایی',
      'کیف پول خانوادگی',
      'بخش کریتور کلاب',
      'حمل و نقل طلای فیزیکی',
      'نرخ کارمزد ویژه',
    ],
    minFiatBalance: 0,
    minGoldBalance: 0,
    minTransactions: 1,
  },
  diamond: {
    key: 'diamond',
    labelFa: 'الماسی',
    labelEn: 'Diamond',
    icon: '💎',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-300 dark:border-cyan-600',
    textColor: 'text-cyan-500 dark:text-cyan-400',
    gradient: 'from-cyan-400 to-blue-600',
    description: 'سطح الماسی — کاربر ویژه و خفن!',
    requirements: [
      'حداقل ۱۰ تراکنش موفق',
      'حداقل ۱۰۰,۰۰۰,۰۰۰ واحد طلایی موجودی',
      'حداقل ۱ گرم طلای موجودی',
    ],
    unlockedFeatures: [
      'تمام امکانات سطح طلایی',
      'خرید طلای فیزیکی',
      'کارمزد صفر تراکنش',
      'مشاوره ویژه سرمایه‌گذاری',
      'اولویت در پشتیبانی',
      'درگاه پرداخت طلایی (پذیرنده)',
      'دسترسی زودتر به امکانات جدید',
      'نشان ویژه الماسی در پروفایل',
    ],
    minFiatBalance: 100000000,  // 100M toman
    minGoldBalance: 1.0,        // 1 gram
    minTransactions: 10,
  },
}

export const LEVEL_ORDER: UserLevel[] = ['none', 'bronze', 'silver', 'gold', 'diamond']

export function getLevelInfo(level: UserLevel): LevelInfo {
  return LEVELS[level]
}

export function getNextLevel(currentLevel: UserLevel): LevelInfo | null {
  const idx = LEVEL_ORDER.indexOf(currentLevel)
  if (idx >= LEVEL_ORDER.length - 1) return null
  return LEVELS[LEVEL_ORDER[idx + 1]]
}

export function getLevelProgress(currentLevel: UserLevel): number {
  const idx = LEVEL_ORDER.indexOf(currentLevel)
  return ((idx) / (LEVEL_ORDER.length - 1)) * 100
}

export function canAccessFeature(userLevel: UserLevel, requiredLevel: UserLevel): boolean {
  const userIdx = LEVEL_ORDER.indexOf(userLevel)
  const reqIdx = LEVEL_ORDER.indexOf(requiredLevel)
  return userIdx >= reqIdx
}

export function getFeatureRequiredLevel(feature: string): UserLevel {
  // Features that require specific levels
  if (['buy', 'sell', 'wallet', 'chart', 'alerts', 'deposit', 'gamification', 'gifts'].includes(feature)) {
    return 'bronze'
  }
  if (['transfer', 'gold-card', 'goals', 'autosave', 'loans', 'social', 'education', 'tickets', 'kyc'].includes(feature)) {
    return 'silver'
  }
  if (['auto-trade', 'ai-coach', 'analytics', 'family-wallet', 'creator', 'physical-gold', 'special-rate'].includes(feature)) {
    return 'gold'
  }
  if (['physical-gold-premium', 'zero-fee', 'vip-support', 'merchant', 'early-access', 'investment-advisor'].includes(feature)) {
    return 'diamond'
  }
  return 'none'
}

export function getLevelUpgradePrompt(currentLevel: UserLevel): {
  title: string
  description: string
  action: string
  actionRoute: string
} | null {
  switch (currentLevel) {
    case 'none':
      return {
        title: 'پروفایل خود را تکمیل کنید',
        description: 'با تکمیل پروفایل به سطح برنزی برسید و امکانات خرید و فروش طلا فعال شود',
        action: 'تکمیل پروفایل',
        actionRoute: 'profile-complete',
      }
    case 'bronze':
      return {
        title: 'احراز هویت شوید',
        description: 'با احراز هویت به سطح نقره‌ای برسید و از امکانات پیشرفته مثل انتقال طلا و وام طلایی بهره‌مند شوید',
        action: 'شروع احراز هویت',
        actionRoute: 'profile',
      }
    case 'silver':
      return {
        title: 'اولین خرید طلای خود را انجام دهید',
        description: 'با اولین خرید طلای موفق به سطح طلایی برسید و معاملات خودکار و تحلیل هوشمند بازار فعال شود',
        action: 'خرید طلا',
        actionRoute: 'trade',
      }
    case 'gold':
      return {
        title: 'به سطح الماسی نزدیک شوید',
        description: 'با افزایش فعالیت و موجودی کیف پول به سطح الماسی برسید و از تمام امکانات ویژه استفاده کنید',
        action: 'مشاهده شرایط',
        actionRoute: 'profile',
      }
    case 'diamond':
      return null
  }
}
