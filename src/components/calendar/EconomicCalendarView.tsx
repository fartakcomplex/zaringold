'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Bell,
  BellOff,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  MinusCircle,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { formatNumber, cn } from '@/lib/helpers';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types & Constants                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

type ImpactLevel = 'high' | 'medium' | 'low';
type GoldImpact = 'positive' | 'negative' | 'neutral';

interface CalendarEvent {
  id: string;
  title: string;
  country: string;
  countryCode: string;
  date: string;
  time: string;
  impact: ImpactLevel;
  goldImpact: GoldImpact;
  previous: string;
  forecast: string;
  actual?: string;
  isNotified: boolean;
}

/* Country flag emojis */
const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  EU: '🇪🇺',
  UK: '🇬🇧',
  CN: '🇨🇳',
  JP: '🇯🇵',
  IR: '🇮🇷',
  DE: '🇩🇪',
  FR: '🇫🇷',
};

const COUNTRY_NAMES: Record<string, string> = {
  US: 'آمریکا',
  EU: 'اروپا',
  UK: 'انگلستان',
  CN: 'چین',
  JP: 'ژاپن',
  IR: 'ایران',
  DE: 'آلمان',
  FR: 'فرانسه',
};

const IMPACT_CONFIG: Record<ImpactLevel, { label: string; color: string; bg: string; dots: number }> = {
  high: { label: 'تأثیر بالا', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', dots: 3 },
  medium: { label: 'تأثیر متوسط', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', dots: 2 },
  low: { label: 'تأثیر کم', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', dots: 1 },
};

/* Generate mock events for current month */
function generateEvents(): CalendarEvent[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return [
    {
      id: 'e1', title: 'نرخ بهره فدرال رزرو', country: 'US', countryCode: 'US',
      date: `${year}-${String(month + 1).padStart(2, '0')}-05`, time: '20:00',
      impact: 'high', goldImpact: 'positive', previous: '۵.۲۵٪', forecast: '۵.۲۵٪', isNotified: true,
    },
    {
      id: 'e2', title: 'تورم مصرف‌کننده CPI', country: 'US', countryCode: 'US',
      date: `${year}-${String(month + 1).padStart(2, '0')}-10`, time: '14:30',
      impact: 'high', goldImpact: 'positive', previous: '۳.۴٪', forecast: '۳.۲٪', isNotified: false,
    },
    {
      id: 'e3', title: 'بیکاری اروپا', country: 'EU', countryCode: 'EU',
      date: `${year}-${String(month + 1).padStart(2, '0')}-12`, time: '11:00',
      impact: 'medium', goldImpact: 'neutral', previous: '۶.۴٪', forecast: '۶.۳٪', isNotified: false,
    },
    {
      id: 'e4', title: 'تولید ناخالص داخلی GDP', country: 'UK', countryCode: 'UK',
      date: `${year}-${String(month + 1).padStart(2, '0')}-14`, time: '08:00',
      impact: 'medium', goldImpact: 'negative', previous: '۰.۳٪', forecast: '۰.۲٪', isNotified: true,
    },
    {
      id: 'e5', title: 'شاخص PMI تولیدی', country: 'CN', countryCode: 'CN',
      date: `${year}-${String(month + 1).padStart(2, '0')}-17`, time: '03:00',
      impact: 'high', goldImpact: 'positive', previous: '۵۰.۸', forecast: '۵۱.۲', isNotified: false,
    },
    {
      id: 'e6', title: 'نرخ بهره بانک ژاپن', country: 'JP', countryCode: 'JP',
      date: `${year}-${String(month + 1).padStart(2, '0')}-20`, time: '06:00',
      impact: 'high', goldImpact: 'positive', previous: '۰.۱٪', forecast: '۰.۱٪', isNotified: false,
    },
    {
      id: 'e7', title: 'ذخایر طلای فدرال رزرو', country: 'US', countryCode: 'US',
      date: `${year}-${String(month + 1).padStart(2, '0')}-22`, time: '17:00',
      impact: 'high', goldImpact: 'positive', previous: '۸,۱۳۳ تن', forecast: '—', isNotified: true,
    },
    {
      id: 'e8', title: 'نرخ تورم آلمان', country: 'DE', countryCode: 'DE',
      date: `${year}-${String(month + 1).padStart(2, '0')}-25`, time: '10:00',
      impact: 'low', goldImpact: 'neutral', previous: '۲.۲٪', forecast: '۲.۱٪', isNotified: false,
    },
    {
      id: 'e9', title: 'جلسه اوپک', country: 'IR', countryCode: 'IR',
      date: `${year}-${String(month + 1).padStart(2, '0')}-27`, time: '16:00',
      impact: 'medium', goldImpact: 'negative', previous: '—', forecast: '—', isNotified: false,
    },
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: Get days in month                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // 0=Sunday
  return new Date(year, month, 1).getDay();
}

const PERSIAN_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/* Simple Persian month approximation using Western months */
function getPersianMonthName(monthIndex: number): string {
  const names = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
  return names[monthIndex];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Gold Impact Indicator                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function GoldImpactBadge({ impact }: { impact: GoldImpact }) {
  if (impact === 'positive') {
    return (
      <Badge className="gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[10px]">
        <TrendingUp className="size-3" />
        صعودی
      </Badge>
    );
  }
  if (impact === 'negative') {
    return (
      <Badge className="gap-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[10px]">
        <TrendingDown className="size-3" />
        نزولی
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 text-[10px]">
      <Minus className="size-3" />
      خنثی
    </Badge>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main EconomicCalendarView Component                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function EconomicCalendarView() {
  const { addToast } = useAppStore();

  /* ── State ── */
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedImpact, setSelectedImpact] = useState<string>('all');
  const [eventView, setEventView] = useState<'calendar' | 'list'>('list');

  /* ── Fetch Events ── */
  useEffect(() => {
    // Simulate fetch with mock data
    const timer = setTimeout(() => {
      setLoading(true);
      setEvents(generateEvents());
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentDate]);

  /* ── Filtered Events ── */
  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => selectedCountry === 'all' || e.countryCode === selectedCountry)
      .filter((e) => selectedImpact === 'all' || e.impact === selectedImpact)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, selectedCountry, selectedImpact]);

  /* ── Calendar helpers ── */
  const daysInMonth = getDaysInMonth(currentDate.year, currentDate.month);
  const firstDay = getFirstDayOfWeek(currentDate.year, currentDate.month);

  const eventDates = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((e) => {
      const day = new Date(e.date).getDate();
      const key = String(day);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [filteredEvents]);

  /* ── Navigate months ── */
  const prevMonth = () => {
    if (currentDate.month === 0) {
      setCurrentDate({ year: currentDate.year - 1, month: 11 });
    } else {
      setCurrentDate({ ...currentDate, month: currentDate.month - 1 });
    }
  };
  const nextMonth = () => {
    if (currentDate.month === 11) {
      setCurrentDate({ year: currentDate.year + 1, month: 0 });
    } else {
      setCurrentDate({ ...currentDate, month: currentDate.month + 1 });
    }
  };

  /* ── Toggle notification ── */
  const toggleNotify = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, isNotified: !e.isNotified } : e)),
    );
    const ev = events.find((e) => e.id === eventId);
    addToast(
      ev?.isNotified ? `اعلان ${ev.title} غیرفعال شد` : `اعلان ${ev.title} فعال شد`,
      'info',
    );
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentDate.month === today.getMonth() &&
    currentDate.year === today.getFullYear();

  /* ── Impact dots component ── */
  const ImpactDots = ({ impact }: { impact: ImpactLevel }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'size-1.5 rounded-full',
            i < IMPACT_CONFIG[impact].dots
              ? impact === 'high' ? 'bg-red-500' : impact === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
              : 'bg-border',
          )}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5">
          <Calendar className="size-5 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">تقویم اقتصادی</h1>
          <p className="text-xs text-muted-foreground">رویدادهای تأثیرگذار بر بازار طلا</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="overflow-hidden border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground shrink-0" />
            <div className="flex flex-1 gap-2">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="h-8 border-border text-[11px] bg-background">
                  <SelectValue placeholder="کشور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه کشورها</SelectItem>
                  {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {COUNTRY_FLAGS[code]} {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedImpact} onValueChange={setSelectedImpact}>
                <SelectTrigger className="h-8 border-border text-[11px] bg-background">
                  <SelectValue placeholder="تأثیر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="high">تأثیر بالا 🔴</SelectItem>
                  <SelectItem value="medium">تأثیر متوسط 🟡</SelectItem>
                  <SelectItem value="low">تأثیر کم 🟢</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={eventView === 'calendar' ? 'default' : 'outline'}
          onClick={() => setEventView('calendar')}
          className={cn(
            'flex-1 gap-1.5 text-xs',
            eventView === 'calendar' ? 'bg-[#D4AF37] text-[#1a1a1a]' : 'border-border',
          )}
        >
          <Calendar className="size-3.5" />
          تقویم
        </Button>
        <Button
          variant={eventView === 'list' ? 'default' : 'outline'}
          onClick={() => setEventView('list')}
          className={cn(
            'flex-1 gap-1.5 text-xs',
            eventView === 'list' ? 'bg-[#D4AF37] text-[#1a1a1a]' : 'border-border',
          )}
        >
          <Clock className="size-3.5" />
          لیست
        </Button>
      </div>

      {/* Calendar View */}
      {eventView === 'calendar' && (
        <Card className="overflow-hidden border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-border transition-colors">
              <ChevronRight className="size-4 text-foreground" />
            </button>
            <CardTitle className="text-sm font-bold">
              {getPersianMonthName(currentDate.month)} {formatNumber(currentDate.year)}
            </CardTitle>
            <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-border transition-colors">
              <ChevronLeft className="size-4 text-foreground" />
            </button>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {PERSIAN_DAYS.map((d) => (
                <div key={d} className="flex items-center justify-center py-1 text-[10px] font-semibold text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = eventDates.get(String(day));
                const todayCell = isToday(day);

                return (
                  <button
                    key={day}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-lg border py-1.5 transition-all min-h-[40px]',
                      todayCell
                        ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10'
                        : dayEvents
                          ? 'border-[#D4AF37]/20 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10'
                          : 'border-transparent hover:bg-border',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[11px] font-bold tabular-nums',
                        todayCell ? 'text-[#D4AF37]' : dayEvents ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {formatNumber(day)}
                    </span>
                    {dayEvents && (
                      <ImpactDots impact={dayEvents[0].impact} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-center gap-4 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">بالا</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">متوسط</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">کم</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event List */}
      {eventView === 'list' && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-border">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredEvents.length === 0 ? (
            <Card className="overflow-hidden border-border">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Calendar className="size-10 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">رویدادی یافت نشد</p>
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => {
              const impact = IMPACT_CONFIG[event.impact];
              const eventDate = new Date(event.date);
              const dayStr = formatNumber(eventDate.getDate());
              const monthStr = getPersianMonthName(eventDate.getMonth());

              return (
                <Card key={event.id} className="overflow-hidden border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Date badge */}
                      <div className="flex shrink-0 flex-col items-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2 min-w-[48px]">
                        <span className="text-lg font-black tabular-nums text-[#D4AF37]">{dayStr}</span>
                        <span className="text-[9px] font-medium text-muted-foreground">{monthStr}</span>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate">{event.title}</h3>
                          <button
                            onClick={() => toggleNotify(event.id)}
                            className="shrink-0 p-1 rounded-lg hover:bg-border transition-colors"
                          >
                            {event.isNotified ? (
                              <Bell className="size-3.5 text-[#D4AF37]" />
                            ) : (
                              <BellOff className="size-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </div>

                        {/* Country & Time Row */}
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="size-3" />
                            {COUNTRY_FLAGS[event.countryCode]} {COUNTRY_NAMES[event.countryCode]}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="size-3" />
                            {event.time}
                          </span>
                          <Badge className={cn('text-[10px] px-1.5 py-0', impact.bg, impact.color)}>
                            {impact.label}
                          </Badge>
                        </div>

                        {/* Data & Gold Impact */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="text-muted-foreground">
                              قبلی: <span className="font-bold text-foreground">{event.previous}</span>
                            </span>
                            <span className="text-muted-foreground">
                              پیش‌بینی: <span className="font-bold text-foreground">{event.forecast}</span>
                            </span>
                          </div>
                          <GoldImpactBadge impact={event.goldImpact} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Stats Summary */}
      <Card className="overflow-hidden border-[#D4AF37]/20 bg-[#D4AF37]/5">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-black tabular-nums text-red-500">
                {formatNumber(events.filter((e) => e.impact === 'high').length)}
              </p>
              <p className="text-[10px] text-muted-foreground">رویداد مهم</p>
            </div>
            <div>
              <p className="text-lg font-black tabular-nums text-[#D4AF37]">
                {formatNumber(filteredEvents.length)}
              </p>
              <p className="text-[10px] text-muted-foreground">کل رویدادها</p>
            </div>
            <div>
              <p className="text-lg font-black tabular-nums text-emerald-500">
                {formatNumber(events.filter((e) => e.goldImpact === 'positive').length)}
              </p>
              <p className="text-[10px] text-muted-foreground">تأثیر مثبت بر طلا</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
