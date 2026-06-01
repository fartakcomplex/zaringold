'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Clock, Globe, TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronLeft,
  ChevronRight, Filter, Bell, BellOff, Flame, ArrowUpRight, ArrowDownRight,
  MapPin, Star, Zap, Eye, EyeOff, BarChart3, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  goldImpactDesc: string;
  previous: string;
  forecast: string;
  actual?: string;
  actualGoldChange?: string;
  isNotified: boolean;
  isPast: boolean;
}

const COUNTRY_FLAGS: Record<string, string> = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', CN: '🇨🇳', JP: '🇯🇵', IR: '🇮🇷', DE: '🇩🇪', FR: '🇫🇷' };
const COUNTRY_NAMES: Record<string, string> = { US: 'آمریکا', EU: 'اروپا', UK: 'انگلستان', CN: 'چین', JP: 'ژاپن', IR: 'ایران', DE: 'آلمان', FR: 'فرانسه' };

const IMPACT_CONFIG: Record<ImpactLevel, { label: string; color: string; bg: string; textColor: string }> = {
  high: { label: 'بالا', color: '#EF4444', bg: 'bg-red-500/10 border-red-500/20', textColor: 'text-red-500' },
  medium: { label: 'متوسط', color: '#F97316', bg: 'bg-orange-500/10 border-orange-500/20', textColor: 'text-orange-500' },
  low: { label: 'پایین', color: '#3B82F6', bg: 'bg-blue-500/10 border-blue-500/20', textColor: 'text-blue-500' },
};

/* Generate mock events for current month */
function generateEvents(): CalendarEvent[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');

  return [
    { id: 'e1', title: 'جلسه FOMC فدرال رزرو', country: 'US', countryCode: 'US', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 2, 28))}`, time: '20:00', impact: 'high', goldImpact: 'positive', goldImpactDesc: 'نرخ بهره ثابت = صعودی برای طلا', previous: '۵.۲۵٪', forecast: '۵.۲۵٪', isNotified: true, isPast: false },
    { id: 'e2', title: 'قیمت سکه طلا ایران', country: 'IR', countryCode: 'IR', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 3, 28))}`, time: '09:00', impact: 'high', goldImpact: 'positive', goldImpactDesc: 'بروزرسانی هفتگی قیمت سکه', previous: '۲۵,۲۰۰,۰۰۰', forecast: '۲۵,۵۰۰,۰۰۰', isNotified: false, isPast: false },
    { id: 'e3', title: 'شاخص تورم CPI', country: 'US', countryCode: 'US', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 5, 28))}`, time: '14:30', impact: 'high', goldImpact: 'positive', goldImpactDesc: 'تورم بالاتر = تقاضای بیشتر طلا', previous: '۳.۴٪', forecast: '۳.۲٪', isNotified: true, isPast: false },
    { id: 'e4', title: 'اشتغال غیرکشاورزی NFP', country: 'US', countryCode: 'US', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 7, 28))}`, time: '14:30', impact: 'high', goldImpact: 'negative', goldImpactDesc: 'اشتغال قوی = دلار قوی = طلا ضعیف', previous: '۱۷۵K', forecast: '۱۸۰K', isNotified: false, isPast: false },
    { id: 'e5', title: 'GDP فصلی آمریکا', country: 'US', countryCode: 'US', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 10, 28))}`, time: '14:00', impact: 'medium', goldImpact: 'negative', goldImpactDesc: 'رشد اقتصادی = کاهش تقاضای طلا', previous: '۲.۴٪', forecast: '۲.۱٪', isNotified: false, isPast: false },
    { id: 'e6', title: 'نرخ بهره بانک مرکزی اروپا', country: 'EU', countryCode: 'EU', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 12, 28))}`, time: '13:45', impact: 'high', goldImpact: 'neutral', goldImpactDesc: 'تأثیر غیرمستقیم بر طلا از طریق یورو', previous: '۴.۰۰٪', forecast: '۴.۰۰٪', isNotified: true, isPast: false },
    { id: 'e7', title: 'فروش خرده‌فروشی آمریکا', country: 'US', countryCode: 'US', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 15, 28))}`, time: '15:00', impact: 'medium', goldImpact: 'negative', goldImpactDesc: 'فروش بالا = اقتصاد قوی = طلا ضعیف', previous: '۰.۶٪', forecast: '۰.۴٪', isNotified: false, isPast: false },
    { id: 'e8', title: 'جلسه اوپک+', country: 'IR', countryCode: 'IR', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 18, 28))}`, time: '16:00', impact: 'medium', goldImpact: 'positive', goldImpactDesc: 'تأثیر نفت بر بازارهای جهانی', previous: '—', forecast: '—', isNotified: false, isPast: false },
    { id: 'e9', title: 'PMI تولیدی چین', country: 'CN', countryCode: 'CN', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 20, 28))}`, time: '03:00', impact: 'medium', goldImpact: 'positive', goldImpactDesc: 'PMI ضعیف = حمایت از طلا', previous: '۵۰.۸', forecast: '۵۱.۲', isNotified: false, isPast: false },
    { id: 'e10', title: 'ادعای بیکاری هفتگی', country: 'US', countryCode: 'US', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 22, 28))}`, time: '15:30', impact: 'low', goldImpact: 'positive', goldImpactDesc: 'بیکاری بالا = حمایت از طلا', previous: '۲۱۵K', forecast: '۲۲۰K', isNotified: false, isPast: false },
    { id: 'e11', title: 'نرخ بهره بانک ژاپن', country: 'JP', countryCode: 'JP', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 24, 28))}`, time: '06:00', impact: 'high', goldImpact: 'positive', goldImpactDesc: 'سیاست‌های انبساطی ژاپن = طلا قوی', previous: '۰.۱٪', forecast: '۰.۱٪', isNotified: false, isPast: false },
    { id: 'e12', title: 'تورم آلمان', country: 'DE', countryCode: 'DE', date: `${y}-${pad(m + 1)}-${pad(Math.min(now.getDate() + 26, 28))}`, time: '10:00', impact: 'low', goldImpact: 'neutral', goldImpactDesc: 'تأثیر محدود بر بازار طلای جهانی', previous: '۲.۲٪', forecast: '۲.۱٪', isNotified: false, isPast: false },
    // Past events with actual data
    { id: 'pe1', title: 'FOMC قبلی', country: 'US', countryCode: 'US', date: `${y}-${pad(m)}-15`, time: '20:00', impact: 'high', goldImpact: 'positive', goldImpactDesc: 'نرخ بهره ثابت ماند', previous: '۵.۲۵٪', forecast: '۵.۲۵٪', actual: '۵.۲۵٪', actualGoldChange: '+۱.۲٪', isNotified: false, isPast: true },
    { id: 'pe2', title: 'CPI قبلی', country: 'US', countryCode: 'US', date: `${y}-${pad(m)}-10`, time: '14:30', impact: 'high', goldImpact: 'positive', goldImpactDesc: 'تورم بالاتر از انتظار', previous: '۳.۳٪', forecast: '۳.۱٪', actual: '۳.۴٪', actualGoldChange: '+۰.۸٪', isNotified: false, isPast: true },
    { id: 'pe3', title: 'NFP قبلی', country: 'US', countryCode: 'US', date: `${y}-${pad(m)}-05`, time: '14:30', impact: 'high', goldImpact: 'negative', goldImpactDesc: 'اشتغال فراتر از انتظار', previous: '۱۶۰K', forecast: '۱۷۰K', actual: '۱۷۵K', actualGoldChange: '-۰.۵٪', isNotified: false, isPast: true },
  ];
}

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfWeek(year: number, month: number) { return new Date(year, month, 1).getDay(); }

const PERSIAN_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const PERSIAN_MONTH_NAMES = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Gold Impact Badge                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function GoldImpactBadge({ impact }: { impact: GoldImpact }) {
  if (impact === 'positive') return <Badge className="gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[10px]"><TrendingUp className="size-3" /> صعودی</Badge>;
  if (impact === 'negative') return <Badge className="gap-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[10px]"><TrendingDown className="size-3" /> نزولی</Badge>;
  return <Badge className="gap-1 bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 text-[10px]"><Minus className="size-3" /> خنثی</Badge>;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Impact Dots for Calendar                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ImpactDots({ impact }: { impact: ImpactLevel }) {
  const dots = impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
  const color = impact === 'high' ? 'bg-red-500' : impact === 'medium' ? 'bg-orange-500' : 'bg-blue-500';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={cn('size-1.5 rounded-full', i < dots ? color : 'bg-border')} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function EconomicCalendarPage() {
  const { addToast } = useAppStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedImpact, setSelectedImpact] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'calendar' | 'list' | 'past'>('list');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setEvents(generateEvents());
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [currentDate]);

  const futureEvents = useMemo(() => events.filter((e) => !e.isPast).filter((e) => selectedCountry === 'all' || e.countryCode === selectedCountry).filter((e) => selectedImpact === 'all' || e.impact === selectedImpact).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [events, selectedCountry, selectedImpact]);

  const pastEvents = useMemo(() => events.filter((e) => e.isPast).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [events]);

  const thisWeekEvents = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return futureEvents.filter((e) => { const d = new Date(e.date); return d >= now && d <= weekEnd; });
  }, [futureEvents]);

  const daysInMonth = getDaysInMonth(currentDate.year, currentDate.month);
  const firstDay = getFirstDayOfWeek(currentDate.year, currentDate.month);

  const eventDates = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    futureEvents.forEach((e) => {
      const d = new Date(e.date);
      if (d.getMonth() === currentDate.month && d.getFullYear() === currentDate.year) {
        const key = String(d.getDate());
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(e);
      }
    });
    return map;
  }, [futureEvents, currentDate]);

  const prevMonth = () => { if (currentDate.month === 0) setCurrentDate({ year: currentDate.year - 1, month: 11 }); else setCurrentDate({ ...currentDate, month: currentDate.month - 1 }); };
  const nextMonth = () => { if (currentDate.month === 11) setCurrentDate({ year: currentDate.year + 1, month: 0 }); else setCurrentDate({ ...currentDate, month: currentDate.month + 1 }); };

  const toggleNotify = (eventId: string) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, isNotified: !e.isNotified } : e)));
    const ev = events.find((e) => e.id === eventId);
    addToast(ev?.isNotified ? `اعلان ${ev.title} غیرفعال شد` : `اعلان ${ev.title} فعال شد`, 'info');
  };

  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && currentDate.month === today.getMonth() && currentDate.year === today.getFullYear();

  const bullishCount = futureEvents.filter((e) => e.goldImpact === 'positive').length;
  const bearishCount = futureEvents.filter((e) => e.goldImpact === 'negative').length;

  return (
    <div className="space-y-4 p-4">
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

      {/* Sentiment Summary */}
      <Card className="overflow-hidden border-[#D4AF37]/20 bg-gradient-to-l from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-black tabular-nums text-red-500">{formatNumber(futureEvents.filter((e) => e.impact === 'high').length)}</p>
              <p className="text-[10px] text-muted-foreground">رویداد مهم 🔴</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                {bullishCount > bearishCount ? <TrendingUp className="size-3.5 text-emerald-500" /> : <TrendingDown className="size-3.5 text-red-500" />}
                <p className="text-lg font-black tabular-nums text-[#D4AF37]">{formatNumber(futureEvents.length)}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">رویداد آینده</p>
            </div>
            <div>
              <p className="text-lg font-black tabular-nums text-emerald-500">{formatNumber(bullishCount)}</p>
              <p className="text-[10px] text-muted-foreground">تأثیر مثبت بر طلا</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* This Week Highlight */}
      {thisWeekEvents.length > 0 && (
        <Card className="overflow-hidden border-[#D4AF37]/30">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Flame className="size-4 text-orange-500" />
            <CardTitle className="text-sm font-bold">رویدادهای مهم این هفته</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {thisWeekEvents.slice(0, 3).map((event) => {
              const imp = IMPACT_CONFIG[event.impact];
              const eventDate = new Date(event.date);
              return (
                <div key={event.id} className="flex items-center gap-2 rounded-lg border p-2 transition-all hover:bg-muted/50" style={{ borderColor: imp.color + '40' }}>
                  <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: imp.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground">{COUNTRY_FLAGS[event.countryCode]} {eventDate.toLocaleDateString('fa-IR')} — {event.time}</p>
                  </div>
                  <GoldImpactBadge impact={event.goldImpact} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="overflow-hidden border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground shrink-0" />
            <div className="flex flex-1 gap-2">
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="h-8 border-border text-[11px] bg-background"><SelectValue placeholder="کشور" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه کشورها</SelectItem>
                  {Object.entries(COUNTRY_NAMES).map(([code, name]) => (<SelectItem key={code} value={code}>{COUNTRY_FLAGS[code]} {name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={selectedImpact} onValueChange={setSelectedImpact}>
                <SelectTrigger className="h-8 border-border text-[11px] bg-background"><SelectValue placeholder="تأثیر" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="high">بالا 🔴</SelectItem>
                  <SelectItem value="medium">متوسط 🟠</SelectItem>
                  <SelectItem value="low">پایین 🔵</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="w-full">
          <TabsTrigger value="list" className="flex-1 gap-1.5 text-xs"><Clock className="size-3.5" /> لیست</TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1 gap-1.5 text-xs"><Calendar className="size-3.5" /> تقویم</TabsTrigger>
          <TabsTrigger value="past" className="flex-1 gap-1.5 text-xs"><BarChart3 className="size-3.5" /> رویدادهای گذشته</TabsTrigger>
        </TabsList>

        {/* ═══ LIST VIEW ═══ */}
        <TabsContent value="list">
          <div className="space-y-3">
            {loading ? Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-full" /></CardContent></Card>)
            : futureEvents.length === 0 ? <Card><CardContent className="flex flex-col items-center py-12 text-center"><Calendar className="size-10 text-muted-foreground/30" /><p className="mt-2 text-sm text-muted-foreground">رویدادی یافت نشد</p></CardContent></Card>
            : futureEvents.map((event) => {
              const imp = IMPACT_CONFIG[event.impact];
              const eventDate = new Date(event.date);
              const isExpanded = expandedEvent === event.id;
              return (
                <Card key={event.id} className="overflow-hidden cursor-pointer transition-all hover:shadow-sm" onClick={() => setExpandedEvent(isExpanded ? null : event.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex shrink-0 flex-col items-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2 min-w-[48px]">
                        <span className="text-lg font-black tabular-nums text-[#D4AF37]">{formatNumber(eventDate.getDate())}</span>
                        <span className="text-[9px] font-medium text-muted-foreground">{PERSIAN_MONTH_NAMES[eventDate.getMonth()]}</span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate">{event.title}</h3>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); toggleNotify(event.id); }} className="p-1 rounded-lg hover:bg-border transition-colors">
                              {event.isNotified ? <Bell className="size-3.5 text-[#D4AF37]" /> : <BellOff className="size-3.5 text-muted-foreground" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-3" />{COUNTRY_FLAGS[event.countryCode]} {COUNTRY_NAMES[event.countryCode]}</span>
                          <span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3" />{event.time}</span>
                          <Badge className={cn('text-[10px] px-1.5 py-0 border', imp.bg, imp.textColor)}>{imp.label}</Badge>
                          <GoldImpactBadge impact={event.goldImpact} />
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-muted-foreground">قبلی: <span className="font-bold text-foreground">{event.previous}</span></span>
                          <span className="text-muted-foreground">پیش‌بینی: <span className="font-bold text-foreground">{event.forecast}</span></span>
                        </div>
                        {isExpanded && (
                          <div className="rounded-lg border border-[#D4AF37]/10 bg-[#D4AF37]/5 p-3 mt-2">
                            <div className="flex items-center gap-1.5 mb-1"><Activity className="size-3 text-[#D4AF37]" /><span className="text-[11px] font-semibold text-foreground">تأثیر بر قیمت طلا</span></div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{event.goldImpactDesc}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══ CALENDAR VIEW ═══ */}
        <TabsContent value="calendar">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-border transition-colors"><ChevronRight className="size-4" /></button>
              <CardTitle className="text-sm font-bold">{PERSIAN_MONTH_NAMES[currentDate.month]} {formatNumber(currentDate.year)}</CardTitle>
              <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-border transition-colors"><ChevronLeft className="size-4" /></button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-1">{PERSIAN_DAYS.map((d) => (<div key={d} className="flex items-center justify-center py-1 text-[10px] font-semibold text-muted-foreground">{d}</div>))}</div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (<div key={`e-${i}`} />))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = eventDates.get(String(day));
                  const todayCell = isToday(day);
                  return (
                    <button key={day} className={cn('relative flex flex-col items-center justify-center rounded-lg border py-1.5 transition-all min-h-[40px]', todayCell ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10' : dayEvents ? 'border-[#D4AF37]/20 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10' : 'border-transparent hover:bg-border')}>
                      <span className={cn('text-[11px] font-bold tabular-nums', todayCell ? 'text-[#D4AF37]' : dayEvents ? 'text-foreground' : 'text-muted-foreground')}>{formatNumber(day)}</span>
                      {dayEvents && dayEvents.length > 0 && <ImpactDots impact={dayEvents[0].impact} />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-[10px]">
                <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-red-500" /><span className="text-muted-foreground">بالا</span></div>
                <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-orange-500" /><span className="text-muted-foreground">متوسط</span></div>
                <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-blue-500" /><span className="text-muted-foreground">پایین</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ PAST EVENTS ═══ */}
        <TabsContent value="past">
          <div className="space-y-3">
            {pastEvents.map((event) => {
              const imp = IMPACT_CONFIG[event.impact];
              const eventDate = new Date(event.date);
              const isPositive = event.actualGoldChange?.startsWith('+');
              return (
                <Card key={event.id} className="overflow-hidden border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex shrink-0 flex-col items-center rounded-xl border border-border bg-muted/30 px-3 py-2 min-w-[48px]">
                        <span className="text-lg font-black tabular-nums text-muted-foreground">{formatNumber(eventDate.getDate())}</span>
                        <span className="text-[9px] font-medium text-muted-foreground">{PERSIAN_MONTH_NAMES[eventDate.getMonth()]}</span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="text-sm font-bold text-foreground truncate">{event.title}</h3>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-muted-foreground">{COUNTRY_FLAGS[event.countryCode]} {COUNTRY_NAMES[event.countryCode]}</span>
                          <Badge className={cn('text-[10px] px-1.5 py-0 border', imp.bg, imp.textColor)}>{imp.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-muted-foreground">انتظار: <span className="font-bold text-foreground">{event.forecast}</span></span>
                          <span className="text-muted-foreground">واقعی: <span className="font-bold text-foreground">{event.actual || '—'}</span></span>
                        </div>
                        {event.actualGoldChange && (
                          <div className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold', isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>
                            {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            تأثیر بر طلا: {event.actualGoldChange}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
