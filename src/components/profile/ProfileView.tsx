'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { formatToman, formatDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from '@/lib/framer-compat';
import {
  User, Mail, Phone, MapPin, CreditCard, Shield, Camera,
  CheckCircle, XCircle, Clock, AlertTriangle, Upload, FileText,
  CameraIcon, IdCard, Building2, Lock, Trophy, Hourglass,
  ShieldCheck, Star, Crown, Gem, Headphones, Sparkles,
  RotateCcw, FileCheck, Video
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import KYCWizard from '@/components/profile/KYCWizard';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}

const achievements: Achievement[] = [
  { id: 'first-trade', icon: '🏆', title: 'اولین معامله', description: 'انجام اولین معامله طلایی', unlocked: true },
  { id: 'ten-trades', icon: '🎯', title: '۱۰ معامله', description: 'انجام ۱۰ معامله موفق', unlocked: true },
  { id: 'gold-saver', icon: '💎', title: 'پسانداز طلایی', description: 'ذخیره حداقل ۱ گرم طلا', unlocked: true },
  { id: 'early-adopter', icon: '👋', title: 'عضو اولیه', description: 'عضویت در ماه‌های اول راه‌اندازی', unlocked: true },
  { id: 'profitable', icon: '📈', title: 'سودآور', description: 'کسب سود از معاملات طلایی', unlocked: true },
  { id: 'kyc-verified', icon: '🔒', title: 'احراز هویت شده', description: 'تکمیل فرآیند احراز هویت', unlocked: false },
  { id: 'five-referrals', icon: '🤝', title: '۵ دعوت', description: 'دعوت ۵ نفر جدید به زرین گلد', unlocked: false },
  { id: 'pro-investor', icon: '💰', title: 'سرمایه‌گذار حرفه‌ای', description: 'سرمایه‌گذاری بیش از ۰.۳ گرم طلا', unlocked: false },
];

const unlockedCount = achievements.filter(a => a.unlocked).length;

interface KYCData {
  status: string;
  adminNote: string;
  idCardImage: string;
  idCardBackImage: string;
  selfieImage: string;
  bankCardImage: string;
  verificationVideo: string;
}

/* ------------------------------------------------------------------ */
/*  KYC Benefits List (shared sub-component)                           */
/* ------------------------------------------------------------------ */

const KYC_BENEFITS = [
  { icon: Gem, text: 'برداشت تا سقف ۱ کیلوگرم طلا در روز' },
  { icon: Sparkles, text: 'معاملات بدون محدودیت و با کارمزد ویژه' },
  { icon: Crown, text: 'دریافت وام طلایی با سود پایین' },
  { icon: CreditCard, text: 'دسترسی به کارت طلایی زرین گلد' },
  { icon: Headphones, text: 'پشتیبانی ویژه ۲۴ ساعته' },
  { icon: Star, text: 'شرکت در برنامه‌های تخفیف و جایزه' },
];

function KYCBenefitsList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {KYC_BENEFITS.map((b, i) => {
        const BIcon = b.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="card-glass-premium flex items-center gap-2.5 p-3 rounded-xl"
          >
            <div className="size-7 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
              <BIcon className="size-3.5 text-gold" />
            </div>
            <span className="text-sm text-foreground/90">{b.text}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ProfileView() {
  const { user, addToast } = useAppStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    fullName: '', email: '', nationalId: '', birthDate: '',
    province: '', city: '', address: '', postalCode: '', iban: '',
  });
  const [kyc, setKyc] = useState<KYCData>({
    status: 'none', adminNote: '', idCardImage: '', idCardBackImage: '', selfieImage: '', bankCardImage: '', verificationVideo: '',
  });
  const [showWizard, setShowWizard] = useState(false);

  /* Auto-switch to KYC tab when pageEvent 'start-kyc' fires */
  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      if (state.pageEvent?.action === 'start-kyc') {
        setActiveTab('kyc');
        setShowWizard(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const [profileRes, kycRes] = await Promise.all([
          fetch(`/api/profile?userId=${user.id}`),
          fetch(`/api/kyc?userId=${user.id}`),
        ]);
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.success && data.user) {
            const u = data.user;
            setProfile((prev) => ({
              ...prev,
              fullName: u.fullName || prev.fullName,
              email: u.email || prev.email,
              nationalId: u.profile?.nationalId || prev.nationalId,
              birthDate: u.profile?.birthDate || prev.birthDate,
              province: u.profile?.province || prev.province,
              city: u.profile?.city || prev.city,
              address: u.profile?.address || prev.address,
              postalCode: u.profile?.postalCode || prev.postalCode,
              iban: u.profile?.iban || prev.iban,
            }));
          }
        }
        if (kycRes.ok) {
          const data = await kycRes.json();
          if (data?.kyc) setKyc(data.kyc);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchData();
  }, [user?.id]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/profile?userId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        addToast('اطلاعات پروفایل با موفقیت ذخیره شد', 'success');
      } else {
        addToast('خطا در ذخیره اطلاعات', 'error');
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
    }
    setSaving(false);
  };

  const handleSubmitKYC = async (form: Record<string, string>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/kyc?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      });
      if (res.ok) {
        addToast('مدارک با موفقیت ارسال شد', 'success');
        setShowWizard(false);
        refreshKYC();
        return true;
      } else {
        addToast('خطا در ارسال مدارک', 'error');
        return false;
      }
    } catch {
      addToast('خطا در ارتباط با سرور', 'error');
      return false;
    }
  };

  const refreshKYC = async () => {
    const kycRes = await fetch(`/api/kyc?userId=${user.id}`);
    if (kycRes.ok) {
      const data = await kycRes.json();
      if (data.kyc) setKyc(data.kyc);
    }
  };

  const getKycStatusBadge = () => {
    switch (kyc.status) {
      case 'approved': return <Badge className="badge-success-green"><CheckCircle className="size-3 ml-1" /> تأیید شده</Badge>;
      case 'rejected': return <Badge className="badge-danger-red"><XCircle className="size-3 ml-1" /> رد شده</Badge>;
      case 'pending': return <Badge className="badge-warning-amber"><Clock className="size-3 ml-1" /> در انتظار بررسی</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground"><AlertTriangle className="size-3 ml-1" /> احراز نشده</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">پروفایل</h1>
        {getKycStatusBadge()}
      </div>

      {/* Avatar + Info Card */}
      <Card className="card-gold-border border-gold/10 overflow-hidden">
        <div className="h-24 bg-gradient-to-l from-gold/20 via-gold/10 to-transparent" />
        <CardContent className="-mt-10 relative p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
            <Avatar className="size-20 border-4 border-background shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-gold to-gold-dark text-white text-xl font-bold">
                {(profile.fullName || user?.phone || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gold-gradient">{profile.fullName || 'کاربر زرین گلد'}</h2>
              <p className="text-sm text-gold-gradient flex items-center gap-1">
                <Phone className="size-3" /> {user?.phone || '---'}
              </p>
              {user?.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="size-3" /> {user.email}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  PROMINENT KYC STATUS BANNER                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {kyc.status === 'approved' ? (
          /* ── Approved Banner ── */
          <div className="relative rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 p-5 overflow-hidden">
            <div className="pointer-events-none absolute -top-4 -left-4 size-24 rounded-full bg-emerald-500/10 blur-xl" />
            <div className="relative flex items-center gap-4">
              <div className="size-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <CheckCircle className="size-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-emerald-400">احراز هویت تکمیل شده</h3>
                  <Badge className="badge-success-green">تأیید شده</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  تمام امکانات ویژه زرین گلد برای شما فعال است
                </p>
              </div>
            </div>
          </div>
        ) : kyc.status === 'pending' ? (
          /* ── Pending Banner ── */
          <div className="relative rounded-2xl bg-gradient-to-l from-gold/[0.08] via-amber-500/[0.05] to-transparent border border-gold/20 p-5 overflow-hidden">
            <div className="pointer-events-none absolute -top-4 -left-4 size-24 rounded-full bg-gold/10 blur-xl" />
            <div className="relative flex items-center gap-4">
              <div className="relative size-14 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg shadow-gold/20 shrink-0">
                <Hourglass className="size-7 text-white" />
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-gold animate-ping opacity-75" />
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gold">در حال بررسی</h3>
                  <Badge className="badge-warning-amber"><Clock className="size-3 ml-1" /> در انتظار</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  مدارک شما در حال بررسی توسط کارشناسان است. معمولاً تا ۲۴ ساعت نتیجه مشخص می‌شود.
                </p>
              </div>
            </div>
          </div>
        ) : kyc.status === 'rejected' ? (
          /* ── Rejected Banner ── */
          <div className="relative rounded-2xl bg-gradient-to-l from-red-500/[0.08] via-red-500/[0.04] to-transparent border border-red-500/20 p-5 overflow-hidden">
            <div className="pointer-events-none absolute -top-4 -left-4 size-24 rounded-full bg-red-500/10 blur-xl" />
            <div className="relative flex items-start gap-4">
              <div className="size-14 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
                <XCircle className="size-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-red-400">احراز هویت رد شده</h3>
                  <Badge className="badge-danger-red">رد شده</Badge>
                </div>
                {kyc.adminNote && (
                  <p className="text-sm text-red-300/80 mt-1">دلیل: {kyc.adminNote}</p>
                )}
                <Button
                  className="mt-3 btn-gold-gradient"
                  size="lg"
                  onClick={() => { setActiveTab('kyc'); setShowWizard(true); }}
                >
                  <RotateCcw className="size-4 ml-2" />
                  تلاش مجدد احراز هویت
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ── None / Start KYC Banner ── */
          <div
            className="relative rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => { setActiveTab('kyc'); setShowWizard(true); }}
          >
            {/* Gold gradient background */}
            <div className="absolute inset-0 bg-gradient-to-l from-gold/15 via-gold/8 to-gold/[0.03]" />
            <div className="pointer-events-none absolute -top-8 -left-8 size-32 rounded-full bg-gold/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-6 -right-6 size-24 rounded-full bg-gold/8 blur-xl" />
            {/* Shimmer overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-gold/[0.06] to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />

            <div className="relative border border-gold/25 rounded-2xl p-5 md:p-6 space-y-5 transition-all duration-300 group-hover:border-gold/40 group-hover:shadow-lg group-hover:shadow-gold/10">
              {/* Header row */}
              <div className="flex items-center gap-3">
                <div className="size-14 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/25 shrink-0">
                  <Shield className="size-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-gold-gradient">احراز هویت</h3>
                    <Badge variant="outline" className="text-muted-foreground border-amber-500/30 bg-amber-500/5">
                      <AlertTriangle className="size-3 ml-1" />
                      تکمیل نشده
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    برای استفاده از تمام امکانات زرین گلد، هویت خود را تأیید کنید
                  </p>
                </div>
              </div>

              {/* Benefits mini-grid (4 items in a row) */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: Gem, text: 'برداشت تا سقف ۱ کیلوگرم' },
                  { icon: Sparkles, text: 'معاملات بدون محدودیت' },
                  { icon: Crown, text: 'وام طلایی با سود پایین' },
                  { icon: Headphones, text: 'پشتیبانی ویژه ۲۴ ساعته' },
                ].map((b, i) => {
                  const BIcon = b.icon;
                  return (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-gold/[0.04] border border-gold/10 p-2.5">
                      <div className="size-6 rounded-md bg-gold/10 flex items-center justify-center shrink-0">
                        <BIcon className="size-3 text-gold" />
                      </div>
                      <span className="text-xs text-foreground/80 leading-relaxed">{b.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Big CTA Button */}
              <Button className="w-full btn-gold-gradient h-12 text-base font-bold" size="lg">
                <Shield className="size-5 ml-2" />
                شروع احراز هویت
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-6">
        <TabsList className="bg-muted/50 w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
          <TabsTrigger value="personal" className={cn(activeTab === 'personal' && 'tab-active-gold')}>اطلاعات شخصی</TabsTrigger>
          <TabsTrigger value="kyc" className={cn(activeTab === 'kyc' && 'tab-active-gold')}>احراز هویت</TabsTrigger>
          <TabsTrigger value="security" className={cn(activeTab === 'security' && 'tab-active-gold')}>امنیت</TabsTrigger>
          <TabsTrigger value="achievements" className={cn(activeTab === 'achievements' && 'tab-active-gold')}>دستاوردها</TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card className="border-gold/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-gold" />
                اطلاعات شخصی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label>نام و نام خانوادگی</Label>
                  <Input className="input-gold-focus" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} placeholder="نام کامل خود را وارد کنید" />
                </div>
                <div className="space-y-2">
                  <Label>ایمیل</Label>
                  <Input className="input-gold-focus text-left" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="example@email.com" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>شماره موبایل</Label>
                  <Input value={user?.phone || ''} disabled className="bg-muted/50" />
                  <p className="text-xs text-muted-foreground">شماره موبایل قابل تغییر نیست</p>
                </div>
                <div className="space-y-2">
                  <Label>کد ملی</Label>
                  <Input className="input-gold-focus text-left" value={profile.nationalId} onChange={(e) => setProfile({ ...profile, nationalId: e.target.value })} placeholder="کد ملی ۱۰ رقمی" maxLength={10} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>تاریخ تولد</Label>
                  <Input className="input-gold-focus text-left" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} placeholder="1360/01/01" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>کد پستی</Label>
                  <Input className="input-gold-focus text-left" value={profile.postalCode} onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })} placeholder="کد پستی ۱۰ رقمی" maxLength={10} dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><MapPin className="size-3" /> استان</Label>
                  <Input className="input-gold-focus" value={profile.province} onChange={(e) => setProfile({ ...profile, province: e.target.value })} placeholder="نام استان" />
                </div>
                <div className="space-y-2">
                  <Label>شهر</Label>
                  <Input className="input-gold-focus" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="نام شهر" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>آدرس</Label>
                <Textarea className="input-gold-focus" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="آدرس کامل پستی" rows={3} />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving} className="btn-gold-gradient">
                  {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KYC Tab */}
        <TabsContent value="kyc">
          {showWizard ? (
            <KYCWizard kyc={kyc} userId={user?.id || ''} onSubmit={handleSubmitKYC} onRefresh={refreshKYC} />
          ) : (
            <div className="space-y-5">
              {/* Gold gradient header */}
              <Card className="card-gold-border border-gold/10 overflow-hidden">
                <div className="h-24 bg-gradient-to-l from-gold/20 via-gold/10 to-transparent relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
                <CardContent className="-mt-10 relative p-4 md:p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="size-14 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/20 shrink-0">
                      <Shield className="size-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold">احراز هویت</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        با تکمیل احراز هویت، تمام امکانات زرین گلد در اختیار شما قرار می‌گیرد
                      </p>
                    </div>
                  </div>

                  {/* Approved State */}
                  {kyc.status === 'approved' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-5"
                    >
                      {/* Success banner */}
                      <div className="relative rounded-2xl bg-emerald-500/5 border border-emerald-500/15 p-6 text-center overflow-hidden">
                        {/* Confetti-like gold particles */}
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                          {[...Array(12)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: -20, scale: 0 }}
                              animate={{ opacity: [0, 1, 0.6, 0], y: [0, 40 + i * 15], scale: [0, 1, 0.5], rotate: [0, 180 * (i % 2 === 0 ? 1 : -1)] }}
                              transition={{ duration: 2 + i * 0.15, delay: i * 0.12, repeat: Infinity, repeatDelay: 3 }}
                              className="absolute"
                              style={{ left: `${8 + i * 7.5}%`, top: `${5 + (i % 3) * 10}%` }}
                            >
                              <div className="size-2 rounded-full bg-gold" />
                            </motion.div>
                          ))}
                        </div>

                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                          className="mx-auto mb-4 size-20 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-xl shadow-gold/30"
                        >
                          <CheckCircle className="size-10 text-white" />
                        </motion.div>
                        <h3 className="text-lg font-bold text-emerald-400">هویت شما تأیید شده است! 🎉</h3>
                        <p className="text-sm text-muted-foreground mt-1.5">
                          تمام امکانات ویژه زرین گلد برای شما فعال شده است
                        </p>
                      </div>

                      {/* Benefits unlocked */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-gold flex items-center gap-2">
                          <Sparkles className="size-4" />
                          امکانات فعال‌شده
                        </h4>
                        <KYCBenefitsList />
                      </div>
                    </motion.div>
                  )}

                  {/* Pending State */}
                  {kyc.status === 'pending' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-5"
                    >
                      <div className="relative rounded-2xl bg-amber-500/5 border border-amber-500/15 p-6 text-center overflow-hidden">
                        {/* Animated gold ring pulse */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <motion.div
                            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="size-28 rounded-full border-2 border-gold/30"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0, 0.15] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                            className="absolute size-28 rounded-full border border-gold/20"
                          />
                        </div>

                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                          className="mx-auto mb-4 size-20 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-xl shadow-gold/20"
                        >
                          <Hourglass className="size-9 text-white" />
                        </motion.div>
                        <h3 className="text-lg font-bold text-gold">مدارک شما در حال بررسی است</h3>
                        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
                          کارشناسان ما در حال بررسی مدارک شما هستند. نتیجه از طریق اعلان‌ها به شما اطلاع داده می‌شود.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 border border-amber-500/15">
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="size-2 rounded-full bg-gold"
                          />
                          <span className="text-xs text-amber-400 font-medium">معمولاً تا ۲۴ ساعت آینده نتیجه مشخص می‌شود</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Rejected State */}
                  {kyc.status === 'rejected' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-5"
                    >
                      {/* Rejection reason */}
                      <div className="rounded-2xl bg-red-500/5 border border-red-500/15 p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="size-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <XCircle className="size-5 text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-red-400">مدارک شما رد شده است</h3>
                            {kyc.adminNote && (
                              <div className="mt-2 rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                                <p className="text-xs text-red-300/70 font-medium mb-1">دلیل رد مدارک:</p>
                                <p className="text-sm text-red-300">{kyc.adminNote}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Retry CTA */}
                      <Button className="w-full btn-gold-gradient" size="lg" onClick={() => setShowWizard(true)}>
                        <RotateCcw className="size-4 ml-2" />
                        تلاش مجدد احراز هویت
                      </Button>
                    </motion.div>
                  )}

                  {/* None / Intro State */}
                  {kyc.status === 'none' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-5"
                    >
                      {/* Intro card */}
                      <div className="rounded-2xl bg-gradient-to-b from-gold/[0.06] to-transparent border border-gold/10 p-5 space-y-4">
                        {/* Security messaging */}
                        <div className="flex items-center gap-3 rounded-xl bg-gold/[0.04] border border-gold/10 p-3.5">
                          <div className="size-9 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                            <ShieldCheck className="size-5 text-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gold">امنیت و حریم خصوصی</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              تمام مدارک شما رمزنگاری شده و محرمانه باقی می‌مانند
                            </p>
                          </div>
                          <Lock className="size-4 text-gold/40 shrink-0" />
                        </div>

                        {/* Steps overview */}
                        <div className="space-y-2.5">
                          <h4 className="text-sm font-bold flex items-center gap-2">
                            <FileText className="size-4 text-gold" />
                            مراحل احراز هویت
                          </h4>
                          <div className="space-y-2">
                            {[
                              { icon: IdCard, label: 'تصویر روی کارت ملی' },
                              { icon: FileCheck, label: 'تصویر پشت کارت ملی' },
                              { icon: Camera, label: 'عکس سلفی با کارت ملی' },
                              { icon: Building2, label: 'تصویر کارت بانکی' },
                              { icon: Video, label: 'ویدئوی احراز هویت' },
                            ].map((step, i) => (
                              <div key={i} className="flex items-center gap-2.5">
                                <div className="size-7 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                                  <step.icon className="size-3.5 text-gold" />
                                </div>
                                <span className="text-sm text-muted-foreground">{step.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-gold flex items-center gap-2">
                            <Star className="size-4" />
                            مزایای احراز هویت
                          </h4>
                          <KYCBenefitsList />
                        </div>
                      </div>

                      {/* Start CTA */}
                      <Button className="w-full btn-gold-gradient" size="lg" onClick={() => setShowWizard(true)}>
                        <Shield className="size-4 ml-2" />
                        شروع احراز هویت
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="card-gold-border border-gold/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5 text-gold" />
                امنیت حساب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 md:p-6">
              <div className="hover-lift-sm flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium">احراز هویت دو مرحله‌ای (OTP)</p>
                    <p className="text-sm text-muted-foreground">فعال - ورود با کد پیامکی</p>
                  </div>
                </div>
                <Badge className="badge-success-green">فعال</Badge>
              </div>

              <Separator />

              <div>
                <h3 className="font-bold mb-3">نشست‌های فعال</h3>
                <div className="space-y-3">
                  <div className="hover-lift-sm flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-gold/20 flex items-center justify-center">
                        <CreditCard className="size-4 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">مرورگر فعلی</p>
                        <p className="text-xs text-muted-foreground">ایران - همین الان</p>
                      </div>
                    </div>
                    <Badge className="badge-success-green text-xs">فعال</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-bold mb-3">تغییر شماره موبایل</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  برای تغییر شماره موبایل، با پشتیبانی تماس بگیرید.
                </p>
                <Button variant="outline" onClick={() => useAppStore.getState().setPage('support')}>
                  تماس با پشتیبانی
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card className="border-gold/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-5 text-gold" />
                دستاوردها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 md:p-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">پیشرفت دستاوردها</span>
                  <span className="font-bold text-gold">{unlockedCount} از {achievements.length} دستاورد</span>
                </div>
                <Progress value={(unlockedCount / achievements.length) * 100} className="h-3 [&>div]:bg-gradient-to-l [&>div]:from-gold [&>div]:to-gold-dark" />
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
                    className={cn(
                      'hover-lift-sm relative rounded-xl p-4 border transition-all duration-300',
                      achievement.unlocked
                        ? 'card-gold-border bg-gold/5 border-gold/30 shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.25)] hover:border-gold/50'
                        : 'bg-muted/30 border-border/50 opacity-50'
                    )}
                  >
                    {/* Gold shimmer overlay for unlocked badges */}
                    {achievement.unlocked && (
                      <div className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-gold/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
                      </div>
                    )}

                    <div className="relative flex items-start gap-3">
                      {/* Icon */}
                      <div className={`size-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                        achievement.unlocked
                          ? 'bg-gold/15 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                          : 'bg-muted'
                      }`}>
                        {achievement.icon}
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold text-sm ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {achievement.title}
                          </h4>
                          {achievement.unlocked && (
                            <CheckCircle className="size-3.5 text-gold shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {achievement.description}
                        </p>
                      </div>

                      {/* Lock Overlay */}
                      {!achievement.unlocked && (
                        <div className="absolute top-2 left-2">
                          <Lock className="size-3.5 text-muted-foreground/60" />
                        </div>
                      )}
                    </div>

                    {/* Unlocked badge indicator */}
                    {achievement.unlocked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20, delay: index * 0.08 + 0.3 }}
                        className="absolute -top-1.5 -left-1.5 size-5 rounded-full bg-gold flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                      >
                        <CheckCircle className="size-3 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Summary text */}
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  با فعالیت بیشتر در زرین گلد، دستاوردهای بیشتری کسب کنید! 🌟
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
