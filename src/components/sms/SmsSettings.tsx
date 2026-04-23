'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Key,
  ShieldCheck,
  FileText,
  Send,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Settings,
  Phone,
  Bell,
  Coins,
  TrendingUp,
  ArrowUpDown,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NotificationTemplate {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
  variables: string[];
}

interface SmsLogEntry {
  id: string;
  date: string;
  phone: string;
  type: string;
  status: 'delivered' | 'failed' | 'pending';
  cost: number;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const mockLogs: SmsLogEntry[] = [
  { id: '1', date: '۱۴۰۳/۰۳/۱۵ - ۱۴:۳۲', phone: '0912***4567', type: 'کد تأیید', status: 'delivered', cost: 35 },
  { id: '2', date: '۱۴۰۳/۰۳/۱۵ - ۱۴:۲۸', phone: '0935***8901', type: 'هشدار قیمت', status: 'delivered', cost: 45 },
  { id: '3', date: '۱۴۰۳/۰۳/۱۵ - ۱۳:۵۵', phone: '0919***2345', type: 'تراکنش', status: 'failed', cost: 0 },
  { id: '4', date: '۱۴۰۳/۰۳/۱۵ - ۱۳:۴۲', phone: '0933***6789', type: 'کد تأیید', status: 'delivered', cost: 35 },
  { id: '5', date: '۱۴۰۳/۰۳/۱۵ - ۱۲:۱۸', phone: '0916***0123', type: 'برداشت', status: 'delivered', cost: 50 },
  { id: '6', date: '۱۴۰۳/۰۳/۱۵ - ۱۱:۰۵', phone: '0938***4567', type: 'واریز', status: 'pending', cost: 45 },
  { id: '7', date: '۱۴۰۳/۰۳/۱۵ - ۱۰:۴۸', phone: '0912***8901', type: 'کد تأیید', status: 'delivered', cost: 35 },
  { id: '8', date: '۱۴۰۳/۰۳/۱۵ - ۰۹:۳۳', phone: '0935***2345', type: 'امنیت', status: 'delivered', cost: 40 },
  { id: '9', date: '۱۴۰۳/۰۳/۱۵ - ۰۹:۱۲', phone: '0919***6789', type: 'تبلیغاتی', status: 'failed', cost: 0 },
  { id: '10', date: '۱۴۰۳/۰۳/۱۵ - ۰۸:۵۰', phone: '0933***0123', type: 'کد تأیید', status: 'delivered', cost: 35 },
];

const defaultTemplates: NotificationTemplate[] = [
  {
    id: 'welcome',
    name: 'پیام خوش‌آمدگویی',
    content: '{app_name} — به {phone} عزیز خوش آمدید! حساب شما با موفقیت ایجاد شد.',
    enabled: true,
    variables: ['{app_name}', '{phone}'],
  },
  {
    id: 'transaction',
    name: 'اطلاعیه تراکنش',
    content: '{app_name} — تراکنش {type} به مبلغ {amount} واحد طلایی با موفقیت انجام شد. کد پیگیری: {ref_id}',
    enabled: true,
    variables: ['{app_name}', '{type}', '{amount}', '{ref_id}'],
  },
  {
    id: 'price_alert',
    name: 'هشدار قیمت',
    content: '{app_name} — قیمت طلا به {price} واحد طلایی {direction} کرد. هدف شما: {target_price} واحد طلایی',
    enabled: true,
    variables: ['{app_name}', '{price}', '{direction}', '{target_price}'],
  },
  {
    id: 'deposit_withdrawal',
    name: 'اطلاعیه واریز/برداشت',
    content: '{app_name} — {action} به مبلغ {amount} واحد طلایی {status} شد. موجودی فعلی: {balance} واحد طلایی',
    enabled: true,
    variables: ['{app_name}', '{action}', '{amount}', '{status}', '{balance}'],
  },
];

/* ------------------------------------------------------------------ */
/*  Section Header Helper                                              */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  badge?: React.ReactNode;
}) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10">
            <Icon className="size-4 text-[#D4AF37]" />
          </div>
          {title}
        </CardTitle>
        {badge}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 pr-10">{description}</p>
      )}
    </CardHeader>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: SmsLogEntry['status'] }) {
  switch (status) {
    case 'delivered':
      return (
        <Badge className="badge-success-green">
          <CheckCircle className="size-3 ml-1" />
          تحویل شده
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="badge-danger-red">
          <XCircle className="size-3 ml-1" />
          ناموفق
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="size-3 ml-1" />
          در انتظار
        </Badge>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function SmsSettings() {
  const { addToast } = useAppStore();

  // ─── Section 1: API Configuration ───
  const [provider, setProvider] = useState('kavenegar');
  const [apiKey, setApiKey] = useState('');
  const [apiUsername, setApiUsername] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saving, setSaving] = useState(false);

  // ─── Section 2: OTP Settings ───
  const [otpTemplateId, setOtpTemplateId] = useState('');
  const [otpMessageTemplate, setOtpMessageTemplate] = useState(
    'کد تأیید شما: {code}\n{app_name}\nاعتبار: ۲ دقیقه'
  );
  const [otpExpiration, setOtpExpiration] = useState('2');
  const [otpLength, setOtpLength] = useState('6');
  const [otpMaxAttempts, setOtpMaxAttempts] = useState('5');

  // ─── Section 3: Notification Templates ───
  const [templates, setTemplates] = useState<NotificationTemplate[]>(defaultTemplates);

  // ─── Section 4: Sending Rules ───
  const [dailyLimit, setDailyLimit] = useState('10');
  const [sendingRules, setSendingRules] = useState({
    otp: true,
    transaction: true,
    priceAlert: true,
    marketing: false,
    security: true,
  });

  // ─── Handlers ───

  const handleTestConnection = useCallback(() => {
    setTestLoading(true);
    // Mock test connection
    setTimeout(() => {
      setTestLoading(false);
      if (apiKey.trim().length > 0) {
        setConnectionStatus('success');
        addToast('اتصال به سرور پیامکی برقرار شد', 'success');
      } else {
        setConnectionStatus('error');
        addToast('خطا در اتصال. کلید API را بررسی کنید.', 'error');
      }
    }, 1500);
  }, [apiKey, addToast]);

  const handleSaveSettings = useCallback(() => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      addToast('تنظیمات پنل پیامکی ذخیره شد', 'success');
    }, 800);
  }, [addToast]);

  const handleToggleTemplate = useCallback((id: string, enabled: boolean) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled } : t))
    );
    addToast(
      enabled ? 'قالب فعال شد' : 'قالب غیرفعال شد',
      'info'
    );
  }, [addToast]);

  const handleUpdateTemplate = useCallback((id: string, content: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, content } : t))
    );
  }, []);

  const handleToggleRule = useCallback((key: keyof typeof sendingRules, value: boolean) => {
    setSendingRules((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isCustomProvider = provider === 'custom';

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 1: API Configuration                                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Card className="card-gold-border">
        <SectionHeader
          icon={Key}
          title="پیکربندی API"
          description="تنظیمات اتصال به ارائه‌دهنده خدمات پیامکی"
          badge={
            connectionStatus === 'success' ? (
              <Badge className="badge-success-green">
                <CheckCircle className="size-3 ml-1" />
                متصل
              </Badge>
            ) : connectionStatus === 'error' ? (
              <Badge className="badge-danger-red">
                <XCircle className="size-3 ml-1" />
                قطع
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <Settings className="size-3 ml-1" />
                پیکربندی نشده
              </Badge>
            )
          }
        />
        <CardContent className="space-y-4">
          {/* Provider Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">ارائه‌دهنده SMS</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="input-gold-focus select-gold">
                <SelectValue placeholder="انتخاب ارائه‌دهنده" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kavenegar">کاوه‌نگار (Kavenegar)</SelectItem>
                <SelectItem value="melipayamak">ملی پیامک (Melipayamak)</SelectItem>
                <SelectItem value="smsir">اس‌ام‌اس‌آی‌آر (SMS.ir)</SelectItem>
                <SelectItem value="custom">سایر (Custom)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">کلید API</Label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="کلید API خود را وارد کنید"
                dir="ltr"
                className="input-gold-focus pl-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* API Username */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">نام کاربری API</Label>
            <Input
              value={apiUsername}
              onChange={(e) => setApiUsername(e.target.value)}
              placeholder="نام کاربری (در صورت نیاز)"
              dir="ltr"
              className="input-gold-focus"
            />
            <p className="text-xs text-muted-foreground">
              برای ملی پیامک و برخی ارائه‌دهندگان الزامی است
            </p>
          </div>

          {/* API Endpoint — only for custom */}
          {isCustomProvider && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">آدرس API Endpoint</Label>
              <Input
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.example.com/v1/sms/send"
                dir="ltr"
                className="input-gold-focus"
              />
              <p className="text-xs text-muted-foreground">
                آدرس کامل نقطه پایانی ارسال پیامک ارائه‌دهنده سفارشی
              </p>
            </div>
          )}

          <Separator />

          {/* Test Connection Button */}
          <Button
            onClick={handleTestConnection}
            disabled={testLoading}
            variant="outline"
            className="btn-gold-outline w-full sm:w-auto"
          >
            {testLoading ? (
              <Loader2 className="size-4 ml-2 animate-spin" />
            ) : (
              <Send className="size-4 ml-2" />
            )}
            تست اتصال
          </Button>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 2: OTP Settings                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Card className="card-gold-border">
        <SectionHeader
          icon={ShieldCheck}
          title="تنظیمات OTP"
          description="پیکربندی کد تأیید پیامکی"
        />
        <CardContent className="space-y-4">
          {/* OTP Template ID */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">شناسه قالب OTP</Label>
            <Input
              value={otpTemplateId}
              onChange={(e) => setOtpTemplateId(e.target.value)}
              placeholder="نام یا شناسه قالب تأیید"
              dir="ltr"
              className="input-gold-focus"
            />
            <p className="text-xs text-muted-foreground">
              برای SMS.ir شناسه عددی قالب، برای سایر ارائه‌دهندگان نام قالب
            </p>
          </div>

          {/* OTP Message Template */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">قالب پیام OTP</Label>
            <Textarea
              value={otpMessageTemplate}
              onChange={(e) => setOtpMessageTemplate(e.target.value)}
              placeholder="قالب پیام تأیید..."
              rows={4}
              className="input-gold-focus resize-none"
            />
            <div className="flex flex-wrap gap-2 mt-1">
              {['{code}', '{phone}', '{app_name}'].map((v) => (
                <Badge
                  key={v}
                  variant="outline"
                  className="text-xs font-mono bg-[#D4AF37]/5 border-[#D4AF37]/20 text-[#D4AF37]"
                >
                  {v}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* OTP Settings Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Expiration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">زمان انقضا (دقیقه)</Label>
              <Input
                type="number"
                value={otpExpiration}
                onChange={(e) => setOtpExpiration(e.target.value)}
                dir="ltr"
                min="1"
                max="10"
                className="input-gold-focus text-center"
              />
            </div>
            {/* Length */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">طول کد</Label>
              <Input
                type="number"
                value={otpLength}
                onChange={(e) => setOtpLength(e.target.value)}
                dir="ltr"
                min="4"
                max="8"
                className="input-gold-focus text-center"
              />
            </div>
            {/* Max Attempts */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">حداکثر تلاش</Label>
              <Input
                type="number"
                value={otpMaxAttempts}
                onChange={(e) => setOtpMaxAttempts(e.target.value)}
                dir="ltr"
                min="1"
                max="10"
                className="input-gold-focus text-center"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 3: Notification Templates                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Card className="card-gold-border">
        <SectionHeader
          icon={FileText}
          title="قالب‌های اعلان"
          description="مدیریت محتوای پیام‌های اطلاع‌رسانی"
        />
        <CardContent className="space-y-6">
          {templates.map((template, index) => (
            <div key={template.id}>
              {index > 0 && <Separator className="mb-6" />}
              <div className="space-y-3">
                {/* Template Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-[#D4AF37]" />
                    <span className="text-sm font-medium">{template.name}</span>
                  </div>
                  <Switch
                    checked={template.enabled}
                    onCheckedChange={(checked) => handleToggleTemplate(template.id, checked)}
                    className="data-[state=checked]:bg-[#D4AF37]"
                  />
                </div>

                {/* Template Content */}
                <Textarea
                  value={template.content}
                  onChange={(e) => handleUpdateTemplate(template.id, e.target.value)}
                  disabled={!template.enabled}
                  rows={2}
                  className={cn(
                    'input-gold-focus resize-none text-sm',
                    !template.enabled && 'opacity-50'
                  )}
                  dir="auto"
                />

                {/* Template Variables */}
                <div className="flex flex-wrap gap-1.5">
                  {template.variables.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="text-[10px] font-mono bg-muted/50 border-border/50 text-muted-foreground"
                    >
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 4: Sending Rules                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Card className="card-gold-border">
        <SectionHeader
          icon={Bell}
          title="قوانین ارسال"
          description="محدودیت‌ها و مجوزهای ارسال پیامک"
        />
        <CardContent className="space-y-6">
          {/* Daily Limit */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">محدودیت روزانه پیامک به ازای هر کاربر</Label>
            <Input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              dir="ltr"
              min="1"
              max="100"
              className="input-gold-focus w-full sm:w-40"
            />
            <p className="text-xs text-muted-foreground">
              پس از رسیدن به این محدودیت، ارسال پیامک تا روز بعد متوقف می‌شود
            </p>
          </div>

          <Separator />

          {/* Event Type Rules */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">فعال‌سازی پیامک برای رویدادها</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* OTP Verification */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <ShieldCheck className="size-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">تأیید OTP</p>
                    <p className="text-xs text-muted-foreground">کد تأیید ورود</p>
                  </div>
                </div>
                <Switch
                  checked={sendingRules.otp}
                  onCheckedChange={(v) => handleToggleRule('otp', v)}
                  className="data-[state=checked]:bg-[#D4AF37]"
                />
              </div>

              {/* Transaction */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-blue-500/15 flex items-center justify-center">
                    <ArrowUpDown className="size-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">اعلان تراکنش</p>
                    <p className="text-xs text-muted-foreground">خرید و فروش</p>
                  </div>
                </div>
                <Switch
                  checked={sendingRules.transaction}
                  onCheckedChange={(v) => handleToggleRule('transaction', v)}
                  className="data-[state=checked]:bg-[#D4AF37]"
                />
              </div>

              {/* Price Alert */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                    <TrendingUp className="size-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">هشدار قیمت</p>
                    <p className="text-xs text-muted-foreground">تغییرات بازار</p>
                  </div>
                </div>
                <Switch
                  checked={sendingRules.priceAlert}
                  onCheckedChange={(v) => handleToggleRule('priceAlert', v)}
                  className="data-[state=checked]:bg-[#D4AF37]"
                />
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-purple-500/15 flex items-center justify-center">
                    <MessageSquare className="size-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">پیام‌های تبلیغاتی</p>
                    <p className="text-xs text-muted-foreground">تخفیف و پیشنهاد</p>
                  </div>
                </div>
                <Switch
                  checked={sendingRules.marketing}
                  onCheckedChange={(v) => handleToggleRule('marketing', v)}
                  className="data-[state=checked]:bg-[#D4AF37]"
                />
              </div>

              {/* Security Alerts */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-red-500/15 flex items-center justify-center">
                    <AlertTriangle className="size-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">هشدارهای امنیتی حساب</p>
                    <p className="text-xs text-muted-foreground">ورود مشکوک، تغییر رمز عبور و...</p>
                  </div>
                </div>
                <Switch
                  checked={sendingRules.security}
                  onCheckedChange={(v) => handleToggleRule('security', v)}
                  className="data-[state=checked]:bg-[#D4AF37]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Section 5: Sending Logs                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Card className="card-gold-border">
        <SectionHeader
          icon={Send}
          title="گزارش ارسال‌ها"
          description="آخرین پیامک‌های ارسال‌شده"
          badge={
            <Badge variant="outline" className="text-xs text-muted-foreground">
              ۱۰ ردیف آخر
            </Badge>
          }
        />
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs font-semibold">تاریخ</TableHead>
                  <TableHead className="text-xs font-semibold">شماره</TableHead>
                  <TableHead className="text-xs font-semibold">نوع</TableHead>
                  <TableHead className="text-xs font-semibold">وضعیت</TableHead>
                  <TableHead className="text-xs font-semibold text-left">هزینه (واحد طلایی)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {log.date}
                    </TableCell>
                    <TableCell className="text-xs font-mono whitespace-nowrap" dir="ltr">
                      {log.phone}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {log.type}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell className="text-xs tabular-nums whitespace-nowrap" dir="ltr">
                      {log.cost > 0 ? log.cost.toLocaleString('fa-IR') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  Save All Settings                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="btn-gold-gradient min-w-[160px]"
        >
          {saving ? (
            <Loader2 className="size-4 ml-2 animate-spin" />
          ) : (
            <Settings className="size-4 ml-2" />
          )}
          ذخیره تنظیمات
        </Button>
      </div>
    </div>
  );
}
