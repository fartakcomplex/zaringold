'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { formatNumber, formatGrams, getTimeAgo } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Wallet,
  Gem,
  Copy,
  Share2,
  Gift,
  Trophy,
  Lock,
  Eye,
  EyeOff,
  Check,
  Edit,
  Camera,
  MapPin,
  Calendar,
  Key,
  Clock,
  LogOut,
  Crown,
  Link,
  Smartphone,
  Monitor,
  CircleDot,
  AlertTriangle,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface ProfileData {
  fullName: string;
  email: string;
  nationalId: string;
  birthDate: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  iban: string;
}

interface WalletData {
  balance: number;
  frozenBalance: number;
}

interface GoldWalletData {
  goldGrams: number;
  frozenGold: number;
  valueEstimate: number;
}

interface GoldCardData {
  cardNumber: string;
  status: string;
  dailyLimit: number;
  monthlyLimit: number;
}

interface LevelData {
  currentLevel: string;
  xp: number;
}

interface SessionData {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

/* ================================================================== */
/*  Configuration                                                      */
/* ================================================================== */

const LEVEL_CONFIG: Record<string, {
  label: string;
  emoji: string;
  color: string;
  next: string;
  minXp: number;
}> = {
  none:    { label: 'بدون سطح', emoji: '⚪', color: 'text-gray-400',    next: 'bronze',  minXp: 0 },
  bronze:  { label: 'برنز',     emoji: '🥉', color: 'text-orange-400',  next: 'silver',  minXp: 100 },
  silver:  { label: 'نقره',     emoji: '🥈', color: 'text-gray-300',    next: 'gold',    minXp: 500 },
  gold:    { label: 'طلا',      emoji: '🥇', color: 'text-yellow-400',  next: 'diamond', minXp: 2000 },
  diamond: { label: 'الماس',    emoji: '💎', color: 'text-violet-400',  next: 'diamond', minXp: 10000 },
};

const LEVEL_FEATURES: Array<{
  level: string;
  key: string;
  label: string;
}> = [
  { level: 'bronze',  key: 'trade',      label: 'خرید و فروش طلا' },
  { level: 'bronze',  key: 'wallet',     label: 'کیف پول' },
  { level: 'bronze',  key: 'charts',     label: 'نمودارها' },
  { level: 'bronze',  key: 'alerts',     label: 'هشدار قیمت' },
  { level: 'silver',  key: 'transfer',   label: 'انتقال طلا' },
  { level: 'silver',  key: 'goldCard',   label: 'کارت طلایی' },
  { level: 'silver',  key: 'savings',    label: 'پس‌انداز' },
  { level: 'silver',  key: 'loans',      label: 'وام طلایی' },
  { level: 'gold',    key: 'autoTrade',  label: 'معامله خودکار' },
  { level: 'gold',    key: 'aiCoach',    label: 'مربی هوشمند' },
  { level: 'gold',    key: 'family',     label: 'کیف خانوادگی' },
  { level: 'diamond', key: 'zeroFee',    label: 'کارمزد صفر' },
  { level: 'diamond', key: 'vipSupport', label: 'پشتیبانی VIP' },
  { level: 'diamond', key: 'earlyAccess',label: 'دسترسی زودهنگام' },
];

const LEVEL_ORDER = ['none', 'bronze', 'silver', 'gold', 'diamond'];

const ROLE_LABELS: Record<string, string> = {
  user: 'کاربر عادی',
  admin: 'مدیر سیستم',
  vip: 'کاربر ویژه',
};

const MOCK_SESSIONS: SessionData[] = [
  {
    id: 's1',
    device: 'Chrome — مرورگر فعلی',
    ip: '۱۷۸.xxx.xxx.xxx',
    lastActive: new Date().toISOString(),
    isCurrent: true,
  },
  {
    id: 's2',
    device: 'Safari — iPhone 15',
    ip: '۵.xxx.xxx.xxx',
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    isCurrent: false,
  },
  {
    id: 's3',
    device: 'Firefox — Windows',
    ip: '۱۸۵.xxx.xxx.xxx',
    lastActive: new Date(Date.now() - 86400000).toISOString(),
    isCurrent: false,
  },
];

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function getInitials(name: string): string {
  if (!name || !name.trim()) return 'ک';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
  }
  return parts[0].charAt(0);
}

function maskCardNumber(num: string): string {
  if (!num || num.length < 8) return '---- ---- ---- ----';
  const last = num.slice(-4);
  return `•••• •••• •••• ${last}`;
}

function isLevelUnlocked(userLevel: string, featureLevel: string): boolean {
  const userIdx = LEVEL_ORDER.indexOf(userLevel);
  const featureIdx = LEVEL_ORDER.indexOf(featureLevel);
  return userIdx >= featureIdx;
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function ProfileView() {
  const { user, addToast } = useAppStore();
  const { t, locale } = useTranslation();

  /* ── Tab & UI state ── */
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  /* ── Profile form ── */
  const [profile, setProfile] = useState<ProfileData>({
    fullName: '',
    email: '',
    nationalId: '',
    birthDate: '',
    province: '',
    city: '',
    address: '',
    postalCode: '',
    iban: '',
  });
  const [originalProfile, setOriginalProfile] = useState<ProfileData>(profile);

  /* ── API data ── */
  const [fiatWallet, setFiatWallet] = useState<WalletData>({ balance: 0, frozenBalance: 0 });
  const [goldWallet, setGoldWallet] = useState<GoldWalletData>({
    goldGrams: 0,
    frozenGold: 0,
    valueEstimate: 0,
  });
  const [goldCard, setGoldCard] = useState<GoldCardData | null>(null);
  const [levelData, setLevelData] = useState<LevelData>({ currentLevel: 'none', xp: 0 });
  const [memberSince, setMemberSince] = useState('');
  const [sessions] = useState<SessionData[]>(MOCK_SESSIONS);

  /* ── Security state ── */
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  /* ── Referral state ── */
  const [referralStats, setReferralStats] = useState({
    totalInvited: 0,
    earnedRewards: 0,
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Data Fetching                                                    */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const fetchAllData = async () => {
      try {
        const endpoints = [
          { url: `/api/profile?userId=${user.id}`, key: 'profile' },
          { url: '/api/wallet', key: 'wallet' },
          { url: '/api/gold-card', key: 'goldcard' },
          { url: `/api/level?userId=${user.id}`, key: 'level' },
        ];

        const responses = await Promise.all(
          endpoints.map((e) => fetch(e.url).then((r) => ({ ...e, res: r })))
        );

        for (const { key, res } of responses) {
          if (cancelled) return;
          if (!res.ok) continue;
          const data = await res.json();

          if (key === 'profile' && data.user) {
            const u = data.user;
            const p = data.profile || {};
            const updated = {
              fullName: u.fullName || profile.fullName,
              email: u.email || profile.email,
              nationalId: p.nationalId || '',
              birthDate: p.birthDate || '',
              province: p.province || '',
              city: p.city || '',
              address: p.address || '',
              postalCode: p.postalCode || '',
              iban: p.iban || '',
            };
            setProfile(updated);
            setOriginalProfile(updated);
            if (u.createdAt) setMemberSince(u.createdAt);
          }

          if (key === 'wallet') {
            if (data.fiat) setFiatWallet(data.fiat);
            if (data.gold) setGoldWallet(data.gold);
          }

          if (key === 'goldcard' && data.card) {
            setGoldCard(data.card);
          }

          if (key === 'level' && data.level) {
            setLevelData(data.level);
          }
        }
      } catch {
        /* silent */
      }
      if (!cancelled) setLoading(false);
    };

    fetchAllData();
    return () => { cancelled = true; };
  }, [user?.id]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */
  const handleCopyText = (text: string, field: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedField(field);
        addToast('کپی شد', 'success');
        setTimeout(() => setCopiedField(null), 2000);
      })
      .catch(() => addToast('خطا در کپی کردن', 'error'));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, ...profile }),
      });
      if (res.ok) {
        addToast('اطلاعات پروفایل با موفقیت ذخیره شد', 'success');
        setOriginalProfile({ ...profile });
        setIsEditing(false);
      } else {
        addToast('خطا در ذخیره اطلاعات', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setProfile({ ...originalProfile });
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('لطفاً تمام فیلدها را پر کنید', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('رمز عبور جدید باید حداقل ۸ کاراکتر باشد', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('رمز عبور جدید و تأیید آن مطابقت ندارند', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword,
          newPassword,
        }),
      });
      if (res.ok) {
        addToast('رمز عبور با موفقیت تغییر کرد', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        addToast('خطا در تغییر رمز عبور', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setChangingPassword(false);
  };

  const handleShareTelegram = () => {
    const link = `https://zarringold.ir/ref/${user?.referralCode || ''}`;
    const text = `🌟 با زرین گلد ثبت‌نام کنید و جایزه بگیرید!\n${link}`;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const handleShareWhatsApp = () => {
    const link = `https://zarringold.ir/ref/${user?.referralCode || ''}`;
    const text = `🌟 با زرین گلد ثبت‌نام کنید و جایزه بگیرید!\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  /* ── Level computation ── */
  const currentLevelKey = levelData.currentLevel || 'none';
  const currentCfg = LEVEL_CONFIG[currentLevelKey] || LEVEL_CONFIG.none;
  const nextCfg = LEVEL_CONFIG[currentCfg.next];
  const isMaxLevel = !nextCfg || currentCfg.next === currentLevelKey;

  const xpRange = nextCfg ? nextCfg.minXp - currentCfg.minXp : 1;
  const xpProgress = isMaxLevel
    ? 100
    : Math.min(((levelData.xp - currentCfg.minXp) / xpRange) * 100, 100);

  /* ── Referral link ── */
  const referralLink = user?.referralCode
    ? `https://zarringold.ir/ref/${user.referralCode}`
    : '';

  /* ── Shared classes ── */
  const inputClass =
    'focus:border-gold/50 focus:ring-gold/20 transition-colors';

  /* ================================================================== */
  /*  Loading Skeleton                                                 */
  /* ================================================================== */
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-56 w-full rounded-xl bg-muted animate-pulse" />
        <div className="h-64 w-full rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  /* ================================================================== */
  /*  Render                                                           */
  /* ================================================================== */
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-24">
      {/* ─── Page Title ─── */}
      <h1 className="text-2xl font-bold text-gold flex items-center gap-2">
        <User className="size-6" />
        {locale === 'en' ? 'User Profile' : 'پروفایل کاربری'}
      </h1>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Header Card                                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Card className="border-gold/10 overflow-hidden">
        {/* Gold gradient banner */}
        <div className="h-28 bg-gradient-to-l from-gold/20 via-gold/10 to-transparent" />

        <CardContent className="-mt-14 relative p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
            {/* Avatar — 100px */}
            <div className="relative group cursor-pointer">
              <Avatar className="size-[100px] border-4 border-gold/30 shadow-lg shadow-gold/10">
                {user?.avatar && (
                  <AvatarImage src={user.avatar} alt={profile.fullName} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-gold to-gold/70 text-white text-2xl font-bold">
                  {getInitials(profile.fullName || user?.phone || '')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="size-6 text-white" />
              </div>
            </div>

            {/* User info */}
            <div className="text-center sm:text-right space-y-2 flex-1">
              {/* Full name */}
              <h2 className="text-xl sm:text-2xl font-bold text-gold">
                {profile.fullName || user?.fullName || 'کاربر زرین گلد'}
              </h2>

              {/* Phone with verified badge */}
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Phone className="size-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground" dir="ltr">
                  {user?.phone || '---'}
                </span>
                {user?.isVerified && (
                  <ShieldCheck className="size-4 text-emerald-500" />
                )}
              </div>

              {/* Email with edit icon */}
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Mail className="size-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground" dir="ltr">
                  {profile.email || '---'}
                </span>
                <Edit className="size-3 text-muted-foreground cursor-pointer hover:text-gold transition-colors" />
              </div>

              {/* Row: Role badge + Level badge + member since */}
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <Badge
                  variant="outline"
                  className="border-gold/30 text-gold bg-gold/5"
                >
                  <Crown className="size-3 ml-1" />
                  {ROLE_LABELS[user?.role || 'user']}
                </Badge>
                <Badge className="bg-gold/10 text-gold border-gold/20 hover:bg-gold/20">
                  {currentCfg.emoji} {currentCfg.label}
                </Badge>
                {memberSince && (
                  <span className="text-xs text-muted-foreground">
                    عضو از{' '}
                    {new Intl.DateTimeFormat('fa-IR', {
                      year: 'numeric',
                      month: 'long',
                    }).format(new Date(memberSince))}
                  </span>
                )}
              </div>

              {/* Referral code with copy */}
              {user?.referralCode && (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-xs text-muted-foreground">کد دعوت:</span>
                  <code className="text-xs font-mono bg-gold/10 text-gold px-2 py-0.5 rounded">
                    {user.referralCode}
                  </code>
                  <button
                    onClick={() => handleCopyText(user.referralCode!, 'header')}
                    className="text-muted-foreground hover:text-gold transition-colors"
                  >
                    {copiedField === 'header' ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Tabs                                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Tabs
        defaultValue="personal"
        value={activeTab}
        onValueChange={setActiveTab}
        dir="rtl"
        className="space-y-6"
      >
        <TabsList className="bg-muted/50 w-full grid grid-cols-5 overflow-x-auto">
          {[
            { value: 'personal', label: 'اطلاعات شخصی' },
            { value: 'wallet', label: 'کیف پول و طلا' },
            { value: 'security', label: 'امنیت' },
            { value: 'level', label: 'سطح و دسترسی‌ها' },
            { value: 'referral', label: 'دعوت دوستان' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs sm:text-sm data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  Tab 1 — اطلاعات شخصی                                  */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="personal">
          <Card className="border-gold/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gold">
                <User className="size-5" />
                اطلاعات شخصی
              </CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  <Edit className="size-4 ml-1" />
                  ویرایش
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-5 p-4 md:p-6">
              {/* Full name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">نام و نام خانوادگی</Label>
                  {isEditing ? (
                    <Input
                      value={profile.fullName}
                      onChange={(e) =>
                        setProfile({ ...profile, fullName: e.target.value })
                      }
                      placeholder="نام کامل خود را وارد کنید"
                      className={inputClass}
                    />
                  ) : (
                    <p className="text-sm p-2.5 rounded-md bg-muted/30 min-h-[38px]">
                      {profile.fullName || '---'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm">ایمیل</Label>
                  {isEditing ? (
                    <Input
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      placeholder="example@email.com"
                      dir="ltr"
                      className={`text-left ${inputClass}`}
                    />
                  ) : (
                    <p className="text-sm p-2.5 rounded-md bg-muted/30 min-h-[38px]" dir="ltr">
                      {profile.email || '---'}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone + National ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Phone className="size-3.5" />
                    شماره موبایل
                  </Label>
                  <div className="relative">
                    <Input
                      value={user?.phone || ''}
                      disabled
                      className="bg-muted/50 text-left"
                      dir="ltr"
                    />
                    {user?.isVerified && (
                      <Badge className="absolute left-2 top-1/2 -translate-y-1/2 bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5">
                        <Check className="size-2.5 ml-0.5" />
                        تأیید شده
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    شماره موبایل قابل تغییر نیست
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">کد ملی</Label>
                  {isEditing ? (
                    <Input
                      value={profile.nationalId}
                      onChange={(e) =>
                        setProfile({ ...profile, nationalId: e.target.value })
                      }
                      placeholder="کد ملی ۱۰ رقمی"
                      maxLength={10}
                      dir="ltr"
                      className={`text-left ${inputClass}`}
                    />
                  ) : (
                    <p className="text-sm p-2.5 rounded-md bg-muted/30 min-h-[38px]" dir="ltr">
                      {profile.nationalId || '---'}
                    </p>
                  )}
                </div>
              </div>

              {/* Birth date + Postal code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Calendar className="size-3.5" />
                    تاریخ تولد
                  </Label>
                  {isEditing ? (
                    <Input
                      value={profile.birthDate}
                      onChange={(e) =>
                        setProfile({ ...profile, birthDate: e.target.value })
                      }
                      placeholder="۱۳۶۰/۰۱/۰۱"
                      dir="ltr"
                      className={`text-left ${inputClass}`}
                    />
                  ) : (
                    <p className="text-sm p-2.5 rounded-md bg-muted/30 min-h-[38px]">
                      {profile.birthDate || '---'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">کد پستی</Label>
                  {isEditing ? (
                    <Input
                      value={profile.postalCode}
                      onChange={(e) =>
                        setProfile({ ...profile, postalCode: e.target.value })
                      }
                      placeholder="کد پستی ۱۰ رقمی"
                      maxLength={10}
                      dir="ltr"
                      className={`text-left ${inputClass}`}
                    />
                  ) : (
                    <p className="text-sm p-2.5 rounded-md bg-muted/30 min-h-[38px]" dir="ltr">
                      {profile.postalCode || '---'}
                    </p>
                  )}
                </div>
              </div>

              {/* Province + City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <MapPin className="size-3.5" />
                    استان
                  </Label>
                  {isEditing ? (
                    <Input
                      value={profile.province}
                      onChange={(e) =>
                        setProfile({ ...profile, province: e.target.value })
                      }
                      placeholder="نام استان"
                      className={inputClass}
                    />
                  ) : (
                    <p className="text-sm p-2.5 rounded-md bg-muted/30 min-h-[38px]">
                      {profile.province || '---'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">شهر</Label>
                  {isEditing ? (
                    <Input
                      value={profile.city}
                      onChange={(e) =>
                        setProfile({ ...profile, city: e.target.value })
                      }
                      placeholder="نام شهر"
                      className={inputClass}
                    />
                  ) : (
                    <p className="text-sm p-2.5 rounded-md bg-muted/30 min-h-[38px]">
                      {profile.city || '---'}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label className="text-sm">آدرس کامل</Label>
                {isEditing ? (
                  <Textarea
                    value={profile.address}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    placeholder="آدرس کامل پستی خود را وارد کنید"
                    rows={3}
                    className={inputClass}
                  />
                ) : (
                  <p className="text-sm p-2.5 rounded-md bg-muted/30 min-h-[80px]">
                    {profile.address || '---'}
                  </p>
                )}
              </div>

              <Separator className="bg-gold/10" />

              {/* Save / Cancel */}
              {isEditing && (
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-muted-foreground/20"
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-gold text-white hover:bg-gold/90 min-w-[140px]"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        در حال ذخیره...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="size-4" />
                        ذخیره تغییرات
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  Tab 2 — کیف پول و طلا                                  */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="wallet">
          <div className="space-y-4">
            {/* Fiat Wallet Card */}
            <Card className="border-gold/10 overflow-hidden">
              <div className="h-2 bg-gradient-to-l from-gold to-gold/60" />
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="size-10 rounded-xl bg-gold/10 flex items-center justify-center">
                    <Wallet className="size-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-bold">کیف پول ریالی</h3>
                    <p className="text-xs text-muted-foreground">موجودی نقدی شما</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">موجودی کل</p>
                    <p className="text-base sm:text-lg font-bold text-gold">
                      {formatNumber(fiatWallet.balance + fiatWallet.frozenBalance)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">تومان</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">موجودی آزاد</p>
                    <p className="text-base sm:text-lg font-bold">
                      {formatNumber(fiatWallet.balance)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">تومان</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">موجودی مسدود</p>
                    <p className="text-base sm:text-lg font-bold text-orange-400">
                      {formatNumber(fiatWallet.frozenBalance)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">تومان</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gold Wallet Card */}
            <Card className="border-gold/10 overflow-hidden">
              <div className="h-2 bg-gradient-to-l from-amber-400 to-yellow-600" />
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Gem className="size-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold">کیف پول طلایی</h3>
                    <p className="text-xs text-muted-foreground">طلای ذخیره‌شده شما</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 rounded-lg bg-amber-500/5">
                    <p className="text-xs text-muted-foreground mb-1">موجودی طلا</p>
                    <p className="text-base sm:text-lg font-bold text-amber-500">
                      {formatGrams(goldWallet.goldGrams)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">گرم</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-lg bg-amber-500/5">
                    <p className="text-xs text-muted-foreground mb-1">طلا در انتظار</p>
                    <p className="text-base sm:text-lg font-bold text-orange-400">
                      {formatGrams(goldWallet.frozenGold)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">گرم</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-lg bg-amber-500/5">
                    <p className="text-xs text-muted-foreground mb-1">ارزش تخمینی</p>
                    <p className="text-base sm:text-lg font-bold text-emerald-500">
                      {formatNumber(goldWallet.valueEstimate)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">تومان</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gold Card */}
            {goldCard && (
              <Card className="border-gold/10">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                      <Crown className="size-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold">کارت طلایی زرین گلد</h3>
                      <p className="text-xs text-muted-foreground">کارت هدیه طلا</p>
                    </div>
                    <Badge
                      className={cn(
                        'mr-auto',
                        goldCard.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {goldCard.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </div>
                  <div className="rounded-xl bg-gradient-to-l from-gold/10 via-gold/5 to-amber-500/5 border border-gold/15 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">شماره کارت</span>
                      <span className="font-mono text-sm tracking-wider" dir="ltr">
                        {maskCardNumber(goldCard.cardNumber)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">سقف روزانه</span>
                      <span className="text-sm font-medium">
                        {formatNumber(goldCard.dailyLimit)} تومان
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">سقف ماهانه</span>
                      <span className="text-sm font-medium">
                        {formatNumber(goldCard.monthlyLimit)} تومان
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!goldCard && (
              <Card className="border-gold/10">
                <CardContent className="p-6 text-center">
                  <Crown className="size-12 text-gold/30 mx-auto mb-3" />
                  <p className="font-medium text-muted-foreground mb-1">
                    کارت طلایی ندارید
                  </p>
                  <p className="text-xs text-muted-foreground">
                    با رسیدن به سطح نقره می‌توانید درخواست کارت طلایی بدهید
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  Tab 3 — امنیت                                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="security">
          <div className="space-y-4">
            {/* OTP 2FA Status */}
            <Card className="border-gold/10">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Shield className="size-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-bold">احراز هویت دو مرحله‌ای (OTP)</h3>
                      <p className="text-xs text-muted-foreground">
                        ورود با کد پیامکی
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <Check className="size-3 ml-1" />
                    فعال
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="border-gold/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gold text-base">
                  <Key className="size-5" />
                  تغییر رمز عبور
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 md:p-6">
                {/* Current password */}
                <div className="space-y-2">
                  <Label className="text-sm">رمز عبور فعلی</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="رمز عبور فعلی خود را وارد کنید"
                      className="pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                    >
                      {showCurrentPwd ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="space-y-2">
                  <Label className="text-sm">رمز عبور جدید</Label>
                  <div className="relative">
                    <Input
                      type={showNewPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="حداقل ۸ کاراکتر"
                      className="pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                    >
                      {showNewPwd ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <Label className="text-sm">تأیید رمز عبور جدید</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="رمز عبور جدید را مجدداً وارد کنید"
                      className="pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                    >
                      {showConfirmPwd ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="bg-gold text-white hover:bg-gold/90 w-full sm:w-auto"
                >
                  {changingPassword ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      در حال تغییر...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-4" />
                      تغییر رمز عبور
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card className="border-gold/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gold text-base">
                  <Monitor className="size-5" />
                  نشست‌های فعال
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 md:p-6">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      session.isCurrent
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-muted bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {session.device}
                          {session.isCurrent && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 mr-2">
                              فعلی
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.ip} · {getTimeAgo(session.lastActive)}
                        </p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8"
                      >
                        <LogOut className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Deactivate Account */}
            <Button
              variant="outline"
              className="w-full border-red-500/20 text-red-500 hover:text-red-600 hover:bg-red-500/10 py-3"
              onClick={() => setShowDeactivateDialog(true)}
            >
              <AlertTriangle className="size-4 ml-2" />
              غیرفعال‌سازی حساب کاربری
            </Button>
          </div>

          {/* Deactivate Confirmation Dialog */}
          <Dialog
            open={showDeactivateDialog}
            onOpenChange={setShowDeactivateDialog}
          >
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="size-5" />
                  غیرفعال‌سازی حساب
                </DialogTitle>
                <DialogDescription>
                  آیا مطمئن هستید که می‌خواهید حساب کاربری خود را غیرفعال کنید؟
                  این عمل قابل بازگشت نیست و تمام اطلاعات شما حذف خواهد شد.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeactivateDialog(false)}
                >
                  انصراف
                </Button>
                <Button className="bg-red-500 text-white hover:bg-red-600">
                  غیرفعال‌سازی حساب
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  Tab 4 — سطح و دسترسی‌ها                              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="level">
          <div className="space-y-4">
            {/* Current Level Card */}
            <Card className="border-gold/10 overflow-hidden">
              <div className="h-2 bg-gradient-to-l from-gold/60 via-gold to-amber-500/60" />
              <CardContent className="p-4 md:p-6">
                <div className="text-center mb-6">
                  <span className="text-5xl mb-2 block">{currentCfg.emoji}</span>
                  <h3 className={cn('text-2xl font-bold', currentCfg.color)}>
                    سطح {currentCfg.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    امتیاز فعلی: {formatNumber(levelData.xp)} XP
                  </p>
                </div>

                {/* Progress bar */}
                {!isMaxLevel && nextCfg && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{currentCfg.label}</span>
                      <span>{nextCfg.label}</span>
                    </div>
                    <Progress
                      value={xpProgress}
                      className="h-3 bg-muted/50 [&>div]:bg-gold"
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      {formatNumber(levelData.xp)} / {formatNumber(nextCfg.minXp)} XP
                    </p>
                  </div>
                )}
                {isMaxLevel && (
                  <div className="text-center">
                    <Badge className="bg-gold/10 text-gold border-gold/20 text-sm px-4 py-1">
                      <Trophy className="size-4 ml-1" />
                      بالاترین سطح دسترسی‌پذیر
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Level Features Grid */}
            <Card className="border-gold/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gold text-base">
                  <Shield className="size-5" />
                  ویژگی‌های سطح
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {LEVEL_FEATURES.map((feature) => {
                    const unlocked = isLevelUnlocked(currentLevelKey, feature.level);
                    const featureLevelCfg = LEVEL_CONFIG[feature.level];
                    return (
                      <div
                        key={feature.key}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                          unlocked
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : 'border-muted bg-muted/30 opacity-60'
                        )}
                      >
                        <div
                          className={cn(
                            'size-8 rounded-lg flex items-center justify-center shrink-0',
                            unlocked
                              ? 'bg-emerald-500/10'
                              : 'bg-muted'
                          )}
                        >
                          {unlocked ? (
                            <Check className="size-4 text-emerald-500" />
                          ) : (
                            <Lock className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm font-medium truncate',
                              unlocked ? 'text-foreground' : 'text-muted-foreground'
                            )}
                          >
                            {feature.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {featureLevelCfg?.emoji} سطح {featureLevelCfg?.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* XP Summary */}
            <Card className="border-gold/10">
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gold">
                      {formatNumber(levelData.xp)}
                    </p>
                    <p className="text-xs text-muted-foreground">XP فعلی</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gold">
                      {formatNumber(
                        isMaxLevel ? 0 : (nextCfg?.minXp || 0) - levelData.xp
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">XP تا سطح بعد</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gold">
                      {LEVEL_ORDER.indexOf(currentLevelKey) + 1}/{LEVEL_ORDER.length}
                    </p>
                    <p className="text-xs text-muted-foreground">سطح فعلی</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/*  Tab 5 — دعوت دوستان                                   */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="referral">
          <div className="space-y-4">
            {/* Referral Code Card */}
            <Card className="border-gold/10 overflow-hidden">
              <div className="h-2 bg-gradient-to-l from-violet-400 via-gold to-amber-400" />
              <CardContent className="p-4 md:p-6 text-center">
                <Gift className="size-10 text-gold mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-1">کد دعوت شما</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  این کد را به دوستان خود بدهید و جایزه دریافت کنید
                </p>
                {user?.referralCode && (
                  <div className="inline-flex items-center gap-2 bg-gold/10 rounded-lg px-4 py-2.5">
                    <code className="text-lg font-mono font-bold text-gold tracking-widest">
                      {user.referralCode}
                    </code>
                    <button
                      onClick={() => handleCopyText(user.referralCode!, 'referral-code')}
                      className="text-muted-foreground hover:text-gold transition-colors"
                    >
                      {copiedField === 'referral-code' ? (
                        <Check className="size-5 text-emerald-500" />
                      ) : (
                        <Copy className="size-5" />
                      )}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share Buttons */}
            <Card className="border-gold/10">
              <CardContent className="p-4 md:p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Share2 className="size-4 text-gold" />
                  اشتراک‌گذاری
                </h3>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleShareTelegram}
                    className="bg-blue-500 hover:bg-blue-600 text-white flex-1 max-w-[160px]"
                  >
                    <MessageCircle className="size-4 ml-2" />
                    تلگرام
                  </Button>
                  <Button
                    onClick={handleShareWhatsApp}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white flex-1 max-w-[160px]"
                  >
                    <Smartphone className="size-4 ml-2" />
                    واتساپ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Referral Stats */}
            <Card className="border-gold/10">
              <CardContent className="p-4 md:p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Trophy className="size-4 text-gold" />
                  آمار دعوت
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-2xl font-bold text-gold">
                      {formatNumber(referralStats.totalInvited)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      تعداد دعوت‌شده‌ها
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <p className="text-2xl font-bold text-emerald-500">
                      {formatNumber(referralStats.earnedRewards)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      پاداش دریافتی (تومان)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Link */}
            {referralLink && (
              <Card className="border-gold/10">
                <CardContent className="p-4 md:p-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Link className="size-4 text-gold" />
                    لینک دعوت
                  </h3>
                  <div className="flex items-center gap-2">
                    <Input
                      value={referralLink}
                      readOnly
                      dir="ltr"
                      className="text-left text-sm bg-muted/30"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 border-gold/30 text-gold hover:bg-gold/10"
                      onClick={() => handleCopyText(referralLink, 'referral-link')}
                    >
                      {copiedField === 'referral-link' ? (
                        <Check className="size-4 text-emerald-500" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    با کلیک روی لینک بالا و ثبت‌نام، دوست شما و شما هر دو پاداش
                    دریافت خواهید کرد.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
