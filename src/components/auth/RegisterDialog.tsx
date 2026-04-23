'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserPlus, Mail, Gift, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface RegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  user: any;
}

export default function RegisterDialog({
  open,
  onOpenChange,
  onComplete,
  user,
}: RegisterDialogProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const setUser = useAppStore((s) => s.setUser);
  const setPage = useAppStore((s) => s.setPage);

  const validateEmail = (value: string): boolean => {
    if (!value) return true; // optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async () => {
    const newErrors: { fullName?: string; email?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'نام و نام خانوادگی الزامی است';
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = 'نام باید حداقل ۳ حرف باشد';
    }

    if (!validateEmail(email)) {
      newErrors.email = 'فرمت ایمیل نامعتبر است';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fullName: fullName.trim(),
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setErrors({ fullName: data.message || 'خطا در ثبت اطلاعات' });
        return;
      }

      // Update Zustand store with updated user data
      setUser({
        ...user,
        fullName: fullName.trim(),
        email: email.trim() || undefined,
      });

      onOpenChange(false);
      onComplete();
      setPage('dashboard');
    } catch {
      setErrors({ fullName: 'خطا در ارتباط با سرور' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitting) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Gold accent top bar */}
        <div className="h-1.5 bg-gradient-to-l from-gold-dark via-gold to-gold-light" />

        <div
          className="p-6 pb-8 fade-scale-in"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <DialogHeader className="text-center mb-8">
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-gold-light/10 ring-1 ring-gold/30">
              <UserPlus className="h-7 w-7 text-gold-dark" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              تکمیل ثبت‌نام
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 text-sm leading-relaxed">
              اطلاعات خود را وارد تا معاملات طلا را شروع کنید
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <div className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className="text-sm font-medium text-foreground"
              >
                نام و نام خانوادگی
                <span className="text-destructive mr-1">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="fullName"
                  type="text"
                  placeholder="مثلاً: علی محمدی"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                  className={`h-11 pr-10 text-sm transition-all duration-200 ${
                    errors.fullName
                      ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'
                      : 'focus-visible:border-gold focus-visible:ring-gold/30'
                  }`}
                  autoFocus
                />
                <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              </div>
              {errors.fullName && (
                <p className="text-xs text-destructive font-medium">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                ایمیل
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  dir="ltr"
                  className={`h-11 pr-10 pl-3 text-left text-sm transition-all duration-200 ${
                    errors.email
                      ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'
                      : 'focus-visible:border-gold focus-visible:ring-gold/30'
                  }`}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Referral Code */}
            <div className="space-y-2">
              <Label
                htmlFor="referralCode"
                className="text-sm font-medium text-foreground"
              >
                کد دعوت
              </Label>
              <div className="relative">
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="کد دعوت (اختیاری)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  dir="ltr"
                  className="h-11 pr-10 pl-3 text-left tracking-widest font-mono text-sm uppercase focus-visible:border-gold focus-visible:ring-gold/30 transition-all duration-200"
                  maxLength={10}
                />
                <Gift className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              </div>
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed">
                <Sparkles className="h-3 w-3 mt-0.5 text-gold shrink-0" />
                <span>با کد دعوت دوستانتان جایزه بگیرید</span>
              </p>
            </div>

            {/* Submit button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || !fullName.trim()}
              className="w-full h-11 text-sm font-semibold bg-gradient-to-l from-gold-dark via-gold to-gold-light hover:from-gold hover:via-gold-light hover:to-gold-dark text-white shadow-md transition-all duration-300 hover:shadow-lg disabled:opacity-50 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>در حال ثبت...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  شروع معاملات
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
