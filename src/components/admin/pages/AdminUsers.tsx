'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Filter,
  Users,
  Shield,
  Crown,
  Snowflake,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  Gem,
  UserCheck,
  UserX,
  Bell,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
  UserPlus,
  Key,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helper: Time Ago                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function timeAgo(date: Date | string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'همین الان';
  if (s < 3600) return `${Math.floor(s / 60)} دقیقه پیش`;
  if (s < 86400) return `${Math.floor(s / 3600)} ساعت پیش`;
  if (s < 604800) return `${Math.floor(s / 86400)} روز پیش`;
  return new Intl.DateTimeFormat('fa-IR').format(new Date(date));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Config: Roles, Levels, KYC                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon?: string }> = {
  user: { label: 'کاربر عادی', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  admin: { label: 'مدیر سیستم', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  super_admin: { label: 'مدیر ارشد', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  support_admin: { label: 'مدیر پشتیبانی', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  finance_admin: { label: 'مدیر مالی', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  support_agent: { label: 'اپراتور پشتیبانی', color: 'text-violet-400', bg: 'bg-violet-500/20' },
  viewer: { label: 'بازدیدکننده', color: 'text-gray-400', bg: 'bg-gray-500/20' },
};

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  none: { label: 'بدون سطح', color: 'text-gray-400', bg: 'bg-gray-500/20', emoji: '⚪' },
  bronze: { label: 'برنز', color: 'text-orange-400', bg: 'bg-orange-500/20', emoji: '🥉' },
  silver: { label: 'نقره', color: 'text-gray-300', bg: 'bg-gray-400/20', emoji: '🥈' },
  gold: { label: 'طلا', color: 'text-yellow-400', bg: 'bg-yellow-500/20', emoji: '🥇' },
  diamond: { label: 'الماس', color: 'text-violet-400', bg: 'bg-violet-500/20', emoji: '💎' },
};

const KYC_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  none: { label: 'بدون درخواست', color: 'text-gray-400', bg: 'bg-gray-500/20' },
  pending: { label: 'در انتظار', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  approved: { label: 'تایید شده', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  rejected: { label: 'رد شده', color: 'text-red-400', bg: 'bg-red-500/20' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'فعال', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  frozen: { label: 'یخ‌زده', color: 'text-red-400', bg: 'bg-red-500/20' },
  inactive: { label: 'غیرفعال', color: 'text-gray-400', bg: 'bg-gray-500/20' },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Interfaces                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface UserProfile {
  nationalId?: string | null;
  birthDate?: string | null;
  iban?: string | null;
  address?: string | null;
}

interface Wallet {
  balance: number;
  frozenBalance: number;
}

interface GoldWallet {
  goldGrams: number;
  frozenGold: number;
}

interface KycRecord {
  status: string;
  nationalId?: string | null;
  birthDate?: string | null;
  iban?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

interface GamificationData {
  xp: number;
  level: number;
  currentStreak: number;
}

interface Session {
  id: string;
  device?: string | null;
  ip?: string | null;
  lastActive?: string | null;
  userAgent?: string | null;
}

interface AdminUser {
  id: string;
  phone: string;
  email: string | null;
  password?: string;
  fullName: string | null;
  isVerified: boolean;
  isActive: boolean;
  isFrozen: boolean;
  role: string;
  avatar?: string | null;
  referredBy?: string | null;
  referralCode?: string;
  userLevel: string;
  levelUpgradedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile | null;
  wallet?: Wallet | null;
  goldWallet?: GoldWallet | null;
  kyc?: KycRecord | null;
  gamification?: GamificationData | null;
  sessions?: Session[];
  activities?: Array<{ id: string; type: string; description?: string; createdAt: string }>;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sub-Components                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function StatCard({
  title,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  borderClass,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass?: string;
}) {
  return (
    <Card className={cn('border', borderClass || 'border-gold/10')}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={cn('text-2xl font-bold', colorClass)}>{value.toLocaleString('fa-IR')}</p>
          </div>
          <div className={cn('rounded-xl p-2.5', bgClass)}>
            <Icon className={cn('size-5', colorClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserAvatar({ user, size = 'md' }: { user: AdminUser; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-16 text-xl' };
  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n.charAt(0))
        .slice(0, 2)
        .join('')
    : user.phone.slice(-2);
  return (
    <Avatar className={sizeMap[size]}>
      {user.avatar && <AvatarImage src={user.avatar} alt={user.fullName || ''} />}
      <AvatarFallback className="bg-gold/15 text-gold font-bold">{initials}</AvatarFallback>
    </Avatar>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const Icon = role === 'super_admin' ? Crown : role === 'admin' ? Shield : null;
  return (
    <Badge variant="outline" className={cn('text-[10px] border-transparent', cfg.color, cfg.bg)}>
      {Icon && <Icon className="size-3 ml-1" />}
      {cfg.label}
    </Badge>
  );
}

function LevelBadge({ level }: { level: string }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.none;
  return (
    <Badge variant="outline" className={cn('text-[10px] border-transparent', cfg.color, cfg.bg)}>
      {cfg.emoji} {cfg.label}
    </Badge>
  );
}

function KycBadge({ status }: { status: string }) {
  const cfg = KYC_CONFIG[status] || KYC_CONFIG.none;
  return (
    <Badge variant="outline" className={cn('text-[10px] border-transparent', cfg.color, cfg.bg)}>
      {status === 'approved' && <CheckCircle className="size-3 ml-1" />}
      {status === 'pending' && <Clock className="size-3 ml-1" />}
      {status === 'rejected' && <XCircle className="size-3 ml-1" />}
      {cfg.label}
    </Badge>
  );
}

function StatusBadge({ user }: { user: AdminUser }) {
  if (user.isFrozen) {
    return (
      <Badge variant="outline" className="text-[10px] border-transparent text-red-400 bg-red-500/20">
        <Snowflake className="size-3 ml-1" />
        یخ‌زده
      </Badge>
    );
  }
  if (!user.isActive) {
    return (
      <Badge variant="outline" className="text-[10px] border-transparent text-gray-400 bg-gray-500/20">
        غیرفعال
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] border-transparent text-emerald-400 bg-emerald-500/20">
      <CheckCircle className="size-3 ml-1" />
      فعال
    </Badge>
  );
}

function InfoRow({ label, value, icon: Icon, dir }: { label: string; value: string | number | null | undefined; icon?: React.ElementType; dir?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="size-4" />}
        {label}
      </span>
      <span className={cn('text-sm font-medium', dir && 'font-mono')} dir={dir}>
        {value || '-'}
      </span>
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="space-y-0 divide-y divide-border/50">{children}</div>;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  User Detail Dialog — Account Info Tab                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AccountInfoTab({ user }: { user: AdminUser }) {
  return (
    <div className="space-y-4">
      <InfoGrid>
        <InfoRow label="شماره تلفن" value={user.phone} dir="ltr" />
        <InfoRow label="ایمیل" value={user.email} dir="ltr" />
        <InfoRow label="نام کامل" value={user.fullName || 'بدون نام'} />
        <InfoRow label="نقش" value={ROLE_CONFIG[user.role]?.label || 'کاربر عادی'} />
        <InfoRow label="سطح کاربر" value={`${LEVEL_CONFIG[user.userLevel]?.emoji || '⚪'} ${LEVEL_CONFIG[user.userLevel]?.label || 'بدون سطح'}`} />
        <InfoRow
          label="وضعیت احراز هویت"
          value={user.isVerified ? '✅ تایید شده' : '❌ تایید نشده'}
        />
        <InfoRow
          label="وضعیت حساب"
          value={user.isFrozen ? '❄️ یخ‌زده' : user.isActive ? '✅ فعال' : '⛔ غیرفعال'}
        />
      </InfoGrid>
      <Separator />
      <div>
        <h4 className="text-sm font-semibold mb-3 text-gold">تاریخ‌ها</h4>
        <InfoGrid>
          <InfoRow label="تاریخ عضویت" value={user.createdAt ? timeAgo(user.createdAt) : '-'} />
          <InfoRow label="آخرین ورود" value={user.lastLoginAt ? timeAgo(user.lastLoginAt) : 'هرگز'} />
          <InfoRow label="ارتقای سطح" value={user.levelUpgradedAt ? timeAgo(user.levelUpgradedAt) : '-'} />
          <InfoRow label="آخرین بروزرسانی" value={user.updatedAt ? timeAgo(user.updatedAt) : '-'} />
        </InfoGrid>
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-semibold mb-3 text-gold">زیرمجموعه و دعوت</h4>
        <InfoGrid>
          <InfoRow label="کد دعوت" value={user.referralCode} dir="ltr" />
          <InfoRow label="دعوت‌شده توسط" value={user.referredBy} dir="ltr" />
        </InfoGrid>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  User Detail Dialog — Wallet Tab                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function WalletTab({ user, goldPrice }: { user: AdminUser; goldPrice: number }) {
  const fiatBalance = user.wallet?.balance ?? 0;
  const fiatFrozen = user.wallet?.frozenBalance ?? 0;
  const goldGrams = user.goldWallet?.goldGrams ?? 0;
  const goldFrozen = user.goldWallet?.frozenGold ?? 0;
  const goldValue = goldGrams * goldPrice;

  return (
    <div className="space-y-6">
      {/* Fiat Wallet */}
      <Card className="border-gold/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="size-4 text-gold" />
            کیف پول ریالی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10">
            <span className="text-sm text-muted-foreground">موجودی فعال</span>
            <span className="text-lg font-bold text-emerald-400">
              {fiatBalance.toLocaleString('fa-IR')}{' '}
              <span className="text-xs text-muted-foreground">تومان</span>
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
            <span className="text-sm text-muted-foreground">موجودی مسدود</span>
            <span className="text-lg font-bold text-red-400">
              {fiatFrozen.toLocaleString('fa-IR')}{' '}
              <span className="text-xs text-muted-foreground">تومان</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Gold Wallet */}
      <Card className="border-gold/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gem className="size-4 text-gold" />
            کیف پول طلا
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gold/10">
            <span className="text-sm text-muted-foreground">طلای فعال</span>
            <span className="text-lg font-bold text-gold">
              {goldGrams.toLocaleString('fa-IR')}{' '}
              <span className="text-xs text-muted-foreground">گرم</span>
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
            <span className="text-sm text-muted-foreground">طلای مسدود</span>
            <span className="text-lg font-bold text-red-400">
              {goldFrozen.toLocaleString('fa-IR')}{' '}
              <span className="text-xs text-muted-foreground">گرم</span>
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
            <span className="text-sm text-muted-foreground">ارزش تقریبی طلا</span>
            <span className="text-lg font-bold text-yellow-400">
              {goldValue > 0
                ? `${Math.round(goldValue).toLocaleString('fa-IR')} تومان`
                : '-'}
              <span className="block text-[10px] text-muted-foreground">
                (قیمت هر گرم: {goldPrice.toLocaleString('fa-IR')} تومان)
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  User Detail Dialog — KYC Tab                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function KycTab({
  user,
  onApproveKyc,
  onRejectKyc,
}: {
  user: AdminUser;
  onApproveKyc: () => void;
  onRejectKyc: () => void;
}) {
  const kyc = user.kyc;
  const status = kyc?.status || 'none';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
        <span className="text-sm font-medium">وضعیت احراز هویت</span>
        <KycBadge status={status} />
      </div>

      {status === 'none' && (
        <div className="text-center py-8 text-muted-foreground">
          <UserX className="size-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">کاربر هنوز درخواست احراز هویت ثبت نکرده است.</p>
        </div>
      )}

      {kyc && status !== 'none' && (
        <>
          <InfoGrid>
            <InfoRow label="کد ملی" value={kyc.nationalId} dir="ltr" />
            <InfoRow label="تاریخ تولد" value={kyc.birthDate} />
            <InfoRow label="شماره شبا" value={kyc.iban} dir="ltr" />
            <InfoRow label="تاریخ ارسال" value={kyc.submittedAt ? timeAgo(kyc.submittedAt) : '-'} />
            <InfoRow label="تاریخ بررسی" value={kyc.reviewedAt ? timeAgo(kyc.reviewedAt) : '-'} />
          </InfoGrid>

          {kyc.rejectionReason && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400 font-medium mb-1">دلیل رد:</p>
              <p className="text-sm text-red-300">{kyc.rejectionReason}</p>
            </div>
          )}
        </>
      )}

      {status === 'pending' && (
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={onApproveKyc}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle className="size-4 ml-1.5" />
            تایید احراز هویت
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRejectKyc}
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <XCircle className="size-4 ml-1.5" />
            رد درخواست
          </Button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  User Detail Dialog — Activity Tab                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ActivityTab({ user }: { user: AdminUser }) {
  const sessions = user.sessions || [];
  const activities = user.activities || [];

  return (
    <div className="space-y-6">
      {/* Account Creation */}
      <Card className="border-gold/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-gold/10">
              <Clock className="size-4 text-gold" />
            </div>
            <div>
              <p className="text-sm font-medium">تاریخ ایجاد حساب</p>
              <p className="text-xs text-muted-foreground">{user.createdAt ? timeAgo(user.createdAt) : '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Sessions */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-gold">سوابق ورود</h4>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">سابقه ورودی ثبت نشده است.</p>
        ) : (
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {sessions.map((session) => (
                <Card key={session.id} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                          <Shield className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{session.device || 'دستگاه ناشناخته'}</p>
                          <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                            {session.ip || '-'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {session.lastActive ? timeAgo(session.lastActive) : '-'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-gold">فعالیت‌های اخیر</h4>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">فعالیتی ثبت نشده است.</p>
        ) : (
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {activities.slice(0, 20).map((activity) => (
                <Card key={activity.id} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">{activity.type}</p>
                        {activity.description && (
                          <p className="text-[10px] text-muted-foreground">{activity.description}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap mr-2">
                        {timeAgo(activity.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  User Detail Dialog — Admin Actions Tab                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function AdminActionsTab({
  user,
  onChangeRole,
  onFreezeUnfreeze,
  onVerify,
  onDelete,
  onManageRoles,
}: {
  user: AdminUser;
  onChangeRole: (newRole: string) => void;
  onFreezeUnfreeze: () => void;
  onVerify: () => void;
  onDelete: () => void;
  onManageRoles?: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Role Management */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Crown className="size-4 text-gold" />
          نقش و دسترسی کاربر
        </Label>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[10px] text-muted-foreground mb-2">نقش فعلی:</p>
          <RoleBadge role={user.role} />
        </div>
        <div className="flex gap-2">
          <Select
            defaultValue={user.role}
            onValueChange={(v) => {
              if (v !== user.role) onChangeRole(v);
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">کاربر عادی</SelectItem>
              <SelectItem value="admin">مدیر سیستم</SelectItem>
              <SelectItem value="super_admin">مدیر ارشد</SelectItem>
              <SelectItem value="support_admin">مدیر پشتیبانی</SelectItem>
              <SelectItem value="finance_admin">مدیر مالی</SelectItem>
              <SelectItem value="support_agent">اپراتور پشتیبانی</SelectItem>
              <SelectItem value="viewer">بازدیدکننده</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {onManageRoles && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-gold/20 text-gold hover:bg-gold/10 text-xs mt-1"
            onClick={onManageRoles}
          >
            <Shield className="size-3.5 ml-1.5" />
            مدیریت نقش‌های پیشرفته
          </Button>
        )}
      </div>

      <Separator />

      {/* Freeze/Unfreeze */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Snowflake className="size-4 text-blue-400" />
          وضعیت حساب
        </Label>
        <Button
          variant="outline"
          className={cn(
            'w-full',
            user.isFrozen
              ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
              : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
          )}
          onClick={onFreezeUnfreeze}
        >
          {user.isFrozen ? (
            <>
              <CheckCircle className="size-4 ml-1.5" />
              رفع یخ‌زدگی حساب
            </>
          ) : (
            <>
              <Snowflake className="size-4 ml-1.5" />
              یخ‌زدن حساب
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Verify Account */}
      {!user.isVerified && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <UserCheck className="size-4 text-emerald-400" />
            تایید حساب
          </Label>
          <Button
            variant="outline"
            className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            onClick={onVerify}
          >
            <CheckCircle className="size-4 ml-1.5" />
            تایید کردن حساب کاربری
          </Button>
        </div>
      )}

      {user.isVerified && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <UserCheck className="size-4 text-emerald-400" />
            وضعیت تایید
          </Label>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">
            ✅ حساب این کاربر قبلاً تایید شده است.
          </div>
        </div>
      )}

      <Separator />

      {/* Notification & Note */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Bell className="size-4 text-gold" />
          ارسال اعلان
        </Label>
        <div className="flex gap-2">
          <Input placeholder="متن اعلان..." className="flex-1 text-sm" />
          <Button size="sm" className="bg-gold text-white hover:bg-gold/90">
            <Bell className="size-4 ml-1" />
            ارسال
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="size-4 text-gold" />
          یادداشت ادمین
        </Label>
        <Textarea placeholder="یادداشت خود را بنویسید..." className="text-sm min-h-[60px]" />
        <Button size="sm" variant="outline" className="border-gold/20 text-gold hover:bg-gold/10">
          <Edit className="size-4 ml-1" />
          ذخیره یادداشت
        </Button>
      </div>

      <Separator />

      {/* Delete Account */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2 text-red-400">
          <Trash2 className="size-4" />
          حذف حساب کاربری
        </Label>
        <p className="text-[10px] text-muted-foreground">
          این عملیات غیرقابل بازگشت است و تمام اطلاعات کاربر حذف خواهد شد.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
              <Trash2 className="size-4 ml-1.5" />
              حذف حساب کاربری
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
              <AlertDialogDescription>
                حساب کاربری <strong>{user.fullName || user.phone}</strong> برای همیشه حذف خواهد شد. این عملیات غیرقابل بازگشت است.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                بله، حذف شود
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  User Detail Dialog                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function UserDetailDialog({
  user,
  open,
  onClose,
  goldPrice,
  onAction,
}: {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
  goldPrice: number;
  onAction: (userId: string, action: string, data?: Record<string, unknown>) => Promise<void>;
}) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          {/* Header: Avatar, name, badges */}
          <div className="flex items-center gap-4 pb-2">
            <UserAvatar user={user} size="lg" />
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg truncate">
                {user.fullName || 'بدون نام'}
              </DialogTitle>
              <DialogDescription className="text-sm font-mono mt-0.5" dir="ltr">
                {user.phone}
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <RoleBadge role={user.role} />
                <LevelBadge level={user.userLevel} />
                <StatusBadge user={user} />
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="account" dir="rtl" className="mt-2">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="account" className="text-[11px]">
              اطلاعات حساب
            </TabsTrigger>
            <TabsTrigger value="wallet" className="text-[11px]">
              کیف پول
            </TabsTrigger>
            <TabsTrigger value="kyc" className="text-[11px]">
              احراز هویت
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-[11px]">
              فعالیت‌ها
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-[11px]">
              عملیات ادمین
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[50vh] mt-3">
            <TabsContent value="account">
              <AccountInfoTab user={user} />
            </TabsContent>
            <TabsContent value="wallet">
              <WalletTab user={user} goldPrice={goldPrice} />
            </TabsContent>
            <TabsContent value="kyc">
              <KycTab
                user={user}
                onApproveKyc={() => onAction(user.id, 'verify')}
                onRejectKyc={() => onAction(user.id, 'verify', { approve: false })}
              />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityTab user={user} />
            </TabsContent>
            <TabsContent value="actions">
              <AdminActionsTab
                user={user}
                onChangeRole={(newRole) => onAction(user.id, 'role', { role: newRole })}
                onFreezeUnfreeze={() => onAction(user.id, user.isFrozen ? 'unfreeze' : 'freeze')}
                onVerify={() => onAction(user.id, 'verify')}
                onDelete={() => onAction(user.id, 'delete')}
                onManageRoles={() => onAction(user.id, 'manage-roles')}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Mobile User Card                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MobileUserCard({
  user,
  onView,
  onFreezeUnfreeze,
  goldPrice,
}: {
  user: AdminUser;
  onView: () => void;
  onFreezeUnfreeze: () => void;
  goldPrice: number;
}) {
  const goldGrams = user.goldWallet?.goldGrams ?? 0;
  const goldValue = goldGrams * goldPrice;

  return (
    <Card className="border-gold/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <UserAvatar user={user} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold truncate">{user.fullName || 'بدون نام'}</h4>
              <StatusBadge user={user} />
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5" dir="ltr">{user.phone}</p>
            {user.email && (
              <p className="text-[10px] text-muted-foreground truncate" dir="ltr">{user.email}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <RoleBadge role={user.role} />
          <LevelBadge level={user.userLevel} />
          {user.kyc && <KycBadge status={user.kyc.status || 'none'} />}
        </div>

        <Separator className="my-3" />

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="size-3" />
            <span>{user.lastLoginAt ? timeAgo(user.lastLoginAt) : 'هرگز'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-gold">
              <Wallet className="size-3" />
              <span>{(user.wallet?.balance ?? 0).toLocaleString('fa-IR')}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Gem className="size-3" />
              <span>{goldGrams.toLocaleString('fa-IR')}g</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={onView} className="flex-1 border-gold/20 text-gold hover:bg-gold/10 text-xs">
            <Eye className="size-3.5 ml-1" />
            مشاهده
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onFreezeUnfreeze}
            className={cn(
              'text-xs',
              user.isFrozen
                ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                : 'border-red-500/30 text-red-400 hover:bg-red-500/10'
            )}
          >
            {user.isFrozen ? (
              <CheckCircle className="size-3.5" />
            ) : (
              <Snowflake className="size-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Create User Dialog                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setPhone('');
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setIsVerified(false);
    setGeneratedPassword('');
    setShowPassword(false);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    // Validate
    if (!phone.trim()) {
      useAppStore.getState().addToast('شماره موبایل الزامی است', 'error');
      return;
    }
    const normalized = phone.replace(/^(\+98|0)/, '98').trim();
    if (!/^98\d{10}$/.test(normalized)) {
      useAppStore.getState().addToast('فرمت شماره نامعتبر (مثال: 09123456789)', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalized,
          fullName: fullName.trim() || undefined,
          email: email.trim() || undefined,
          password: password.trim() || undefined,
          role,
          isVerified,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        useAppStore.getState().addToast(data.message || 'کاربر با موفقیت ایجاد شد', 'success');
        if (data.user?.generatedPassword) {
          setGeneratedPassword(data.user.generatedPassword);
        }
        resetForm();
        onCreated();
        // Don't close dialog yet so user can see generated password
      } else {
        useAppStore.getState().addToast(data.message || 'خطا در ایجاد کاربر', 'error');
      }
    } catch {
      useAppStore.getState().addToast('خطا در ارتباط با سرور', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const roleItems = [
    { value: 'user', label: 'کاربر عادی', color: 'text-gray-400', bg: 'bg-gray-500/15' },
    { value: 'admin', label: 'مدیر سیستم', color: 'text-amber-400', bg: 'bg-amber-500/15' },
    { value: 'super_admin', label: 'مدیر ارشد', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    { value: 'support_admin', label: 'مدیر پشتیبانی', color: 'text-blue-400', bg: 'bg-blue-500/15' },
    { value: 'finance_admin', label: 'مدیر مالی', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { value: 'support_agent', label: 'اپراتور پشتیبانی', color: 'text-violet-400', bg: 'bg-violet-500/15' },
    { value: 'viewer', label: 'بازدیدکننده', color: 'text-gray-400', bg: 'bg-gray-500/15' },
  ];

  const selectedRole = roleItems.find((r) => r.value === role) || roleItems[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-xl p-2 bg-gold/15">
              <UserPlus className="size-5 text-gold" />
            </div>
            ایجاد کاربر جدید
          </DialogTitle>
          <DialogDescription>
            یک کاربر جدید با نقش مدیری یا عادی بسازید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Phone */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              شماره موبایل <span className="text-red-400">*</span>
            </Label>
            <Input
              placeholder="09123456789"
              dir="ltr"
              className="text-left font-mono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">نام و نام خانوادگی</Label>
            <Input
              placeholder="نام کامل کاربر"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">ایمیل (اختیاری)</Label>
            <Input
              placeholder="user@example.com"
              dir="ltr"
              type="email"
              className="text-left"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Key className="size-3.5" />
              رمز عبور
              {!password.trim() && (
                <span className="text-[10px] text-muted-foreground font-normal">(خالی = خودکار ساخته میشه)</span>
              )}
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="حداقل ۶ کاراکتر"
                dir="ltr"
                className="text-left pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                {showPassword ? ' مخفی' : ' نمایش'}
              </button>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Crown className="size-4 text-gold" />
              نقش کاربر
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {roleItems.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all',
                    role === r.value
                      ? `${r.bg} ${r.color} border-current`
                      : 'border-border/50 hover:border-border text-muted-foreground hover:bg-muted/30'
                  )}
                >
                  {r.value === 'super_admin' && <Crown className="size-3.5" />}
                  {r.value === 'admin' && <Shield className="size-3.5" />}
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verify Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
            <div>
              <p className="text-sm font-medium">تایید شده</p>
              <p className="text-[10px] text-muted-foreground">حساب کاربر از ابتدا تایید شده باشد</p>
            </div>
            <button
              type="button"
              onClick={() => setIsVerified(!isVerified)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                isVerified ? 'bg-gold' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform shadow-sm',
                  isVerified && 'translate-x-5'
                )}
              />
            </button>
          </div>

          {/* Generated Password Notice */}
          {generatedPassword && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1.5">
                <Key className="size-3.5" />
                رمز عبور خودکار ساخته شده:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-black/20 p-2 rounded text-amber-300" dir="ltr">
                  {generatedPassword}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20 h-9 px-2"
                  onClick={handleCopyPassword}
                >
                  {copied ? <CheckCircle className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-amber-400/70 mt-1.5">
                ⚠️ این رمز فقط یکبار نمایش داده میشه، حتماً کپی کنید!
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            انصراف
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !phone.trim()}
            className={cn(
              'flex-1 bg-gold text-white hover:bg-gold/90',
              loading && 'opacity-70 cursor-not-allowed'
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                در حال ایجاد...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="size-4" />
                ایجاد کاربر
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component: AdminUsers                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [goldPrice, setGoldPrice] = useState(35000000);
  const [createOpen, setCreateOpen] = useState(false);
  const perPage = 15;

  /* ── Fetch users ── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.users || [];
        setUsers(list);
      }
    } catch {
      /* ignore network errors */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ── Fetch gold price ── */
  useEffect(() => {
    const fetchGoldPrice = async () => {
      try {
        const res = await fetch('/api/gold-price');
        if (res.ok) {
          const data = await res.json();
          if (data?.sellPrice) setGoldPrice(data.sellPrice);
        }
      } catch {
        /* ignore */
      }
    };
    fetchGoldPrice();
  }, []);

  /* ── Compute stats ── */
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive && !u.isFrozen).length;
    const verified = users.filter((u) => u.isVerified).length;
    const frozen = users.filter((u) => u.isFrozen).length;
    const admins = users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length;
    const diamond = users.filter((u) => u.userLevel === 'diamond').length;
    return { total, active, verified, frozen, admins, diamond };
  }, [users]);

  /* ── Filter & Sort ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return users.filter((u) => {
      /* Search */
      const matchSearch =
        !q ||
        (u.fullName || '').toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email || '').toLowerCase().includes(q);

      /* Role */
      const matchRole = roleFilter === 'all' || u.role === roleFilter;

      /* Level */
      const matchLevel = levelFilter === 'all' || u.userLevel === levelFilter;

      /* Status */
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive && !u.isFrozen) ||
        (statusFilter === 'frozen' && u.isFrozen) ||
        (statusFilter === 'unverified' && !u.isVerified);

      /* KYC */
      const matchKyc =
        kycFilter === 'all' ||
        (kycFilter === 'approved' && u.kyc?.status === 'approved') ||
        (kycFilter === 'pending' && u.kyc?.status === 'pending') ||
        (kycFilter === 'none' && (!u.kyc || u.kyc.status === 'none'));

      return matchSearch && matchRole && matchLevel && matchStatus && matchKyc;
    });
  }, [users, search, roleFilter, levelFilter, statusFilter, kycFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case 'newest':
        return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'lastLogin':
        return arr.sort((a, b) => {
          const aTime = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          const bTime = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          return bTime - aTime;
        });
      case 'balance':
        return arr.sort((a, b) => {
          const aTotal = (a.wallet?.balance ?? 0) + ((a.goldWallet?.goldGrams ?? 0) * goldPrice);
          const bTotal = (b.wallet?.balance ?? 0) + ((b.goldWallet?.goldGrams ?? 0) * goldPrice);
          return bTotal - aTotal;
        });
      default:
        return arr;
    }
  }, [filtered, sortBy, goldPrice]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  /* ── Reset page on filter change ── */
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
    setter(value);
    setPage(1);
  };

  /* ── Admin action handler ── */
  const handleAction = useCallback(
    async (userId: string, action: string, data?: Record<string, unknown>) => {
      try {
        const body: Record<string, unknown> = { action };
        if (data) Object.assign(body, data);

        const res = await fetch(`/api/admin/users/${userId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          useAppStore.getState().addToast('عملیات با موفقیت انجام شد', 'success');
          await fetchUsers();
          setDetailOpen(false);
          setDetailUser(null);
        } else {
          const errData = await res.json().catch(() => ({}));
          useAppStore
            .getState()
            .addToast((errData as Record<string, string>)?.message || 'خطا در انجام عملیات', 'error');
        }
      } catch {
        useAppStore.getState().addToast('خطا در ارتباط با سرور', 'error');
      }
    },
    [fetchUsers]
  );

  /* ── Export CSV ── */
  const handleExportCSV = useCallback(() => {
    const BOM = '\uFEFF';
    const headers = ['نام', 'تلفن', 'ایمیل', 'نقش', 'سطح', 'وضعیت', 'احراز هویت', 'موجودی', 'طلای فعال', 'تاریخ عضویت'];
    const rows = sorted.map((u) => [
      u.fullName || 'بدون نام',
      u.phone,
      u.email || '-',
      ROLE_CONFIG[u.role]?.label || 'کاربر عادی',
      LEVEL_CONFIG[u.userLevel]?.label || 'بدون سطح',
      u.isFrozen ? 'یخ‌زده' : u.isActive ? 'فعال' : 'غیرفعال',
      u.isVerified ? 'تایید شده' : 'تایید نشده',
      (u.wallet?.balance ?? 0).toString(),
      (u.goldWallet?.goldGrams ?? 0).toString(),
      u.createdAt,
    ]);
    const csv = BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    useAppStore.getState().addToast('فایل CSV با موفقیت دانلود شد', 'success');
  }, [sorted]);

  /* ── View user detail ── */
  const handleViewUser = useCallback((user: AdminUser) => {
    setDetailUser(user);
    setDetailOpen(true);
  }, []);

  /* ── Quick freeze/unfreeze ── */
  const handleQuickFreeze = useCallback(
    async (user: AdminUser) => {
      const action = user.isFrozen ? 'unfreeze' : 'freeze';
      await handleAction(user.id, action);
    },
    [handleAction]
  );

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-gold/10">
            <Users className="size-6 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold">مدیریت کاربران</h2>
            <p className="text-xs text-muted-foreground">
              مشاهده و مدیریت تمامی کاربران پلتفرم
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="bg-gold text-white hover:bg-gold/90"
          >
            <UserPlus className="size-4 ml-1.5" />
            افزودن کاربر
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-gold/20 text-gold hover:bg-gold/10"
          >
            <Download className="size-4 ml-1.5" />
            خروجی CSV
          </Button>
        </div>

      {/* ── Stats Dashboard Row (6 cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="کل کاربران"
          value={stats.total}
          icon={Users}
          colorClass="text-white"
          bgClass="bg-white/10"
        />
        <StatCard
          title="کاربران فعال"
          value={stats.active}
          icon={CheckCircle}
          colorClass="text-emerald-400"
          bgClass="bg-emerald-500/10"
          borderClass="border-emerald-500/20"
        />
        <StatCard
          title="تایید شده"
          value={stats.verified}
          icon={Shield}
          colorClass="text-blue-400"
          bgClass="bg-blue-500/10"
          borderClass="border-blue-500/20"
        />
        <StatCard
          title="یخ‌زده"
          value={stats.frozen}
          icon={Snowflake}
          colorClass="text-red-400"
          bgClass="bg-red-500/10"
          borderClass="border-red-500/20"
        />
        <StatCard
          title="ادمین‌ها"
          value={stats.admins}
          icon={Crown}
          colorClass="text-amber-400"
          bgClass="bg-amber-500/10"
          borderClass="border-amber-500/20"
        />
        <StatCard
          title="سطح الماس"
          value={stats.diamond}
          icon={Gem}
          colorClass="text-violet-400"
          bgClass="bg-violet-500/10"
          borderClass="border-violet-500/20"
        />
      </div>

      {/* ── Advanced Search & Filters ── */}
      <Card className="glass-gold border-gold/10">
        <CardContent className="p-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="جستجوی نام، شماره تلفن یا ایمیل..."
                className="pr-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-gold hidden sm:block" />
              <span className="text-xs text-gold hidden sm:block">فیلترها:</span>
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3">
            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={handleFilterChange(setRoleFilter)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="نقش" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه نقش‌ها</SelectItem>
                <SelectItem value="user">کاربر عادی</SelectItem>
                <SelectItem value="admin">مدیر</SelectItem>
                <SelectItem value="super_admin">مدیر ارشد</SelectItem>
              </SelectContent>
            </Select>

            {/* Level Filter */}
            <Select value={levelFilter} onValueChange={handleFilterChange(setLevelFilter)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="سطح" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه سطوح</SelectItem>
                <SelectItem value="bronze">برنز</SelectItem>
                <SelectItem value="silver">نقره</SelectItem>
                <SelectItem value="gold">طلا</SelectItem>
                <SelectItem value="diamond">الماس</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="frozen">یخ‌زده</SelectItem>
                <SelectItem value="unverified">تایید نشده</SelectItem>
              </SelectContent>
            </Select>

            {/* KYC Filter */}
            <Select value={kycFilter} onValueChange={handleFilterChange(setKycFilter)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="احراز هویت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="approved">تایید شده</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="none">بدون درخواست</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="مرتب‌سازی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">جدیدترین</SelectItem>
                <SelectItem value="oldest">قدیمی‌ترین</SelectItem>
                <SelectItem value="lastLogin">آخرین ورود</SelectItem>
                <SelectItem value="balance">موجودی</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Counter */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              <span className="text-gold font-semibold">{sorted.length.toLocaleString('fa-IR')}</span> کاربر
              یافت شد
              {sorted.length !== users.length && (
                <span className="text-muted-foreground">
                  {' '}
                  از {users.length.toLocaleString('fa-IR')} کاربر
                </span>
              )}
            </p>
            {(search || roleFilter !== 'all' || levelFilter !== 'all' || statusFilter !== 'all' || kycFilter !== 'all') && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-gold"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                  setLevelFilter('all');
                  setStatusFilter('all');
                  setKycFilter('all');
                  setPage(1);
                }}
              >
                <XCircle className="size-3 ml-1" />
                پاک کردن فیلترها
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── User Table (Desktop) / Cards (Mobile) ── */}
      {loading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      ) : paginated.length === 0 ? (
        <Card className="border-gold/10">
          <CardContent className="py-16 text-center">
            <Users className="size-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">کاربری با این فیلترها یافت نشد</p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 text-gold text-xs"
              onClick={() => {
                setSearch('');
                setRoleFilter('all');
                setLevelFilter('all');
                setStatusFilter('all');
                setKycFilter('all');
                setPage(1);
              }}
            >
              نمایش همه کاربران
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden lg:block border-gold/10">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-gold/5">
                      <TableHead className="text-xs">کاربر</TableHead>
                      <TableHead className="text-xs">تلفن</TableHead>
                      <TableHead className="text-xs">ایمیل</TableHead>
                      <TableHead className="text-xs">نقش</TableHead>
                      <TableHead className="text-xs">سطح</TableHead>
                      <TableHead className="text-xs">احراز</TableHead>
                      <TableHead className="text-xs">وضعیت</TableHead>
                      <TableHead className="text-xs">آخرین ورود</TableHead>
                      <TableHead className="text-xs text-left">موجودی</TableHead>
                      <TableHead className="text-xs text-center">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((u) => {
                      const goldGrams = u.goldWallet?.goldGrams ?? 0;
                      return (
                        <TableRow key={u.id} className="hover:bg-gold/5 transition-colors">
                          {/* User */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <UserAvatar user={u} size="sm" />
                              <span className="text-sm font-medium truncate max-w-[120px]">
                                {u.fullName || 'بدون نام'}
                              </span>
                            </div>
                          </TableCell>
                          {/* Phone */}
                          <TableCell>
                            <span className="text-xs font-mono" dir="ltr">{u.phone}</span>
                          </TableCell>
                          {/* Email */}
                          <TableCell>
                            <span className="text-xs truncate max-w-[120px] block" dir="ltr">
                              {u.email || '-'}
                            </span>
                          </TableCell>
                          {/* Role */}
                          <TableCell>
                            <RoleBadge role={u.role} />
                          </TableCell>
                          {/* Level */}
                          <TableCell>
                            <LevelBadge level={u.userLevel} />
                          </TableCell>
                          {/* KYC */}
                          <TableCell>
                            <KycBadge status={u.kyc?.status || 'none'} />
                          </TableCell>
                          {/* Status */}
                          <TableCell>
                            <StatusBadge user={u} />
                          </TableCell>
                          {/* Last Login */}
                          <TableCell>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'هرگز'}
                            </span>
                          </TableCell>
                          {/* Wallet */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Wallet className="size-3 text-gold" />
                                <span className="text-xs text-gold">
                                  {(u.wallet?.balance ?? 0).toLocaleString('fa-IR')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Gem className="size-3 text-yellow-400" />
                                <span className="text-xs text-yellow-400">
                                  {goldGrams.toLocaleString('fa-IR')}g
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          {/* Actions */}
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 text-gold hover:text-gold/80 hover:bg-gold/10"
                                onClick={() => handleViewUser(u)}
                                title="مشاهده جزئیات"
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className={cn(
                                  'size-7',
                                  u.isFrozen
                                    ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                                    : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                                )}
                                onClick={() => handleQuickFreeze(u)}
                                title={u.isFrozen ? 'رفع یخ‌زدگی' : 'یخ‌زدن'}
                              >
                                {u.isFrozen ? (
                                  <CheckCircle className="size-3.5" />
                                ) : (
                                  <Snowflake className="size-3.5" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {paginated.map((u) => (
              <MobileUserCard
                key={u.id}
                user={u}
                onView={() => handleViewUser(u)}
                onFreezeUnfreeze={() => handleQuickFreeze(u)}
                goldPrice={goldPrice}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border-gold/20 text-gold hover:bg-gold/10"
          >
            <ChevronRight className="size-4 ml-1" />
            قبلی
          </Button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={page === pageNum ? 'default' : 'outline'}
                  className={cn(
                    'size-8 p-0 text-xs',
                    page === pageNum
                      ? 'bg-gold text-white hover:bg-gold/90'
                      : 'border-gold/20 text-muted-foreground hover:text-gold hover:bg-gold/10'
                  )}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum.toLocaleString('fa-IR')}
                </Button>
              );
            })}
          </div>

          <span className="text-xs text-muted-foreground">
            {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border-gold/20 text-gold hover:bg-gold/10"
          >
            بعدی
            <ChevronLeft className="size-4 mr-1" />
          </Button>
        </div>
      )}

      {/* ── User Detail Dialog ── */}
      <UserDetailDialog
        user={detailUser!}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailUser(null);
        }}
        goldPrice={goldPrice}
        onAction={handleAction}
      />
    </div>
  );
}
