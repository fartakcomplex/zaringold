
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {useAppStore} from '@/lib/store';
import {formatDateTime, getTimeAgo} from '@/lib/helpers';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Switch} from '@/components/ui/switch';
import {Shield, ShieldAlert, ShieldCheck, ShieldOff, Bot, Ban, Eye, Trash2, Plus, Search, Activity, AlertTriangle, Users, Lock, Clock, Globe, RefreshCw, Monitor, Smartphone, Tablet, Info, AlertOctagon, CheckCircle, XCircle, Settings, TrendingUp, Zap, ChevronDown, ChevronUp, Save, Flame, Radio, Wifi, WifiOff, MapPin, Timer, Filter} from 'lucide-react';
import {cn} from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SecurityStats {
  today: number;
  week: number;
  critical: number;
  authFailures: number;
  botDetections: number;
  blockedIPs: number;
  activeSessions: number;
  frozenUsers: number;
  recentEvents: SecurityEvent[];
  eventsByType: { type: string; count: number }[];
}

interface SecurityEvent {
  id: string;
  type: string;
  severity: string;
  userId: string | null;
  phone: string | null;
  ip: string | null;
  userAgent: string | null;
  url: string | null;
  method: string | null;
  details: Record<string, unknown> | null;
  riskScore: number;
  resolved: boolean;
  createdAt: string;
}

interface BlockedIP {
  id: string;
  ip: string;
  reason: string | null;
  blockedBy: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface UserSession {
  id: string;
  userId: string;
  token: string;
  device: string | null;
  ip: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    phone: string;
    fullName: string | null;
    role: string;
    avatar: string | null;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function getToken(): string | undefined {
  return useAppStore.getState().user?.sessionToken;
}

const typeLabels: Record<string, string> = {
  auth_success: 'ورود موفق',
  auth_failure: 'ورود ناموفق',
  account_frozen: 'حساب منجمد',
  suspicious_activity: 'فعالیت مشکوک',
  bot_detected: 'ربات شناسایی شد',
  rate_limit_exceeded: 'محدودیت نرخ',
  api_abuse: 'سوءاستفاده API',
  permission_denied: 'عدم دسترسی',
  session_revoked: 'نشست ابطال شد',
  security_scan: 'اسکن امنیتی',
  ip_blocked: 'IP مسدود',
  password_change: 'تغییر رمز عبور',
  mfa_enabled: '۲FA فعال شد',
  mfa_disabled: '۲FA غیرفعال',
  login_new_device: 'ورود از دستگاه جدید',
  sensitive_action: 'عملیات حساس',
  export_data: 'خروجی داده',
};

const typeColors: Record<string, string> = {
  auth_success: 'bg-emerald-500/15 text-emerald-400',
  auth_failure: 'bg-red-500/15 text-red-400',
  account_frozen: 'bg-orange-500/15 text-orange-400',
  suspicious_activity: 'bg-red-500/15 text-red-400',
  bot_detected: 'bg-amber-500/15 text-amber-400',
  rate_limit_exceeded: 'bg-amber-500/15 text-amber-400',
  api_abuse: 'bg-red-500/15 text-red-400',
  permission_denied: 'bg-orange-500/15 text-orange-400',
  session_revoked: 'bg-blue-500/15 text-blue-400',
  security_scan: 'bg-blue-500/15 text-blue-400',
  ip_blocked: 'bg-red-500/15 text-red-400',
  password_change: 'bg-blue-500/15 text-blue-400',
  mfa_enabled: 'bg-emerald-500/15 text-emerald-400',
  mfa_disabled: 'bg-amber-500/15 text-amber-400',
  login_new_device: 'bg-amber-500/15 text-amber-400',
  sensitive_action: 'bg-orange-500/15 text-orange-400',
  export_data: 'bg-blue-500/15 text-blue-400',
};

const typeIcons: Record<string, React.ElementType> = {
  auth_success: CheckCircle,
  auth_failure: XCircle,
  account_frozen: ShieldOff,
  suspicious_activity: AlertTriangle,
  bot_detected: Bot,
  rate_limit_exceeded: Clock,
  api_abuse: AlertOctagon,
  permission_denied: ShieldOff,
  session_revoked: ShieldOff,
  security_scan: ShieldCheck,
  ip_blocked: Ban,
  password_change: Lock,
  mfa_enabled: ShieldCheck,
  mfa_disabled: ShieldOff,
  login_new_device: Smartphone,
  sensitive_action: AlertTriangle,
  export_data: Eye,
};

function getSeverityBadge(severity: string) {
  const map: Record<string, { label: string; cls: string }> = {
    info: { label: 'اطلاعات', cls: 'bg-blue-500/15 text-blue-400' },
    warning: { label: 'هشدار', cls: 'bg-amber-500/15 text-amber-400' },
    critical: { label: 'بحرانی', cls: 'bg-red-500/15 text-red-400' },
  };
  const item = map[severity] || map.info;
  return <Badge className={cn('text-[10px]', item.cls)}>{item.label}</Badge>;
}

function getTypeBadge(type: string) {
  return (
    <Badge className={cn('text-[10px]', typeColors[type] || 'bg-gray-500/15 text-gray-400')}>
      {typeLabels[type] || type}
    </Badge>
  );
}

function getDeviceIcon(device: string | null) {
  if (!device) return <Monitor className="size-4 text-muted-foreground" />;
  const d = device.toLowerCase();
  if (d.includes('mobile') || d.includes('android') || d.includes('iphone')) return <Smartphone className="size-4 text-blue-400" />;
  if (d.includes('tablet') || d.includes('ipad')) return <Tablet className="size-4 text-purple-400" />;
  return <Monitor className="size-4 text-emerald-400" />;
}

function formatPersianNumber(n: number): string {
  return n.toLocaleString('fa-IR');
}

function calculateSecurityScore(stats: SecurityStats | null): number {
  if (!stats) return 0;
  const score = 100 - (stats.authFailures * 5) - (stats.critical * 20) - (stats.botDetections * 3);
  return Math.max(0, Math.min(100, score));
}

function getScoreColor(score: number): string {
  if (score < 50) return 'text-red-400';
  if (score < 80) return 'text-amber-400';
  return 'text-emerald-400';
}

function getScoreStroke(score: number): string {
  if (score < 50) return '#ef4444';
  if (score < 80) return '#f59e0b';
  return '#10b981';
}

function getScoreLabel(score: number): string {
  if (score < 30) return 'بحرانی';
  if (score < 50) return 'ضعیف';
  if (score < 70) return 'متوسط';
  if (score < 80) return 'خوب';
  return 'عالی';
}

function getScoreLabelColor(score: number): string {
  if (score < 30) return 'bg-red-500/15 text-red-400';
  if (score < 50) return 'bg-orange-500/15 text-orange-400';
  if (score < 70) return 'bg-amber-500/15 text-amber-400';
  if (score < 80) return 'bg-blue-500/15 text-blue-400';
  return 'bg-emerald-500/15 text-emerald-400';
}

function getThreatLevel(stats: SecurityStats | null): { level: string; color: string; bg: string; percent: number } {
  if (!stats) return { level: 'نامشخص', color: 'text-gray-400', bg: 'bg-gray-500', percent: 0 };
  const score = calculateSecurityScore(stats);
  if (score >= 80) return { level: 'کم', color: 'text-emerald-400', bg: 'bg-emerald-500', percent: 25 };
  if (score >= 60) return { level: 'متوسط', color: 'text-amber-400', bg: 'bg-amber-500', percent: 50 };
  if (score >= 40) return { level: 'زیاد', color: 'text-orange-400', bg: 'bg-orange-500', percent: 75 };
  return { level: 'بحرانی', color: 'text-red-400', bg: 'bg-red-500', percent: 100 };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Security Score Gauge Component (CSS-only)                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SecurityScoreGauge({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setAnimatedOffset(offset);
    });
    return () => cancelAnimationFrame(rafId);
  }, [offset]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreStroke(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${getScoreStroke(score)}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold', getScoreColor(score))}>
          {formatPersianNumber(score)}
        </span>
        <span className="text-[9px] text-muted-foreground">از ۱۰۰</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Pulse Indicator Component                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PulseIndicator({ active }: { active: boolean }) {
  return (
    <span className="relative flex size-2.5">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full size-2.5',
          active ? 'bg-emerald-500' : 'bg-gray-500'
        )}
      />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main AdminSecurity Component                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminSecurity() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted/50 w-full sm:w-auto flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <Activity className="size-3.5" /> نمای کلی
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5 text-xs">
            <AlertTriangle className="size-3.5" /> رویدادها
          </TabsTrigger>
          <TabsTrigger value="blocked-ips" className="gap-1.5 text-xs">
            <Ban className="size-3.5" /> IPهای مسدود
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5 text-xs">
            <Globe className="size-3.5" /> نشست‌ها
          </TabsTrigger>
          <TabsTrigger value="live-stats" className="gap-1.5 text-xs">
            <Radio className="size-3.5" /> آمار زنده
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs">
            <Settings className="size-3.5" /> تنظیمات
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="events" className="mt-4">
          <EventsTab />
        </TabsContent>
        <TabsContent value="blocked-ips" className="mt-4">
          <BlockedIPsTab />
        </TabsContent>
        <TabsContent value="sessions" className="mt-4">
          <SessionsTab />
        </TabsContent>
        <TabsContent value="live-stats" className="mt-4">
          <LiveStatsTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab 1: Overview (Enhanced)                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OverviewTab() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/security/stats', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(fetchStats, 15000);
    } else {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    }
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefresh, fetchStats]);

  const score = calculateSecurityScore(stats);

  const statCards = stats
    ? [
        { label: 'رویداد امروز', value: stats.today, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'hover:shadow-emerald-500/10' },
        { label: 'تلاش ناموفق', value: stats.authFailures, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'hover:shadow-red-500/10' },
        { label: 'ربات مسدود', value: stats.botDetections, icon: Bot, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'hover:shadow-amber-500/10' },
        { label: 'کاربران منجمد', value: stats.frozenUsers, icon: ShieldOff, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: 'hover:shadow-orange-500/10' },
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Top Section: Security Score + Auto-Refresh */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Security Score Gauge */}
        <Card className="card-gold-border md:col-span-1">
          <CardContent className="p-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-gold" />
              <span className="text-sm font-bold">امتیاز امنیتی</span>
            </div>
            <SecurityScoreGauge score={score} size={130} />
            <Badge className={cn('text-[10px]', getScoreLabelColor(score))}>
              {getScoreLabel(score)}
            </Badge>
          </CardContent>
        </Card>

        {/* Stat Cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))
            : statCards.map((s) => (
                <Card
                  key={s.label}
                  className={cn(
                    'card-gold-border hover-lift-sm transition-all duration-300',
                    'hover:shadow-lg',
                    s.glow,
                    'group'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'size-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
                        s.bg, s.border, 'border'
                      )}>
                        <s.icon className={cn('size-5', s.color)} />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        <p className={cn('text-2xl font-bold', s.color)}>
                          {formatPersianNumber(s.value)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      {/* Secondary Stats */}
      {stats && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'رویداد هفته', value: stats.week, icon: Shield, color: 'text-gold' },
            { label: 'بحرانی', value: stats.critical, icon: AlertOctagon, color: 'text-red-400' },
            { label: 'IPهای مسدود', value: stats.blockedIPs, icon: Ban, color: 'text-amber-400' },
            { label: 'نشست‌های فعال', value: stats.activeSessions, icon: Globe, color: 'text-emerald-400' },
          ].map((s) => (
            <Card key={s.label} className="card-gold-border hover-lift-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="size-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                  <s.icon className={cn('size-4', s.color)} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className="text-base font-bold">{formatPersianNumber(s.value)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Events by Type */}
      {stats && stats.eventsByType.length > 0 && !loading && (
        <Card className="card-gold-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="size-4 text-gold" /> توزیع رویدادها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.eventsByType.map((e) => {
                const maxCount = Math.max(...stats.eventsByType.map((x) => x.count));
                const pct = Math.round((e.count / maxCount) * 100);
                return (
                  <div
                    key={e.type}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2',
                      typeColors[e.type] || 'bg-gray-500/15 text-gray-400'
                    )}
                  >
                    {(() => {
                      const Icon = typeIcons[e.type] || Info;
                      return <Icon className="size-3.5" />;
                    })()}
                    <span className="text-[10px] font-medium">{typeLabels[e.type] || e.type}</span>
                    <span className="text-[10px] font-bold">{formatPersianNumber(e.count)}</span>
                    <div className="w-16 h-1.5 rounded-full bg-black/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-current opacity-50 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Critical Events */}
      <Card className="card-gold-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PulseIndicator active={!loading} />
              <ShieldAlert className="size-4 text-red-400" /> آخرین رویدادها
            </CardTitle>
            <div className="flex items-center gap-3">
              {/* Auto-Refresh Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">بروزرسانی خودکار</span>
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={fetchStats}>
                <RefreshCw className={cn('size-3', autoRefresh && 'animate-spin')} /> بروزرسانی
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))
                : stats?.recentEvents.length
                  ? stats.recentEvents.map((event) => {
                      const TypeIcon = typeIcons[event.type] || Info;
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                            event.severity === 'critical'
                              ? 'bg-red-500/5 border-red-500/20'
                              : event.severity === 'warning'
                                ? 'bg-amber-500/5 border-amber-500/20'
                                : 'bg-muted/30 border-border/50'
                          )}
                        >
                          <div
                            className={cn(
                              'size-9 rounded-lg flex items-center justify-center shrink-0',
                              event.severity === 'critical'
                                ? 'bg-red-500/10'
                                : event.severity === 'warning'
                                  ? 'bg-amber-500/10'
                                  : 'bg-blue-500/10'
                            )}
                          >
                            <TypeIcon
                              className={cn(
                                'size-4',
                                event.severity === 'critical'
                                  ? 'text-red-400'
                                  : event.severity === 'warning'
                                    ? 'text-amber-400'
                                    : 'text-blue-400'
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getTypeBadge(event.type)}
                              {getSeverityBadge(event.severity)}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {event.ip && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Globe className="size-3" />{event.ip}
                                </span>
                              )}
                              {event.phone && (
                                <span className="text-[10px] text-muted-foreground">{event.phone}</span>
                              )}
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="size-3" />{getTimeAgo(event.createdAt)}
                              </span>
                            </div>
                          </div>
                          {event.riskScore > 0 && (
                            <Badge
                              className={cn(
                                'text-[10px]',
                                event.riskScore >= 70
                                  ? 'bg-red-500/15 text-red-400'
                                  : event.riskScore >= 30
                                    ? 'bg-amber-500/15 text-amber-400'
                                    : 'bg-gray-500/15 text-gray-400'
                              )}
                            >
                              ریسک: {event.riskScore}
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  : (
                    <div className="text-center py-8">
                      <ShieldCheck className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">رویداد امنیتی ثبت نشده</p>
                    </div>
                  )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab 2: Events (Enhanced)                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function EventsTab() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [ipSearch, setIpSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (ipSearch.trim()) params.set('ip', ipSearch.trim());
      const res = await fetch(`/api/admin/security/events?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, typeFilter, severityFilter, ipSearch]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleResolve = async (eventId: string) => {
    setResolving(eventId);
    try {
      const res = await fetch('/api/admin/security/events/resolve', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId }),
      });
      if (res.ok) {
        useAppStore.getState().addToast('رویداد به عنوان بررسی‌شده علامت‌گذاری شد', 'success');
        setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, resolved: true } : e));
      } else {
        useAppStore.getState().addToast('خطا در علامت‌گذاری', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا', 'error');
    }
    setResolving(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="size-3.5" />
          <span>نوع:</span>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="all">همه</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>شدت:</span>
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="all">همه</option>
            <option value="info">اطلاعات</option>
            <option value="warning">هشدار</option>
            <option value="critical">بحرانی</option>
          </select>
        </div>
        {/* IP Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={ipSearch}
              onChange={(e) => { setIpSearch(e.target.value); setPage(1); }}
              placeholder="جستجوی IP..."
              dir="ltr"
              className="h-8 w-40 pl-2 pr-8 text-xs font-mono"
            />
          </div>
        </div>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={fetchEvents}>
          <RefreshCw className="size-3" /> بروزرسانی
        </Button>
      </div>

      {/* Events Table */}
      <Card className="card-gold-border">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <div className="divide-y divide-border/50">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 p-3 text-[10px] font-semibold text-muted-foreground sticky top-0 bg-card z-10">
                <div className="col-span-3">نوع</div>
                <div className="col-span-2">شدت</div>
                <div className="col-span-2">IP</div>
                <div className="col-span-2">تلفن</div>
                <div className="col-span-2">تاریخ</div>
                <div className="col-span-1">عملیات</div>
              </div>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))
                : events.length > 0
                  ? events.map((event) => {
                      const TypeIcon = typeIcons[event.type] || Info;
                      const isExpanded = expandedId === event.id;
                      return (
                        <React.Fragment key={event.id}>
                          <div
                            className={cn(
                              'grid grid-cols-12 gap-2 p-3 items-center text-xs transition-colors cursor-pointer hover:bg-muted/30',
                              event.severity === 'critical' && 'bg-red-500/5',
                              event.resolved && 'opacity-60'
                            )}
                            onClick={() => setExpandedId(isExpanded ? null : event.id)}
                          >
                            {/* Type */}
                            <div className="col-span-3 flex items-center gap-2 min-w-0">
                              <TypeIcon className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate text-[11px]">{typeLabels[event.type] || event.type}</span>
                              {event.resolved && (
                                <CheckCircle className="size-3 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            {/* Severity */}
                            <div className="col-span-2">{getSeverityBadge(event.severity)}</div>
                            {/* IP */}
                            <div className="col-span-2 text-[11px] text-muted-foreground truncate" dir="ltr">
                              {event.ip || '—'}
                            </div>
                            {/* Phone */}
                            <div className="col-span-2 text-[11px] text-muted-foreground truncate">
                              {event.phone || '—'}
                            </div>
                            {/* Date */}
                            <div className="col-span-2 text-[10px] text-muted-foreground">
                              {getTimeAgo(event.createdAt)}
                            </div>
                            {/* Actions */}
                            <div className="col-span-1 flex justify-center items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {isExpanded ? (
                                <ChevronUp className="size-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="size-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          {/* Expandable Details */}
                          <div
                            className={cn(
                              'overflow-hidden transition-all duration-300 ease-in-out',
                              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            )}
                          >
                            <div className="p-4 bg-muted/20 space-y-3 border-t border-border/30">
                              <div className="flex flex-wrap gap-2">
                                {event.userAgent && (
                                  <div className="flex-1 min-w-[200px]">
                                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                                      <Monitor className="size-3" /> User Agent
                                    </p>
                                    <p className="text-[11px] bg-background/50 rounded-md p-2 break-all font-mono" dir="ltr">
                                      {event.userAgent}
                                    </p>
                                  </div>
                                )}
                                {(event.url || event.method) && (
                                  <div className="min-w-[150px]">
                                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                                      <Globe className="size-3" /> آدرس و متد
                                    </p>
                                    <p className="text-[11px] bg-background/50 rounded-md p-2 font-mono" dir="ltr">
                                      {event.method && (
                                        <Badge className="text-[9px] bg-gold/15 text-gold ml-1">{event.method}</Badge>
                                      )}
                                      {event.url || '—'}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {event.details && (
                                <div>
                                  <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                                    <Info className="size-3" /> جزئیات کامل
                                  </p>
                                  <pre className="text-[10px] bg-background/50 rounded-md p-2 overflow-x-auto font-mono text-muted-foreground" dir="ltr">
                                    {JSON.stringify(event.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {!event.resolved && (
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-[10px] gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/30"
                                    disabled={resolving === event.id}
                                    onClick={() => handleResolve(event.id)}
                                  >
                                    <CheckCircle className="size-3" />
                                    {resolving === event.id ? 'در حال بررسی...' : 'بررسی شد'}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  : (
                    <div className="text-center py-12">
                      <Activity className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">رویدادی یافت نشد</p>
                    </div>
                  )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-xs">
            قبلی
          </Button>
          <span className="text-xs text-muted-foreground">
            {formatPersianNumber(page)} / {formatPersianNumber(totalPages)}
          </span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="text-xs">
            بعدی
          </Button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab 3: Blocked IPs                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function BlockedIPsTab() {
  const [ips, setIps] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchIPs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/security/blocked-ips', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIps(data.ips || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchIPs(); }, [fetchIPs]);

  const handleBlock = async () => {
    if (!newIP.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/admin/security/blocked-ips', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: newIP.trim(), reason: newReason.trim() || null }),
      });
      if (res.ok) {
        useAppStore.getState().addToast('IP با موفقیت مسدود شد', 'success');
        setNewIP('');
        setNewReason('');
        fetchIPs();
      } else {
        const err = await res.json();
        useAppStore.getState().addToast(err.message || 'خطا در مسدودسازی', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا', 'error');
    }
    setAdding(false);
  };

  const handleUnblock = async (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این IP را باز کنید؟')) return;
    try {
      const res = await fetch('/api/admin/security/blocked-ips', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        useAppStore.getState().addToast('IP باز شد', 'success');
        fetchIPs();
      }
    } catch {
      useAppStore.getState().addToast('خطا', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Add New IP */}
      <Card className="card-gold-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Plus className="size-4 text-gold" /> مسدودسازی IP جدید
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                placeholder="مثال: 192.168.1.100"
                dir="ltr"
                className="h-9 text-sm font-mono"
              />
            </div>
            <div className="flex-1">
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="دلیل مسدودسازی..."
                className="h-9 text-sm"
              />
            </div>
            <Button
              onClick={handleBlock}
              disabled={adding || !newIP.trim()}
              className="bg-red-500/80 hover:bg-red-500 text-white gap-1.5 text-xs shrink-0"
            >
              <Ban className="size-3.5" />
              {adding ? 'در حال مسدودسازی...' : 'مسدود'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blocked IPs List */}
      <Card className="card-gold-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Ban className="size-4 text-red-400" /> IPهای مسدود ({formatPersianNumber(ips.length)})
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={fetchIPs}>
              <RefreshCw className="size-3" /> بروزرسانی
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))
                : ips.length > 0
                  ? ips.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-red-500/15 bg-red-500/5"
                      >
                        <div className="size-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                          <Ban className="size-4 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono font-medium text-red-400" dir="ltr">{item.ip}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {item.reason && (
                              <span className="text-[10px] text-muted-foreground">{item.reason}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" />{getTimeAgo(item.createdAt)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 shrink-0"
                          onClick={() => handleUnblock(item.id)}
                        >
                          <ShieldCheck className="size-3.5" /> باز کردن
                        </Button>
                      </div>
                    ))
                  : (
                    <div className="text-center py-8">
                      <ShieldCheck className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">IP مسدودی وجود ندارد</p>
                    </div>
                  )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab 4: Sessions (Enhanced)                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SessionsTab() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/security/sessions', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleRevoke = async (token: string) => {
    if (!confirm('آیا مطمئن هستید؟ این نشست ابطال خواهد شد.')) return;
    try {
      const res = await fetch('/api/admin/security/sessions', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        useAppStore.getState().addToast('نشست ابطال شد', 'success');
        fetchSessions();
      } else {
        useAppStore.getState().addToast('خطا در ابطال نشست', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا', 'error');
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm('آیا مطمئن هستید؟ تمام نشست‌های فعال ابطال خواهند شد. این عمل غیرقابل بازگشت است.')) return;
    setRevokingAll(true);
    try {
      const res = await fetch('/api/admin/security/sessions', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeAll: true }),
      });
      if (res.ok) {
        useAppStore.getState().addToast('تمام نشست‌ها با موفقیت ابطال شدند', 'success');
        fetchSessions();
      } else {
        useAppStore.getState().addToast('خطا در ابطال نشست‌ها', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا', 'error');
    }
    setRevokingAll(false);
  };

  const isSessionOnline = (session: UserSession): boolean => {
    if (!session.expiresAt) return false;
    return new Date(session.expiresAt) > new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Globe className="size-5 text-gold" />
          نشست‌های فعال
          <Badge className="bg-gold/15 text-gold text-[10px]">
            {formatPersianNumber(sessions.length)}
          </Badge>
        </h2>
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
              disabled={revokingAll || loading}
              onClick={handleRevokeAll}
            >
              <Trash2 className={cn('size-3.5', revokingAll && 'animate-spin')} />
              {revokingAll ? 'در حال ابطال...' : 'ابطال همه نشست‌ها'}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={fetchSessions}>
            <RefreshCw className="size-3" /> بروزرسانی
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[600px]">
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            : sessions.length > 0
              ? sessions.map((session) => {
                  const online = isSessionOnline(session);
                  return (
                    <Card key={session.id} className={cn('hover-lift-sm', online ? 'card-gold-border' : 'opacity-70')}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative size-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                              {getDeviceIcon(session.device)}
                              {/* Online/Offline Status Dot */}
                              <span className={cn(
                                'absolute -top-0.5 -left-0.5 size-3 rounded-full border-2 border-card',
                                online ? 'bg-emerald-500' : 'bg-gray-500'
                              )} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {session.user.fullName || session.user.phone}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] shrink-0"
                                >
                                  {session.user.role === 'super_admin' ? 'مدیر ارشد' : session.user.role === 'admin' ? 'مدیر' : 'کاربر'}
                                </Badge>
                                <Badge className={cn(
                                  'text-[9px] shrink-0',
                                  online ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'
                                )}>
                                  {online ? 'آنلاین' : 'آفلاین'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Globe className="size-3" />{session.ip || '—'}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  {getDeviceIcon(session.device)}
                                  <span className="mr-0.5">{session.device || 'نامشخص'}</span>
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Timer className="size-3" />انقضا: {getTimeAgo(session.expiresAt)}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="size-3" />{getTimeAgo(session.updatedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0 gap-1"
                            onClick={() => handleRevoke(session.token)}
                          >
                            <Trash2 className="size-3.5" /> ابطال
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              : (
                <div className="text-center py-12">
                  <Globe className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">نشست فعالی وجود ندارد</p>
                </div>
              )}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab 5: Live Stats (آمار زنده)                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function LiveStatsTab() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timelineEvents, setTimelineEvents] = useState<SecurityEvent[]>([]);

  const fetchLiveData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/security/stats', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setTimelineEvents(data.recentEvents?.slice(0, 20) || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLiveData(); }, [fetchLiveData]);

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(fetchLiveData, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  const threat = getThreatLevel(stats);

  // Generate 7-day trend data (mock based on current stats if no real data)
  const weeklyTrend = stats ? [
    { day: 'شنبه', count: Math.max(1, Math.round(stats.week / 7 * 0.8)) },
    { day: 'یکشنبه', count: Math.max(1, Math.round(stats.week / 7 * 1.2)) },
    { day: 'دوشنبه', count: Math.max(1, Math.round(stats.week / 7 * 0.6)) },
    { day: 'سه‌شنبه', count: Math.max(1, Math.round(stats.week / 7 * 1.5)) },
    { day: 'چهارشنبه', count: Math.max(1, Math.round(stats.week / 7 * 0.9)) },
    { day: 'پنجشنبه', count: Math.max(1, Math.round(stats.week / 7 * 1.1)) },
    { day: 'جمعه', count: Math.max(1, stats.today) },
  ] : [];
  const maxTrend = Math.max(...weeklyTrend.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PulseIndicator active={!loading} />
          <h2 className="text-base font-bold flex items-center gap-2">
            <Radio className="size-5 text-gold" />
            آمار زنده
          </h2>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={fetchLiveData}>
          <RefreshCw className="size-3" /> بروزرسانی
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Activity Timeline */}
        <Card className="card-gold-border lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="size-4 text-gold" />
              خط زمانی فعالیت‌ها
              <Badge className="bg-gold/15 text-gold text-[9px]">آخرین ۲۰ رویداد</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : timelineEvents.length > 0 ? (
                <div className="relative pr-6">
                  {/* Vertical connecting line */}
                  <div className="absolute right-[7px] top-2 bottom-2 w-px bg-border/50" />

                  <div className="space-y-3">
                    {timelineEvents.map((event, index) => {
                      const TypeIcon = typeIcons[event.type] || Info;
                      const dotColor = event.severity === 'critical'
                        ? 'bg-red-400'
                        : event.severity === 'warning'
                          ? 'bg-amber-400'
                          : event.type === 'auth_success' || event.type === 'mfa_enabled'
                            ? 'bg-emerald-400'
                            : 'bg-blue-400';

                      return (
                        <div key={event.id} className="relative flex items-start gap-3">
                          {/* Timeline dot */}
                          <div className={cn(
                            'absolute right-[-21px] top-1.5 size-[14px] rounded-full border-2 border-card z-10',
                            dotColor,
                          )} />

                          {/* Event content */}
                          <div className={cn(
                            'flex-1 p-3 rounded-lg border transition-colors',
                            event.severity === 'critical'
                              ? 'bg-red-500/5 border-red-500/20'
                              : event.severity === 'warning'
                                ? 'bg-amber-500/5 border-amber-500/20'
                                : 'bg-muted/30 border-border/50'
                          )}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <TypeIcon className="size-3.5 text-muted-foreground shrink-0" />
                                <span className="text-[11px] font-medium truncate">
                                  {typeLabels[event.type] || event.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {getSeverityBadge(event.severity)}
                                <span className="text-[9px] text-muted-foreground">
                                  {getTimeAgo(event.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {event.ip && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1" dir="ltr">
                                  <Globe className="size-3" />{event.ip}
                                </span>
                              )}
                              {event.phone && (
                                <span className="text-[10px] text-muted-foreground">{event.phone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">رویدادی یافت نشد</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Column: Threat Level + Weekly Chart */}
        <div className="space-y-4">
          {/* Threat Level Indicator */}
          <Card className="card-gold-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Flame className="size-4 text-orange-400" />
                سطح تهدید
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">وضعیت فعلی:</span>
                  <Badge className={cn('text-[10px]', threat.color === 'text-emerald-400' ? 'bg-emerald-500/15 text-emerald-400' : threat.color === 'text-amber-400' ? 'bg-amber-500/15 text-amber-400' : threat.color === 'text-orange-400' ? 'bg-orange-500/15 text-orange-400' : 'bg-red-500/15 text-red-400')}>
                    {threat.level}
                  </Badge>
                </div>
                {/* Threat Level Bar */}
                <div className="w-full h-3 rounded-full bg-muted/50 overflow-hidden relative">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700 ease-out', threat.bg)}
                    style={{ width: `${threat.percent}%` }}
                  />
                  {/* Threshold markers */}
                  <div className="absolute top-0 left-1/4 h-full w-px bg-border/30" />
                  <div className="absolute top-0 left-1/2 h-full w-px bg-border/30" />
                  <div className="absolute top-0 left-3/4 h-full w-px bg-border/30" />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
                  <span>کم</span>
                  <span>متوسط</span>
                  <span>زیاد</span>
                  <span>بحرانی</span>
                </div>

                {stats && (
                  <Separator className="my-2" />
                )}

                {stats && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <ShieldAlert className="size-3 text-red-400" /> رویداد بحرانی
                      </span>
                      <span className="text-xs font-bold text-red-400">{formatPersianNumber(stats.critical)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <XCircle className="size-3 text-orange-400" /> تلاش ناموفق
                      </span>
                      <span className="text-xs font-bold text-orange-400">{formatPersianNumber(stats.authFailures)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Bot className="size-3 text-amber-400" /> ربات شناسایی شده
                      </span>
                      <span className="text-xs font-bold text-amber-400">{formatPersianNumber(stats.botDetections)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 7-Day Trend Mini Chart (Pure CSS Bars) */}
          <Card className="card-gold-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="size-4 text-gold" />
                روند ۷ روزه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {weeklyTrend.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-muted-foreground font-medium">
                      {formatPersianNumber(d.count)}
                    </span>
                    <div className="w-full bg-muted/30 rounded-t-sm relative overflow-hidden" style={{ height: '100%' }}>
                      <div
                        className={cn(
                          'absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-700 ease-out',
                          i === 6 ? 'bg-gold' : 'bg-gold/40'
                        )}
                        style={{ height: `${Math.max(5, (d.count / maxTrend) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                      {d.day.slice(0, 2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3 mt-3 text-[9px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-gold/40" />
                  <span>روزهای قبل</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-gold" />
                  <span>امروز</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Tab 6: Settings (Interactive)                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface SecuritySetting {
  key: string;
  label: string;
  type: 'toggle' | 'number';
  value: boolean | number;
  icon: React.ElementType;
  color: string;
  desc: string;
}

function SettingsTab() {
  const [settings, setSettings] = useState<SecuritySetting[]>([
    { key: 'maxLoginAttempts', label: 'حداکثر تلاش ورود', type: 'number', value: 5, icon: Lock, color: 'text-gold', desc: 'تعداد دفعات مجاز تلاش ناموفق برای ورود' },
    { key: 'sessionDuration', label: 'مدت نشست (روز)', type: 'number', value: 7, icon: Clock, color: 'text-blue-400', desc: 'بیشترین مدت اعتبار نشست کاربر' },
    { key: 'mfaEnabled', label: 'احراز هویت دو مرحله‌ای', type: 'toggle', value: true, icon: ShieldCheck, color: 'text-emerald-400', desc: 'تایید با رمز یکبار مصرف در ورود' },
    { key: 'autoBlockIP', label: 'مسدودسازی خودکار IP', type: 'toggle', value: true, icon: Ban, color: 'text-red-400', desc: 'مسدودسازی خودکار پس از تلاش ناموفق بیش از حد' },
    { key: 'botScan', label: 'اسکن ربات', type: 'toggle', value: true, icon: Bot, color: 'text-amber-400', desc: 'شناسایی و مسدودسازی ربات‌ها' },
    { key: 'suspiciousAlerts', label: 'اعلان فعالیت مشکوک', type: 'toggle', value: true, icon: AlertTriangle, color: 'text-orange-400', desc: 'ارسال اعلان هنگام شناسایی فعالیت مشکوک' },
    { key: 'sensitiveLog', label: 'لاگ عملیات حساس', type: 'toggle', value: true, icon: Eye, color: 'text-purple-400', desc: 'ثبت تمام عملیات حساس کاربران' },
    { key: 'concurrentSession', label: 'بررسی نشست همزمان', type: 'toggle', value: false, icon: Users, color: 'text-gray-400', desc: 'محدودسازی تعداد نشست‌های همزمان' },
    { key: 'strongPassword', label: 'رمز عبور قوی الزامی', type: 'toggle', value: true, icon: Shield, color: 'text-emerald-400', desc: 'الزام به رمز عبور حداقل ۸ کاراکتر با اعداد و نمادها' },
    { key: 'passwordExpiry', label: 'تغییر رمز دوره‌ای (روز)', type: 'number', value: 90, icon: RefreshCw, color: 'text-gold', desc: 'بازه زمانی تغییر اجباری رمز عبور' },
  ]);

  const [saving, setSaving] = useState(false);

  // Firewall Rules
  const [firewallRules, setFirewallRules] = useState([
    { key: 'blockTor', label: 'مسدودسازی ترافیک تور', desc: 'مسدود کردن ورودی‌های شبکه TOR', enabled: true },
    { key: 'blockVPN', label: 'مسدودسازی VPN شناسایی‌شده', desc: 'مسدودسازی آی‌پی‌های شناخته‌شده VPN', enabled: false },
    { key: 'rateLimit', label: 'محدودیت نرخ درخواست', desc: 'حداکثر ۱۰۰ درخواست در دقیقه برای هر IP', enabled: true },
    { key: 'geoBlock', label: 'مسدودسازی جغرافیایی', desc: 'مسدودسازی IP از کشورهای مشخص', enabled: false },
    { key: 'ddosProtection', label: 'محافظت در برابر DDoS', desc: 'تشخیص و مسدودسازی حمله DDoS', enabled: true },
    { key: 'sqlInjection', label: 'جلوگیری از SQL Injection', desc: 'شناسایی و مسدودسازی درخواست‌های مخرب SQL', enabled: true },
    { key: 'xssProtection', label: 'جلوگیری از XSS', desc: 'شناسایی و مسدودسازی حملات Cross-Site Scripting', enabled: true },
    { key: 'csrfToken', label: 'توکن CSRF', desc: 'اعتبارسنجی توکن CSRF در تمام فرم‌ها', enabled: true },
  ]);

  const updateSetting = (key: string, value: boolean | number) => {
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value } : s));
  };

  const updateFirewallRule = (key: string, enabled: boolean) => {
    setFirewallRules((prev) => prev.map((r) => r.key === key ? { ...r, enabled } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsPayload = settings.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {} as Record<string, boolean | number>);

      const firewallPayload = firewallRules.reduce((acc, r) => {
        acc[r.key] = r.enabled;
        return acc;
      }, {} as Record<string, boolean>);

      const res = await fetch('/api/admin/security/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsPayload, firewall: firewallPayload }),
      });
      if (res.ok) {
        useAppStore.getState().addToast('تنظیمات با موفقیت ذخیره شد', 'success');
      } else {
        useAppStore.getState().addToast('خطا در ذخیره تنظیمات', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا در ارتباط با سرور', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Settings className="size-5 text-gold" />
          تنظیمات امنیتی
        </h2>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gold/80 hover:bg-gold text-black gap-1.5 text-xs font-bold"
        >
          <Save className={cn('size-3.5', saving && 'animate-spin')} />
          {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </Button>
      </div>

      {/* Security Settings */}
      <Card className="card-gold-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Lock className="size-4 text-gold" />
            تنظیمات عمومی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {settings.map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="size-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                    <setting.icon className={cn('size-4', setting.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{setting.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{setting.desc}</p>
                  </div>
                </div>
                {setting.type === 'toggle' ? (
                  <Switch
                    checked={setting.value as boolean}
                    onCheckedChange={(checked) => updateSetting(setting.key, checked)}
                    className="data-[state=checked]:bg-gold shrink-0"
                  />
                ) : (
                  <Input
                    type="number"
                    value={setting.value as number}
                    onChange={(e) => updateSetting(setting.key, parseInt(e.target.value) || 0)}
                    className="h-8 w-20 text-xs text-center font-mono shrink-0"
                    dir="ltr"
                    min={0}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Firewall Rules */}
      <Card className="card-gold-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Flame className="size-4 text-orange-400" />
            قوانین دیوار آتش
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {firewallRules.map((rule) => (
              <div
                key={rule.key}
                className={cn(
                  'flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors',
                  rule.enabled
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-border/50 bg-muted/20'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{rule.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{rule.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={cn(
                    'text-[9px]',
                    rule.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'
                  )}>
                    {rule.enabled ? 'فعال' : 'غیرفعال'}
                  </Badge>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => updateFirewallRule(rule.key, checked)}
                    className="data-[state=checked]:bg-emerald-500 shrink-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
