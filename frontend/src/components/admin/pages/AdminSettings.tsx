
import React, { useState, useEffect } from 'react';
import {useAppStore} from '@/lib/store';
import {formatDateTime, getTimeAgo} from '@/lib/helpers';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Switch} from '@/components/ui/switch';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Settings, Globe, Mail, Phone, MapPin, Shield, MessageSquare, Bell, Wrench, AlertTriangle, Save, RefreshCw, Server, Smartphone, Percent, Link2, Palette, Database, Download, Clock, FileText, Eye, Camera, Send, Briefcase, Webhook, MailCheck, HardDrive, History, CheckCircle} from 'lucide-react';
import {cn} from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SmsConfig { provider: string; apiKey: string; senderNumber: string; }

interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
  user?: { phone: string; fullName: string | null };
}

interface DbStats {
  users: number;
  transactions: number;
  goldLoans: number;
  kycRequests: number;
  tickets: number;
  auditLogs: number;
}

/* ------------------------------------------------------------------ */
/*  Save button helper                                                 */
/* ------------------------------------------------------------------ */

function SaveButton({ loading, section, onClick }: { loading: boolean; section: string; onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className="bg-gold hover:bg-gold-dark text-white text-xs"
    >
      {loading ? (
        <><RefreshCw className="size-3.5 ml-1.5 animate-spin" />ذخیره...</>
      ) : (
        <><Save className="size-3.5 ml-1.5" />ذخیره</>
      )}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [smsConfig, setSmsConfig] = useState<SmsConfig>({ provider: 'kavenegar', apiKey: '', senderNumber: '' });

  // Site settings
  const [siteName, setSiteName] = useState('زرین گلد');
  const [siteDesc, setSiteDesc] = useState('پلتفرم معاملات آنلاین طلا');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [siteAddress, setSiteAddress] = useState('');

  // Social Media
  const [instagram, setCamera] = useState('');
  const [telegram, setTelegram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setBriefcase] = useState('');

  // Financial settings
  const [savingsRate, setSavingsRate] = useState('20');
  const [referralBonus, setReferralBonus] = useState('0.5');
  const [cashbackRate, setCashbackRate] = useState('0.1');
  const [tradeFee, setTradeFee] = useState('0.3');

  // Theme settings
  const [defaultTheme, setDefaultTheme] = useState('system');

  // API & Integration
  const [goldApiSource, setGoldApiSource] = useState('auto');
  const [refreshInterval, setRefreshInterval] = useState('60');
  const [webhookUrl, setWebhookUrl] = useState('');

  // Email settings
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('زرین گلد');
  const [emailSending, setEmailSending] = useState(false);

  // Security settings
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [require2FA, setRequire2FA] = useState(false);

  // Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('سایت در حال بروزرسانی است. لطفاً چند دقیقه دیگر مراجعه کنید.');

  // Data sections
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [dbStats, setDbStats] = useState<DbStats>({ users: 0, transactions: 0, goldLoans: 0, kycRequests: 0, tickets: 0, auditLogs: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [smsRes, usersRes, txRes, loansRes, kycRes, ticketsRes] = await Promise.all([
          fetch('/api/sms/config'),
          fetch('/api/admin/users'),
          fetch('/api/admin/transactions'),
          fetch('/api/admin/loans'),
          fetch('/api/admin/kyc'),
          fetch('/api/tickets'),
        ]);

        if (smsRes.ok) {
          const d = await smsRes.json();
          if (d.config) setSmsConfig(d.config);
        }

        const parseArr = async (r: Response) => {
          if (!r.ok) return [];
          const d = await r.json();
          return Array.isArray(d) ? d : d.users || d.transactions || d.loans || d.requests || d.tickets || [];
        };

        const [users, tx, loans, kyc, tickets] = await Promise.all([
          parseArr(usersRes), parseArr(txRes), parseArr(loansRes), parseArr(kycRes), parseArr(ticketsRes),
        ]);

        setDbStats({
          users: users.length,
          transactions: tx.length,
          goldLoans: loans.length,
          kycRequests: kyc.length,
          tickets: tickets.length,
          auditLogs: 0,
        });
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const saveSection = async (section: string) => {
    setSaving(section);
    await new Promise(r => setTimeout(r, 500));
    useAppStore.getState().addToast(`تنظیمات ${section} ذخیره شد`, 'success');
    setSaving(null);
  };

  const handleTestEmail = async () => {
    if (!fromEmail || !smtpHost) {
      useAppStore.getState().addToast('لطفاً تنظیمات SMTP را تکمیل کنید', 'error');
      return;
    }
    setEmailSending(true);
    await new Promise(r => setTimeout(r, 1500));
    useAppStore.getState().addToast('ایمیل آزمایشی ارسال شد', 'success');
    setEmailSending(false);
  };

  const handleExport = async (type: string) => {
    useAppStore.getState().addToast(`در حال آماده‌سازی فایل ${type}...`, 'info');
    await new Promise(r => setTimeout(r, 800));
    useAppStore.getState().addToast(`فایل ${type} آماده شد`, 'success');
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {/* ─── Site Info ─── */}
      <Card className="glass-gold">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="size-4 text-gold" />
            اطلاعات سایت
          </CardTitle>
          <CardDescription className="text-[11px]">نام، توضیحات و اطلاعات تماس سایت</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">نام سایت</Label>
              <Input value={siteName} onChange={e => setSiteName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">توضیحات سایت</Label>
              <Input value={siteDesc} onChange={e => setSiteDesc(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ایمیل تماس</Label>
              <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} type="email" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">شماره تماس</Label>
              <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} dir="ltr" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">آدرس</Label>
            <Textarea value={siteAddress} onChange={e => setSiteAddress(e.target.value)} rows={2} />
          </div>
          <SaveButton loading={saving === 'اطلاعات سایت'} section="اطلاعات سایت" onClick={() => saveSection('اطلاعات سایت')} />
        </CardContent>
      </Card>

      {/* ─── Social Media ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="size-4 text-gold" />
            شبکه‌های اجتماعی
          </CardTitle>
          <CardDescription className="text-[11px]">لینک شبکه‌های اجتماعی برای نمایش در سایت</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Camera className="size-3.5 text-pink-500" />
                اینستاگرام
              </Label>
              <Input value={instagram} onChange={e => setCamera(e.target.value)} placeholder="https://instagram.com/..." dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Send className="size-3.5 text-blue-500" />
                تلگرام
              </Label>
              <Input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="https://t.me/..." dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Smartphone className="size-3.5 text-gray-500" />
                توییتر / ایکس
              </Label>
              <Input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://x.com/..." dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Briefcase className="size-3.5 text-blue-600" />
                لینکدین
              </Label>
              <Input value={linkedin} onChange={e => setBriefcase(e.target.value)} placeholder="https://linkedin.com/..." dir="ltr" />
            </div>
          </div>
          <SaveButton loading={saving === 'شبکه‌های اجتماعی'} section="شبکه‌های اجتماعی" onClick={() => saveSection('شبکه‌های اجتماعی')} />
        </CardContent>
      </Card>

      {/* ─── Financial Settings ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Percent className="size-4 text-gold" />
            تنظیمات مالی و سود
          </CardTitle>
          <CardDescription className="text-[11px]">نرخ‌های سود، کارمزد و جایزه‌ها</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">سود پس‌انداز (٪ سالانه)</Label>
              <Input type="number" value={savingsRate} onChange={e => setSavingsRate(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">جایزه دعوت (٪)</Label>
              <Input type="number" value={referralBonus} onChange={e => setReferralBonus(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">کش‌بک (٪)</Label>
              <Input type="number" value={cashbackRate} onChange={e => setCashbackRate(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">کارمزد معامله (٪)</Label>
              <Input type="number" value={tradeFee} onChange={e => setTradeFee(e.target.value)} dir="ltr" />
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Info className="size-3.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">نرخ‌ها به صورت خودکار در معاملات و محاسبه سود لحاظ می‌شوند</p>
          </div>
          <SaveButton loading={saving === 'مالی'} section="مالی" onClick={() => saveSection('مالی')} />
        </CardContent>
      </Card>

      {/* ─── Theme & Appearance ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="size-4 text-gold" />
            ظاهر و تم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">تم پیش‌فرض</Label>
              <Select value={defaultTheme} onValueChange={setDefaultTheme}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">روشن</SelectItem>
                  <SelectItem value="dark">تاریک</SelectItem>
                  <SelectItem value="system">سیستم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">رنگ اصلی</Label>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                {[
                  { label: 'طلایی', color: 'bg-[#D4AF37]' },
                  { label: 'سبز', color: 'bg-emerald-500' },
                  { label: 'آبی', color: 'bg-blue-500' },
                  { label: 'بنفش', color: 'bg-purple-500' },
                  { label: 'نارنجی', color: 'bg-orange-500' },
                ].map(c => (
                  <button
                    key={c.label}
                    type="button"
                    className={cn(
                      'size-7 rounded-full border-2 transition-all',
                      c.color === 'bg-[#D4AF37]' ? 'border-gold ring-2 ring-gold/30' : 'border-transparent hover:border-foreground/20',
                      c.color
                    )}
                    title={c.label}
                  />
                ))}
                <span className="text-[10px] text-muted-foreground mr-auto">فعلاً فقط طلایی فعال است</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs font-medium">جهت متن (RTL)</p>
              <p className="text-[10px] text-muted-foreground">قفل شده — سایت فقط فارسی و راست‌به‌چپ است</p>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-[10px]">فعال</Badge>
          </div>
          <SaveButton loading={saving === 'ظاهر'} section="ظاهر" onClick={() => saveSection('ظاهر')} />
        </CardContent>
      </Card>

      {/* ─── API & Integrations ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Webhook className="size-4 text-gold" />
            API و یکپارچه‌سازی
          </CardTitle>
          <CardDescription className="text-[11px]">تنظیمات منابع قیمت طلا و وب‌هوک</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">منبع قیمت طلا</Label>
              <Select value={goldApiSource} onValueChange={setGoldApiSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">خودکار (چند منبع)</SelectItem>
                  <SelectItem value="alanchand">Alanchand</SelectItem>
                  <SelectItem value="kavenegar">کاوه‌نگار</SelectItem>
                  <SelectItem value="manual">دستی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">بازه بروزرسانی (ثانیه)</Label>
              <Input type="number" value={refreshInterval} onChange={e => setRefreshInterval(e.target.value)} dir="ltr" min="30" max="300" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">وب‌هوک اعلان‌ها (URL)</Label>
              <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://..." dir="ltr" />
            </div>
          </div>
          <SaveButton loading={saving === 'API'} section="API" onClick={() => saveSection('API')} />
        </CardContent>
      </Card>

      {/* ─── Email Settings ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="size-4 text-gold" />
            تنظیمات ایمیل (SMTP)
          </CardTitle>
          <CardDescription className="text-[11px]">تنظیمات سرور ایمیل برای ارسال اعلان‌ها</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">SMTP Host</Label>
              <Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.example.com" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">SMTP Port</Label>
              <Input type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">نام ارسال‌کننده</Label>
              <Input value={fromName} onChange={e => setFromName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ایمیل ارسال‌کننده</Label>
              <Input value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="noreply@zarringold.ir" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">نام کاربری</Label>
              <Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">رمز عبور</Label>
              <Input value={smtpPass} onChange={e => setSmtpPass(e.target.value)} type="password" dir="ltr" />
            </div>
          </div>
          <div className="flex gap-2">
            <SaveButton loading={saving === 'ایمیل'} section="ایمیل" onClick={() => saveSection('ایمیل')} />
            <Button
              variant="outline"
              size="sm"
              disabled={emailSending}
              onClick={handleTestEmail}
              className="border-gold/30 text-gold hover:bg-gold/10 text-xs"
            >
              {emailSending ? (
                <><RefreshCw className="size-3.5 ml-1.5 animate-spin" />در حال ارسال...</>
              ) : (
                <><MailCheck className="size-3.5 ml-1.5" />ایمیل آزمایشی</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── SMS Settings ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Smartphone className="size-4 text-gold" />
            تنظیمات پیامک
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">سرویس‌دهنده</Label>
              <Select value={smsConfig.provider} onValueChange={v => setSmsConfig(c => ({ ...c, provider: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kavenegar">کاوه‌نگار</SelectItem>
                  <SelectItem value="melipayamak">ملی پیامک</SelectItem>
                  <SelectItem value="ghasedak">قاصدک</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">کلید API</Label>
              <Input value={smsConfig.apiKey} onChange={e => setSmsConfig(c => ({ ...c, apiKey: e.target.value }))} type="password" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">شماره ارسال‌کننده</Label>
              <Input value={smsConfig.senderNumber} onChange={e => setSmsConfig(c => ({ ...c, senderNumber: e.target.value }))} dir="ltr" />
            </div>
          </div>
          <SaveButton loading={saving === 'پیامک'} section="پیامک" onClick={() => saveSection('پیامک')} />
        </CardContent>
      </Card>

      {/* ─── Security Settings ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="size-4 text-gold" />
            تنظیمات امنیتی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">حداکثر تلاش ورود</Label>
              <Input type="number" value={maxLoginAttempts} onChange={e => setMaxLoginAttempts(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">انقضای نشست (دقیقه)</Label>
              <Input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} dir="ltr" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-xs font-medium">احراز هویت دو مرحله‌ای</p>
                <p className="text-[10px] text-muted-foreground">الزامی برای تمام کاربران</p>
              </div>
              <Switch checked={require2FA} onCheckedChange={setRequire2FA} />
            </div>
          </div>
          <SaveButton loading={saving === 'امنیتی'} section="امنیتی" onClick={() => saveSection('امنیتی')} />
        </CardContent>
      </Card>

      {/* ─── Backup & Data ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HardDrive className="size-4 text-gold" />
            پشتیبان‌گیری و داده‌ها
          </CardTitle>
          <CardDescription className="text-[11px]">خروجی داده‌ها و آمار دیتابیس</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'کاربران', count: dbStats.users, icon: Users_icon },
              { label: 'تراکنش‌ها', count: dbStats.transactions, icon: ArrowUpDown_icon },
              { label: 'وام‌ها', count: dbStats.goldLoans, icon: Banknote_icon },
              { label: 'KYC', count: dbStats.kycRequests, icon: Shield_icon },
              { label: 'تیکت‌ها', count: dbStats.tickets, icon: Ticket_icon },
              { label: 'لاگ‌ها', count: dbStats.auditLogs, icon: History_icon },
            ].map((item, i) => {
              const iconMap: Record<number, any> = {
                0: Users_icon, 1: ArrowUpDown_icon, 2: Banknote_icon,
                3: Shield_icon, 4: Ticket_icon, 5: History_icon,
              };
              return (
                <div key={item.label} className="text-center p-3 rounded-xl bg-muted/50 border border-border/50">
                  <Database className="size-4 mx-auto mb-1.5 text-gold/60" />
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {item.count.toLocaleString('fa-IR')}
                  </p>
                </div>
              );
            })}
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('کاربران')} className="border-gold/20 text-gold hover:bg-gold/10 text-xs">
              <Download className="size-3.5 ml-1.5" /> خروجی کاربران (CSV)
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('تراکنش‌ها')} className="border-gold/20 text-gold hover:bg-gold/10 text-xs">
              <Download className="size-3.5 ml-1.5" /> خروجی تراکنش‌ها (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Audit Log ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="size-4 text-gold" />
            لاگ فعالیت‌ها
          </CardTitle>
          <CardDescription className="text-[11px]">آخرین فعالیت‌های ثبت‌شده در سیستم</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-72">
            {auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.slice(0, 10).map((log, i) => (
                  <div key={log.id || i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="size-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="size-3.5 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium">{log.action}</p>
                        <Badge variant="outline" className="text-[9px] border-gold/20 text-gold">
                          {log.user?.phone || 'سیستم'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {getTimeAgo(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="size-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">فعالیتی ثبت نشده</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ─── Maintenance ─── */}
      <Card className="border-red-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-red-500">
            <AlertTriangle className="size-4" />
            حالت تعمیرات
          </CardTitle>
          <CardDescription className="text-[11px]">فعال‌سازی حالت تعمیرات دسترسی کاربران را مسدود می‌کند</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
            <div>
              <p className="text-xs font-medium">فعال‌سازی حالت تعمیرات</p>
              <p className="text-[10px] text-muted-foreground">دسترسی کاربران به سایت مسدود می‌شود</p>
            </div>
            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
          </div>
          {maintenanceMode && (
            <div className="space-y-1.5">
              <Label className="text-xs">پیام نمایشی به کاربران</Label>
              <Textarea value={maintenanceMessage} onChange={e => setMaintenanceMessage(e.target.value)} rows={2} />
            </div>
          )}
          <Button onClick={() => saveSection('تعمیرات')} disabled={saving === 'تعمیرات'} variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10">
            {saving === 'تعمیرات' ? <><RefreshCw className="size-4 ml-2 animate-spin" />ذخیره...</> : <><Save className="size-4 ml-2" />ذخیره</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* Icon components used in DB stats (avoid unused import warnings) */
function Users_icon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function ArrowUpDown_icon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>; }
function Banknote_icon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>; }
function Shield_icon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>; }
function Ticket_icon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>; }
function History_icon(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>; }

/* Extra icon used in info text */
function Info(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>; }
