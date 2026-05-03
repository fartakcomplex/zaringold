
import React, { useState, useEffect } from 'react';
import {Car, Shield, Bike, HeartPulse, Plane, Flame, UserRoundCheck, Scale, Inbox} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {motion} from '@/lib/framer-compat';
import type { InsuranceCategory } from './types';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Icon Mapping                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Shield,
  Bike,
  HeartPulse,
  Plane,
  Flame,
  UserRoundCheck,
  Scale,
};

const CATEGORY_COLORS: Record<string, string> = {
  'third-party-auto': 'from-blue-500/20 to-blue-600/5',
  'body-insurance': 'from-emerald-500/20 to-emerald-600/5',
  'motorcycle-insurance': 'from-orange-500/20 to-orange-600/5',
  'health-insurance': 'from-rose-500/20 to-rose-600/5',
  'travel-insurance': 'from-sky-500/20 to-sky-600/5',
  'fire-insurance': 'from-red-500/20 to-red-600/5',
  'life-insurance': 'from-violet-500/20 to-violet-600/5',
  'liability-insurance': 'from-amber-500/20 to-amber-600/5',
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Fallback Categories (when API is unavailable)                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

const FALLBACK_CATEGORIES: InsuranceCategory[] = [
  { id: '1', name: 'بیمه شخص ثالث', slug: 'third-party-auto', description: 'بیمه اجباری خسارت وارد شده به اشخاص ثالث در تصادفات رانندگی', icon: 'Car', color: '#3B82F6', isActive: true, sortOrder: 1 },
  { id: '2', name: 'بیمه بدنه', slug: 'body-insurance', description: 'پوشش خسارت‌های وارده به خودرو در تصادفات، سرقت و حوادث طبیعی', icon: 'Shield', color: '#10B981', isActive: true, sortOrder: 2, subtypes: ['سواری', 'وانت', 'کامیون', 'اتوبوس'] },
  { id: '3', name: 'بیمه موتورسیکلت', slug: 'motorcycle-insurance', description: 'پوشش خسارت بدنه و شخص ثالث برای موتورسیکلت', icon: 'Bike', color: '#F97316', isActive: true, sortOrder: 3, subtypes: ['اسکوتری', 'اسپرت', 'کروزر'] },
  { id: '4', name: 'بیمه درمان', slug: 'health-insurance', description: 'پوشش هزینه‌های بیمارستانی، جراحی و دارویی', icon: 'HeartPulse', color: '#EF4444', isActive: true, sortOrder: 4 },
  { id: '5', name: 'بیمه مسافرتی', slug: 'travel-insurance', description: 'پوشش حوادث و هزینه‌های پزشکی در سفرهای خارجی', icon: 'Plane', color: '#0EA5E9', isActive: true, sortOrder: 5 },
  { id: '6', name: 'بیمه آتش‌سوزی', slug: 'fire-insurance', description: 'پوشش خسارت‌های ناشی از آتش‌سوزی، زلزله و سیل', icon: 'Flame', color: '#DC2626', isActive: true, sortOrder: 6 },
  { id: '7', name: 'بیمه عمر', slug: 'life-insurance', description: 'پوشش مالی برای خانواده در صورت فوت یا نقص عضو', icon: 'UserRoundCheck', color: '#8B5CF6', isActive: true, sortOrder: 7 },
  { id: '8', name: 'بیمه مسئولیت', slug: 'liability-insurance', description: 'پوشش مسئولیت مدنی و حرفه‌ای اشخاص و شرکت‌ها', icon: 'Scale', color: '#F59E0B', isActive: true, sortOrder: 8 },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CategoryCard                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CategoryCard({
  category,
  onClick,
  index,
}: {
  category: InsuranceCategory;
  onClick: (cat: InsuranceCategory) => void;
  index: number;
}) {
  const IconComp = ICON_MAP[category.icon] || Shield;
  const gradientClass = CATEGORY_COLORS[category.slug] || 'from-gold/20 to-gold/5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className="group cursor-pointer border-border/50 bg-card transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
        onClick={() => onClick(category)}
      >
        <CardContent className="p-5">
          {/* Icon + Badge */}
          <div className="mb-4 flex items-start justify-between">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradientClass}`}>
              <IconComp className="h-6 w-6" style={{ color: category.color }} />
            </div>
            {category.isPopular && (
              <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px]">
                {/* i18n */}محبوب
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-1.5 text-sm font-bold leading-relaxed text-foreground group-hover:text-gold transition-colors">
            {/* i18n */}{category.name}
          </h3>

          {/* Description */}
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {/* i18n */}{category.description}
          </p>

          {/* Bottom accent bar */}
          <div className="mt-4 h-0.5 w-0 rounded-full bg-gradient-to-l from-gold to-gold/50 transition-all duration-500 group-hover:w-full" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Loading Skeleton                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
          <Skeleton className="mb-4 h-12 w-12 rounded-xl" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="mb-1 h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface InsuranceCategoriesProps {
  onSelectCategory: (category: InsuranceCategory) => void;
}

export default function InsuranceCategories({ onSelectCategory }: InsuranceCategoriesProps) {
  const [categories, setCategories] = useState<InsuranceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/insurance/categories');
        if (res.ok) {
          const data = await res.json();
          const list: InsuranceCategory[] = data.categories || data || [];
          if (list.length > 0) {
            setCategories(list.filter((c) => c.isActive));
          } else {
            setCategories(FALLBACK_CATEGORIES);
          }
        } else {
          setCategories(FALLBACK_CATEGORIES);
        }
      } catch {
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <CategoriesSkeleton />
      </div>
    );
  }

  /* ── Empty State ── */
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-sm font-bold text-foreground">
          {/* i18n */}دسته‌بندی یافت نشد
        </h3>
        <p className="text-xs text-muted-foreground">
          {/* i18n */}در حال حاضر بیمه‌ای موجود نیست
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {/* i18n */}انتخاب نوع بیمه
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {/* i18n */}نوع بیمه مورد نظر خود را انتخاب کنید
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {categories.map((cat, i) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            onClick={onSelectCategory}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
