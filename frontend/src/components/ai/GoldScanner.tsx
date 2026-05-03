
import React, { useState, useRef, useCallback } from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Camera, Upload, Scale, Gem, Sparkles, RefreshCw, AlertCircle, ImageIcon} from 'lucide-react';

interface GoldAnalysis {
  type: string;
  karat: string;
  weightGrams: string;
  estimatedValueRial: string;
  description: string;
  confidence: number;
  tips: string[];
}

type ScanState = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

export default function GoldScanner() {
  const [state, setState] = useState<ScanState>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<GoldAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('لطفاً فقط فایل تصویری (JPG, PNG, WebP) آپلود کنید.');
      setState('error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.');
      setState('error');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);

    setState('analyzing');
    setErrorMsg('');
    setAnalysis(null);

    try {
      // Convert to base64
      const base64Reader = new FileReader();
      base64Reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        try {
          const response = await fetch('/api/gold-scanner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });

          const data = await response.json();

          if (data.success && data.analysis) {
            setAnalysis(data.analysis);
            setState('success');
          } else {
            setErrorMsg(data.error || 'خطا در تحلیل تصویر. لطفاً دوباره تلاش کنید.');
            setState('error');
          }
        } catch {
          setErrorMsg('خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
          setState('error');
        }
      };
      base64Reader.readAsDataURL(file);
    } catch {
      setErrorMsg('خطا در خواندن فایل.');
      setState('error');
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleReset = () => {
    setState('idle');
    setImagePreview(null);
    setAnalysis(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-8 sm:p-6" dir="rtl">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8960C] shadow-lg shadow-[#D4AF37]/20">
          <Camera className="size-5 text-white" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            عکس‌سنج طلا
          </h1>
          <p className="text-sm text-muted-foreground">
            تحلیل هوشمند تصویر جواهرات با هوش مصنوعی
          </p>
        </div>
        <Badge className="mr-auto bg-gradient-to-l from-[#8B5CF6] to-[#A78BFA] text-white border-0 text-xs font-medium px-3 py-1 shadow-sm shadow-[#8B5CF6]/30">
          <Sparkles className="ms-1.5 size-3" />
          هوش مصنوعی
        </Badge>
      </div>

      {/* ─── Upload Zone ─── */}
      {(state === 'idle' || state === 'error') && (
        <Card
          id="gs-scan"
          className="overflow-hidden border-2 border-dashed transition-all duration-300 cursor-pointer hover:shadow-lg"
          style={{
            borderColor: isDragging ? '#D4AF37' : 'rgba(212,175,55,0.35)',
            background: isDragging
              ? 'rgba(212,175,55,0.05)'
              : 'transparent',
          }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 px-4">
            <div
              className="flex size-20 items-center justify-center rounded-2xl transition-all duration-300"
              style={{
                background: isDragging
                  ? 'rgba(212,175,55,0.15)'
                  : 'rgba(212,175,55,0.08)',
              }}
            >
              <Upload
                className="size-9 transition-transform duration-300"
                style={{
                  color: isDragging ? '#D4AF37' : 'rgba(212,175,55,0.5)',
                  transform: isDragging ? 'translateY(-4px)' : 'translateY(0)',
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">
                عکس طلای خود را اینجا بگذارید
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                فایل را بکشید و رها کنید یا کلیک کنید
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                فرمت‌های مجاز: JPG, PNG, WebP — حداکثر ۱۰ مگابایت
              </p>
            </div>
            <Button
              id="gs-gallery"
              type="button"
              variant="outline"
              className="mt-2 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <ImageIcon className="me-2 size-4" />
              انتخاب تصویر
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ─── Error State ─── */}
      {state === 'error' && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="size-7 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-red-500">خطا در تحلیل</p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              <RefreshCw className="me-2 size-4" />
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Analyzing State ─── */}
      {state === 'analyzing' && (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center gap-5 py-12 px-4">
            {/* Animated spinner */}
            <div className="relative">
              <div
                className="size-20 rounded-full animate-spin"
                style={{
                  border: '3px solid rgba(212,175,55,0.15)',
                  borderTopColor: '#D4AF37',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="size-7 text-[#D4AF37]" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                در حال تحلیل تصویر...
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                هوش مصنوعی در حال بررسی جواهر شما است
              </p>
            </div>
            {/* Image preview while analyzing */}
            {imagePreview && (
              <div className="mt-2 overflow-hidden rounded-xl border border-border shadow-sm">
                <img
                  src={imagePreview}
                  alt="تصویر در حال تحلیل"
                  className="h-40 w-40 object-cover sm:h-48 sm:w-48"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Results State ─── */}
      {state === 'success' && analysis && (
        <div id="gs-history" className="space-y-4">
          {/* Image + Quick Info Header */}
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Thumbnail */}
                {imagePreview && (
                  <div className="mx-auto shrink-0 overflow-hidden rounded-xl border-2 border-[#D4AF37]/30 shadow-md">
                    <img
                      src={imagePreview}
                      alt="تصویر جواهر"
                      className="h-32 w-32 object-cover sm:h-36 sm:w-36"
                    />
                  </div>
                )}
                {/* Quick info */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">
                      {analysis.type}
                    </h2>
                    <Badge
                      className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/25 hover:bg-[#D4AF37]/20 transition-colors"
                    >
                      <Gem className="me-1 size-3" />
                      عیار {analysis.karat}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Weight */}
                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                        <Scale className="size-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">وزن تخمینی</p>
                        <p className="text-sm font-bold text-foreground">
                          {analysis.weightGrams} گرم
                        </p>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                        <Sparkles className="size-5 text-[#8B5CF6]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ارزش تخمینی</p>
                        <p className="text-sm font-bold text-foreground">
                          {analysis.estimatedValueRial} واحد طلایی
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="size-4 text-[#8B5CF6]" />
                توضیحات
              </h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {analysis.description}
              </p>
            </CardContent>
          </Card>

          {/* Confidence */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  سطح اطمینان
                </h3>
                <span
                  className="text-sm font-bold"
                  style={{
                    color:
                      analysis.confidence >= 70
                        ? '#22c55e'
                        : analysis.confidence >= 40
                          ? '#eab308'
                          : '#ef4444',
                  }}
                >
                  {analysis.confidence}٪
                </span>
              </div>
              <Progress
                value={analysis.confidence}
                className="h-3"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {analysis.confidence >= 70
                  ? 'تحلیل با اطمینان بالا انجام شده است.'
                  : analysis.confidence >= 40
                    ? 'تحلیل تخمینی است. برای قیمت دقیق‌تر به طلافروشی مراجعه کنید.'
                    : 'اطمینان پایین. تصویر بهتر نتیجه دقیق‌تری می‌دهد.'}
              </p>
            </CardContent>
          </Card>

          {/* Tips */}
          {analysis.tips && analysis.tips.length > 0 && (
            <Card id="gs-guide" className="border-[#8B5CF6]/15 bg-gradient-to-b from-[#8B5CF6]/5 to-transparent">
              <CardContent className="p-4 sm:p-6">
                <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="text-base">💡</span>
                  نکات کاربردی
                </h3>
                <ul className="space-y-2.5">
                  {analysis.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span
                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{
                          background: `linear-gradient(135deg, #8B5CF6, #A78BFA)`,
                        }}
                      >
                        {i + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground/60 leading-5">
            ⚠️ نتایج این تحلیل صرفاً تخمینی هستند و جنبه مشاوره‌ای دارند.
            برای قیمت‌گذاری دقیق، حتماً به طلافروشی معتبر مراجعه کنید.
          </p>

          {/* Re-analyze Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={handleReset}
              className="gap-2 bg-gradient-to-l from-[#D4AF37] to-[#B8960C] text-white shadow-lg shadow-[#D4AF37]/20 hover:from-[#B8960C] hover:to-[#D4AF37] transition-all duration-300"
            >
              <RefreshCw className="size-4" />
              تحلیل مجدد
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
