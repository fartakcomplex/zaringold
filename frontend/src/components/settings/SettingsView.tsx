
import React, { useState } from 'react';
import {useTheme} from 'next-themes';
import {useAppStore} from '@/lib/store';
import {usePageEvent} from '@/hooks/use-page-event';
import {useTranslation} from '@/lib/i18n';
import SmsSettings from '@/components/sms/SmsSettings';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Separator} from '@/components/ui/separator';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {cn} from '@/lib/utils';
import {Settings, Moon, Sun, Globe, Bell, Shield, Volume2, VolumeX, Info, ExternalLink, Trash2, LogOut, Smartphone, ChevronLeft, AlertTriangle, User} from 'lucide-react';
import {AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter, AlertDialogDescription, AlertDialogAction, AlertDialogCancel} from '@/components/ui/alert-dialog';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { user, addToast, setPage, reset } = useAppStore();
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    trade: true,
    login: true,
    price: false,
    promo: false,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  /* ── Quick Action Event Listeners ── */
  usePageEvent('security', () => { setActiveTab('general'); addToast('بخش امنیت', 'info'); });
  usePageEvent('privacy', () => { setActiveTab('notifications'); addToast('حریم خصوصی', 'info'); });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    addToast(`اعلان ${value ? 'فعال' : 'غیرفعال'} شد`, 'info');
  };

  const handleDeleteAccount = () => {
    addToast('درخواست حذف حساب ثبت شد. با پشتیبانی تماس بگیرید.', 'info');
    setDeleteDialogOpen(false);
  };

  const handleLogout = () => {
    reset();
    setPage('landing');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">تنظیمات</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="general" className={cn("text-xs sm:text-sm", activeTab === "general" && "tab-active-gold")}>عمومی</TabsTrigger>
          <TabsTrigger value="notifications" className={cn("text-xs sm:text-sm", activeTab === "notifications" && "tab-active-gold")}>اعلان‌ها</TabsTrigger>
          <TabsTrigger value="sms" className={cn("text-xs sm:text-sm", activeTab === "sms" && "tab-active-gold")}>پنل پیامکی</TabsTrigger>
        </TabsList>

        {/* ─── General Tab ─── */}
        <TabsContent value="general" className="space-y-6">
          {/* Appearance */}
          <Card className="card-gold-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <Settings className="size-4 text-[#D4AF37]" />
                </div>
                {locale === 'en' ? 'Appearance' : 'ظاهر'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    {theme === 'dark' ? <Moon className="size-5 text-[#D4AF37]" /> : <Sun className="size-5 text-[#D4AF37]" />}
                  </div>
                  <div>
                    <p className="font-medium">{locale === 'en' ? 'Dark Mode' : 'حالت تاریک'}</p>
                    <p className="text-sm text-muted-foreground">{locale === 'en' ? 'Toggle between light and dark theme' : 'تغییر تم برنامه بین روشن و تاریک'}</p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  className="data-[state=checked]:bg-[#D4AF37]"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    <Globe className="size-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="font-medium">{locale === 'en' ? 'Language' : 'زبان'}</p>
                    <p className="text-sm text-muted-foreground">{locale === 'en' ? 'Display language' : 'زبان نمایش برنامه'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gold/20 text-gold">فارسی</Badge>
                  <Badge variant="outline" className="text-muted-foreground cursor-not-allowed opacity-50">
                    English
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account */}
          <Card className="card-gold-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <User className="size-4 text-[#D4AF37]" />
                </div>
                {locale === 'en' ? 'Account' : 'حساب کاربری'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{locale === 'en' ? 'Account Status' : 'وضعیت حساب'}</p>
                  <p className="text-xs text-muted-foreground">{locale === 'en' ? 'Your account is active' : 'حساب شما فعال است'}</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-500">{locale === 'en' ? 'Active' : 'فعال'}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{locale === 'en' ? 'Verification' : 'احراز هویت'}</p>
                  <p className="text-xs text-muted-foreground">{locale === 'en' ? 'Manage verification status' : 'مدیریت وضعیت احراز هویت'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPage('profile')} className="text-gold">
                  مشاهده <ChevronLeft className="size-4 mr-1" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">شماره موبایل</p>
                  <p className="text-xs text-muted-foreground">{user?.phone || '---'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="card-gold-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <Shield className="size-4 text-[#D4AF37]" />
                </div>
                {locale === 'en' ? 'Security' : 'امنیت'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{locale === 'en' ? 'Two-Factor Auth' : 'تأیید دو مرحله‌ای'}</p>
                  <p className="text-xs text-muted-foreground">{locale === 'en' ? 'Increase account security' : 'افزایش امنیت ورود به حساب'}</p>
                </div>
                <Switch className="data-[state=checked]:bg-[#D4AF37]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{locale === 'en' ? 'Change Password' : 'تغییر رمز عبور'}</p>
                  <p className="text-xs text-muted-foreground">{locale === 'en' ? 'Update your password' : 'رمز عبور خود را به‌روزرسانی کنید'}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-[#D4AF37] hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/10">
                  تغییر <ChevronLeft className="size-4 mr-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/30 shadow-sm shadow-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10">
                  <AlertTriangle className="size-4" />
                </div>
                {locale === 'en' ? 'Danger Zone' : 'منطقه خطر'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{locale === 'en' ? 'Logout' : 'خروج از حساب'}</p>
                  <p className="text-sm text-muted-foreground">{locale === 'en' ? 'Secure logout' : 'خروج امن از حساب کاربری'}</p>
                </div>
                <Button variant="outline" className="btn-danger-outline" onClick={handleLogout}>
                  <LogOut className="size-4 ml-2" />
                  {locale === 'en' ? 'Logout' : 'خروج'}
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-500">{locale === 'en' ? 'Delete Account' : 'حذف حساب'}</p>
                  <p className="text-sm text-muted-foreground">{locale === 'en' ? 'Permanently delete your account and all data' : 'حذف دائمی حساب و تمامی اطلاعات'}</p>
                </div>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10">
                      <Trash2 className="size-4 ml-2" />
                      {locale === 'en' ? 'Delete Account' : 'حذف حساب'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-500">{locale === 'en' ? 'Delete Account' : 'حذف حساب کاربری'}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {locale === 'en' ? 'Are you sure? This action cannot be undone and all your data will be deleted.' : 'آیا مطمئن هستید؟ این عمل قابل بازگشت نیست و تمامی اطلاعات شما حذف خواهد شد.'}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                      <AlertDialogCancel variant="outline">{locale === 'en' ? 'Cancel' : 'انصراف'}</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-500 text-white hover:bg-red-600" onClick={handleDeleteAccount}>
                        {locale === 'en' ? 'Yes, Delete' : 'بله، حذف شود'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Notifications Tab ─── */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="card-gold-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <Bell className="size-4 text-[#D4AF37]" />
                </div>
                {locale === 'en' ? 'Notifications' : 'اعلان‌ها'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Volume2 className="size-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{locale === 'en' ? 'Trade Notifications' : 'اعلان معاملات'}</p>
                    <p className="text-xs text-muted-foreground">{locale === 'en' ? 'Notify about successful trades' : 'اطلاع از خرید و فروش‌های موفق'}</p>
                  </div>
                </div>
                <Switch checked={notifications.trade} onCheckedChange={(v) => handleNotificationChange('trade', v)} className="data-[state=checked]:bg-[#D4AF37]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Smartphone className="size-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{locale === 'en' ? 'Login Notifications' : 'اعلان ورود'}</p>
                    <p className="text-xs text-muted-foreground">{locale === 'en' ? 'Notify about account logins' : 'اطلاع از ورود به حساب کاربری'}</p>
                  </div>
                </div>
                <Switch checked={notifications.login} onCheckedChange={(v) => handleNotificationChange('login', v)} className="data-[state=checked]:bg-[#D4AF37]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Info className="size-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{locale === 'en' ? 'Price Alerts' : 'هشدار قیمت'}</p>
                    <p className="text-xs text-muted-foreground">{locale === 'en' ? 'Notify about important price changes' : 'اطلاع از تغییرات مهم قیمت طلا'}</p>
                  </div>
                </div>
                <Switch checked={notifications.price} onCheckedChange={(v) => handleNotificationChange('price', v)} className="data-[state=checked]:bg-[#D4AF37]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <VolumeX className="size-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{locale === 'en' ? 'Promotional Notifications' : 'اعلان‌های تبلیغاتی'}</p>
                    <p className="text-xs text-muted-foreground">{locale === 'en' ? 'Notify about discounts and special offers' : 'اطلاع از تخفیف‌ها و پیشنهادات ویژه'}</p>
                  </div>
                </div>
                <Switch checked={notifications.promo} onCheckedChange={(v) => handleNotificationChange('promo', v)} className="data-[state=checked]:bg-[#D4AF37]" />
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="card-gold-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <Info className="size-4 text-[#D4AF37]" />
                </div>
                {locale === 'en' ? 'About Us' : 'درباره ما'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{locale === 'en' ? 'App Version' : 'نسخه برنامه'}</span>
                <Badge variant="outline">۱.۰.۰</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{locale === 'en' ? 'Terms & Conditions' : 'قوانین و مقررات'}</span>
                <ExternalLink className="size-4 text-gold cursor-pointer" />
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{locale === 'en' ? 'Privacy Policy' : 'حریم خصوصی'}</span>
                <ExternalLink className="size-4 text-gold cursor-pointer" />
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{locale === 'en' ? 'Contact Us' : 'تماس با ما'}</span>
                <Badge variant="outline" className="text-xs">support@zarringold.ir</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── SMS Panel Tab ─── */}
        <TabsContent value="sms">
          <SmsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
