'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Phone, ShieldCheck, Loader2, ArrowLeft, KeyRound, Lock, Eye, EyeOff, UserCog } from 'lucide-react';
import SmartCaptcha from '@/components/shared/SmartCaptcha';
import { useAppStore } from '@/lib/store';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: any) => void;
}

const formatTimer = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function LoginDialog({
  open,
  onOpenChange,
  onSuccess,
}: LoginDialogProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [timer, setTimer] = useState(120);
  const [error, setError] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const setUser = useAppStore((s) => s.setUser);
  const setPage = useAppStore((s) => s.setPage);
  const addToast = useAppStore((s) => s.addToast);

  /* ⚡ Super Admin Phone — auto-bypass captcha */
  const SUPER_ADMIN_PHONE = '09120000001';
  const isSuperAdminPhone = phone.replace(/\D/g, '') === SUPER_ADMIN_PHONE.replace(/\D/g, '');

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setTimer(120);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('لطفاً شماره موبایل معتبر وارد کنید');
      return;
    }
    if (captchaFailed) {
      setError('لطفاً ابتدا تایید هویت را تکمیل کنید');
      return;
    }
    setError('');
    setSending(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'خطا در ارسال کد تایید');
        return;
      }

      // Auto-detect role: if admin/super_admin, show password field
      setRequiresPassword(data.requiresPassword || false);
      setIsAdminUser(data.isAdmin || false);

      setStep('otp');
      startTimer();
    } catch {
      setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('لطفاً کد ۶ رقمی را کامل وارد کنید');
      return;
    }
    if (requiresPassword && !password) {
      setError('رمز عبور الزامی است');
      return;
    }
    setError('');
    setVerifying(true);

    try {
      const cleaned = phone.replace(/\D/g, '');
      const body: any = { phone: cleaned, code: otp };
      if (requiresPassword) {
        body.password = password;
      }

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'خطا در تایید کد');
        return;
      }

      const userData = {
        id: data.user.id,
        phone: data.user.phone,
        email: data.user.email,
        fullName: data.user.fullName,
        isVerified: true,
        isActive: true,
        avatar: data.user.avatar,
        referralCode: data.user.referralCode,
        role: data.user.role,
        sessionToken: data.token,
      };

      setUser(userData);
      onSuccess({ ...userData, isNewUser: data.isNewUser, token: data.token });
      onOpenChange(false);

      if (data.user.role === 'admin' || data.user.role === 'super_admin') {
        setPage('admin');
        addToast(`خوش آمدید ${data.user.fullName || 'مدیر سیستم'}!`, 'success');
      } else if (!data.isNewUser) {
        setPage('dashboard');
      }

      // Reset state
      setStep('phone');
      setPhone('');
      setOtp('');
      setPassword('');
      setError('');
      setRequiresPassword(false);
      setIsAdminUser(false);
      setShowPassword(false);
      clearTimer();
    } catch {
      setError('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setSending(true);
    setError('');

    try {
      const cleaned = phone.replace(/\D/g, '');
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'خطا در ارسال مجدد کد');
        return;
      }

      setRequiresPassword(data.requiresPassword || false);
      setIsAdminUser(data.isAdmin || false);
      setOtp('');
      startTimer();
    } catch {
      setError('خطا در ارتباط با سرور');
    } finally {
      setSending(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setPassword('');
    setError('');
    setRequiresPassword(false);
    setIsAdminUser(false);
    setShowPassword(false);
    clearTimer();
  };

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('phone');
      setPhone('');
      setOtp('');
      setPassword('');
      setError('');
      setRequiresPassword(false);
      setIsAdminUser(false);
      setShowPassword(false);
      clearTimer();
    }
    onOpenChange(isOpen);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 11) {
      setPhone(val);
      setError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (step === 'phone' && e.key === 'Enter' && !sending) {
      handleSendOtp();
    }
    if (step === 'otp' && e.key === 'Enter' && !verifying && otp.length === 6) {
      handleVerifyOtp();
    }
  };

  const displayPhone = phone.length > 0 ? `0${phone.slice(-10)}` : '';

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Gold accent top bar */}
        <div className="h-1.5 bg-gradient-to-l from-gold-dark via-gold to-gold-light" />

        <div className="p-6 pb-8">
          {/* ==================== STEP 1: Phone Input ==================== */}
          {step === 'phone' && (
            <div
              className="fade-scale-in"
              onKeyDown={handleKeyDown}
            >
              {/* Header */}
              <DialogHeader className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-gold-light/10 ring-1 ring-gold/30">
                  <Phone className="h-7 w-7 text-gold-dark" />
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  ورود به زرین گلد
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  شماره موبایل خود را وارد کنید
                </DialogDescription>
              </DialogHeader>

              {/* Phone Input */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="flex items-center gap-0">
                    <div className="flex items-center h-11 rounded-r-lg border border-l-0 border-input bg-muted/50 px-3 text-sm font-medium text-muted-foreground select-none shrink-0">
                      <span className="ltr:inline" dir="ltr">+98</span>
                    </div>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="۹۱۲۳۴۵۶۷۸۹"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="h-11 rounded-l-lg rounded-r-none text-left ltr:text-right font-mono tracking-widest text-base focus-visible:border-gold focus-visible:ring-gold/30 [&::placeholder]:tracking-normal [&::placeholder]:font-sans"
                      dir="ltr"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-xs text-destructive font-medium">
                    {error}
                  </p>
                )}

                {/* Smart Captcha — honeypot + math challenge (⚡ skip for super admin) */}
                {!isSuperAdminPhone && (
                  <SmartCaptcha
                    mode="full"
                    difficulty="easy"
                    onVerified={(token) => {
                      setCaptchaToken(token);
                      setCaptchaFailed(false);
                    }}
                    onFail={(reason) => {
                      setCaptchaFailed(true);
                    }}
                  />
                )}

                {/* Submit button */}
                <Button
                  onClick={handleSendOtp}
                  disabled={sending || phone.replace(/\D/g, '').length < 10 || (!captchaToken && !isSuperAdminPhone)}
                  className="w-full h-11 text-sm font-semibold bg-gradient-to-l from-gold-dark via-gold to-gold-light hover:from-gold hover:via-gold-light hover:to-gold-dark text-white shadow-md transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      <span>در حال ارسال...</span>
                    </>
                  ) : (
                    'ارسال کد تایید'
                  )}
                </Button>

                {/* Footer note */}
                <p className="text-center text-xs text-muted-foreground leading-relaxed mt-2">
                  با ورود به زرین گلد،{' '}
                  <a
                    href="#"
                    className="text-gold-dark hover:text-gold hover:underline underline-offset-2 transition-colors"
                  >
                    شرایط و قوانین
                  </a>{' '}
                  ما را می‌پذیرید.
                </p>
              </div>
            </div>
          )}

          {/* ==================== STEP 2: OTP + Password (if admin) ==================== */}
          {step === 'otp' && (
            <div
              className="fade-scale-in"
              onKeyDown={handleKeyDown}
            >
              {/* Header */}
              <DialogHeader className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-gold-light/10 ring-1 ring-gold/30">
                  <ShieldCheck className="h-7 w-7 text-gold-dark" />
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  کد تایید را وارد کنید
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  کد ۶ رقمی ارسال شده به شماره{' '}
                  <span className="font-semibold text-foreground" dir="ltr">
                    {displayPhone}
                  </span>{' '}
                  را وارد کنید
                </DialogDescription>
              </DialogHeader>

              {/* Admin badge */}
              {isAdminUser && (
                <div className="flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-lg bg-gold/10 border border-gold/20">
                  <UserCog className="h-4 w-4 text-gold-dark" />
                  <span className="text-xs font-medium text-gold-dark">
                    دسترسی مدیریتی شناسایی شد — رمز عبور الزامی است
                  </span>
                </div>
              )}

              <div className="space-y-5">
                {/* OTP Input */}
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => {
                      setOtp(value);
                      setError('');
                    }}
                    autoFocus
                  >
                    <InputOTPGroup className="gap-2.5">
                      <InputOTPSlot
                        index={0}
                        className="h-14 w-12 rounded-xl text-lg font-bold border-2 data-[active=true]:border-gold data-[active=true]:ring-gold/20 data-[active=true]:ring-[4px] data-[active=true]:shadow-lg data-[active=true]:shadow-gold/10 transition-all duration-200 [&]:border-gold/30 focus-visible:border-gold focus-visible:ring-gold/30"
                      />
                      <InputOTPSlot
                        index={1}
                        className="h-14 w-12 rounded-xl text-lg font-bold border-2 data-[active=true]:border-gold data-[active=true]:ring-gold/20 data-[active=true]:ring-[4px] data-[active=true]:shadow-lg data-[active=true]:shadow-gold/10 transition-all duration-200 [&]:border-gold/30 focus-visible:border-gold focus-visible:ring-gold/30"
                      />
                      <InputOTPSlot
                        index={2}
                        className="h-14 w-12 rounded-xl text-lg font-bold border-2 data-[active=true]:border-gold data-[active=true]:ring-gold/20 data-[active=true]:ring-[4px] data-[active=true]:shadow-lg data-[active=true]:shadow-gold/10 transition-all duration-200 [&]:border-gold/30 focus-visible:border-gold focus-visible:ring-gold/30"
                      />
                    </InputOTPGroup>
                    <InputOTPSeparator className="mx-3 text-gold/40" />
                    <InputOTPGroup className="gap-2.5">
                      <InputOTPSlot
                        index={3}
                        className="h-14 w-12 rounded-xl text-lg font-bold border-2 data-[active=true]:border-gold data-[active=true]:ring-gold/20 data-[active=true]:ring-[4px] data-[active=true]:shadow-lg data-[active=true]:shadow-gold/10 transition-all duration-200 [&]:border-gold/30 focus-visible:border-gold focus-visible:ring-gold/30"
                      />
                      <InputOTPSlot
                        index={4}
                        className="h-14 w-12 rounded-xl text-lg font-bold border-2 data-[active=true]:border-gold data-[active=true]:ring-gold/20 data-[active=true]:ring-[4px] data-[active=true]:shadow-lg data-[active=true]:shadow-gold/10 transition-all duration-200 [&]:border-gold/30 focus-visible:border-gold focus-visible:ring-gold/30"
                      />
                      <InputOTPSlot
                        index={5}
                        className="h-14 w-12 rounded-xl text-lg font-bold border-2 data-[active=true]:border-gold data-[active=true]:ring-gold/20 data-[active=true]:ring-[4px] data-[active=true]:shadow-lg data-[active=true]:shadow-gold/10 transition-all duration-200 [&]:border-gold/30 focus-visible:border-gold focus-visible:ring-gold/30"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* Password field (only shown for admin/super_admin) */}
                {requiresPassword && (
                  <div className="page-transition">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        رمز عبور مدیریتی
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="رمز عبور"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                          }}
                          className="h-11 pl-11 pr-4 font-mono text-base focus-visible:border-gold focus-visible:ring-gold/30"
                          dir="ltr"
                          autoFocus={false}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        ورود به پنل مدیریت نیازمند رمز عبور است
                      </p>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <p className="text-center text-xs text-destructive font-medium">
                    {error}
                  </p>
                )}

                {/* Timer & actions */}
                <div className="flex flex-col items-center gap-3">
                  {timer > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <KeyRound className="h-4 w-4 text-gold" />
                      <span>
                        ارسال مجدد تا{' '}
                        <span className="font-mono font-semibold text-gold-dark tabular-nums" dir="ltr">
                          {formatTimer(timer)}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={sending}
                      className="text-sm font-semibold text-gold-dark hover:text-gold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {sending ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          در حال ارسال...
                        </span>
                      ) : (
                        'ارسال مجدد کد تایید'
                      )}
                    </button>
                  )}
                </div>

                {/* Edit phone link */}
                <button
                  onClick={handleBackToPhone}
                  className="flex items-center gap-1.5 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  ویرایش شماره
                </button>

                {/* Verify button */}
                <Button
                  onClick={handleVerifyOtp}
                  disabled={
                    verifying ||
                    otp.length !== 6 ||
                    (requiresPassword && !password)
                  }
                  className="w-full h-11 text-sm font-semibold bg-gradient-to-l from-gold-dark via-gold to-gold-light hover:from-gold hover:via-gold-light hover:to-gold-dark text-white shadow-md transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="animate-spin" />
                      <span>در حال تایید...</span>
                    </>
                  ) : isAdminUser ? (
                    <>
                      <Lock className="h-4 w-4" />
                      تایید و ورود به پنل مدیریت
                    </>
                  ) : (
                    'تایید و ورود'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>


    </Dialog>
  );
}
