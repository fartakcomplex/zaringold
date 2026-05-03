
import React, { useState, useEffect, useCallback } from 'react';
import {Store, Key, Eye, EyeOff, Copy, Check, Link2, Code2, Globe, ArrowLeftRight, HelpCircle, AlertCircle, CheckCircle2, Clock, Loader2, RefreshCw, MessageCircle} from 'lucide-react';
import {useAppStore} from '@/lib/store';
import {useTranslation} from '@/lib/i18n';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {cn} from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MerchantData {
  id: string;
  businessName: string;
  website?: string;
  callbackUrl: string;
  apiKey: string;
  apiSecret: string;
  feePercent: number;
  isActive: boolean;
  totalPayments: number;
  totalVolume: number;
  description?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Number Formatting                                                  */
/* ------------------------------------------------------------------ */

function formatNumber(n: number, locale: 'fa' | 'en' = 'fa'): string {
  return locale === 'en' ? n.toLocaleString('en-US') : n.toLocaleString('fa-IR');
}

/* ------------------------------------------------------------------ */
/*  Code Snippets                                                      */
/* ------------------------------------------------------------------ */

function getPHPSnippet(apiKey: string, callbackUrl: string): string {
  return `<?php
$apiKey = '${apiKey}';
$amount = 0.5; // grams
$description = 'Order #123';
$callbackUrl = '${callbackUrl}';

$ch = curl_init('https://zarringold.com/api/gateway/pay/create');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'apiKey' => $apiKey,
  'amountGrams' => $amount,
  'description' => $description,
  'callbackUrl' => $callbackUrl,
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = json_decode(curl_exec($ch), true);
// Redirect user to: $response['paymentUrl']`;
}

function getCurlSnippet(apiKey: string, callbackUrl: string): string {
  return `curl -X POST https://zarringold.com/api/gateway/pay/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "${apiKey}",
    "amountGrams": 0.5,
    "description": "Order #123",
    "callbackUrl": "${callbackUrl}"
  }'`;
}

function getJSSnippet(apiKey: string, callbackUrl: string): string {
  return `const response = await fetch('https://zarringold.com/api/gateway/pay/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: '${apiKey}',
    amountGrams: 0.5,
    description: 'Order #123',
    callbackUrl: '${callbackUrl}',
  }),
});
const data = await response.json();
// Redirect: window.location.href = data.paymentUrl;`;
}

/* ------------------------------------------------------------------ */
/*  Copy Button                                                        */
/* ------------------------------------------------------------------ */

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={cn('transition-colors text-muted-foreground hover:text-gold', className)}
      title={copied ? 'Copied' : 'Copy'}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Code Block                                                         */
/* ------------------------------------------------------------------ */

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? 'کپی شد' : 'کپی'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto max-h-64">
        <code className="text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Registration Form                                                  */
/* ------------------------------------------------------------------ */

function RegistrationForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const { token, addToast } = useAppStore();
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!businessName.trim()) e.businessName = 'نام کسب‌وکار الزامی است';
    if (!callbackUrl.trim()) e.callbackUrl = 'آدرس Callback الزامی است';
    if (callbackUrl && !callbackUrl.startsWith('https://')) {
      e.callbackUrl = 'آدرس Callback باید با https:// شروع شود';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/gateway/merchant/register', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, website, callbackUrl, description }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(t('gateway.registerSuccess'), 'success');
        onSuccess();
      } else {
        addToast(data.error || t('gateway.registerError'), 'error');
      }
    } catch {
      addToast(t('gateway.registerError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
        <h3 className="text-base font-bold text-foreground mb-1">{t('gateway.registerTitle')}</h3>
        <p className="text-sm text-muted-foreground mb-5">{t('gateway.registerDesc')}</p>

        {/* Business name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            {t('gateway.businessName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-muted-foreground/40"
            placeholder={t('gateway.businessNamePlaceholder')}
            dir="ltr"
          />
          {errors.businessName && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="size-3" /> {errors.businessName}
            </p>
          )}
        </div>

        {/* Website */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t('gateway.website')}</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-muted-foreground/40"
            placeholder="https://example.com"
            dir="ltr"
          />
        </div>

        {/* Callback URL */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            {t('gateway.callbackUrl')} <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={callbackUrl}
            onChange={(e) => setCallbackUrl(e.target.value)}
            className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all placeholder:text-muted-foreground/40"
            placeholder="https://example.com/callback"
            dir="ltr"
          />
          {errors.callbackUrl && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="size-3" /> {errors.callbackUrl}
            </p>
          )}
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <HelpCircle className="size-3 mt-0.5 shrink-0" />
            {t('gateway.callbackHelp')}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t('gateway.description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all resize-none placeholder:text-muted-foreground/40"
            placeholder={t('gateway.descriptionPlaceholder')}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full gap-2 bg-gradient-to-l from-gold to-amber-500 text-black font-bold py-5 hover:opacity-90 disabled:opacity-50"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t('gateway.registering')}
          </>
        ) : (
          <>
            <Store className="size-4" />
            {t('gateway.registerBtn')}
          </>
        )}
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Merchant Dashboard                                                 */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Pending Approval State                                             */
/* ------------------------------------------------------------------ */

function PendingState({ data }: { data: MerchantData }) {
  return (
    <div className="space-y-4">
      {/* Big centered card with gold gradient */}
      <div className="rounded-2xl border border-gold/20 bg-gradient-to-b from-gold/10 to-gold/5 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/25 to-amber-500/20">
          <Clock className="size-8 text-gold animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">در انتظار تأیید</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          درخواست شما ثبت شد و در انتظار تأیید مدیر سایت می‌باشد.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold/10 border border-gold/15 px-4 py-2">
          <Clock className="size-4 text-gold/70" />
          <span className="text-xs text-gold/80">
            معمولاً ظرف ۲۴ ساعت آینده بررسی می‌شود
          </span>
        </div>
      </div>

      {/* Small preview card with merchant info */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gold/15">
            <Store className="size-5 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate">{data.businessName}</p>
            {data.website && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate" dir="ltr">
                <Globe className="size-3 shrink-0" />
                {data.website}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chat support link */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm text-center">
        <p className="text-sm text-muted-foreground mb-2">سوال دارید؟</p>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-chat-support'));
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-amber-400 transition-colors"
        >
          <MessageCircle className="size-4" />
          گفتگو با پشتیبانی
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Merchant Dashboard (Approved)                                      */
/* ------------------------------------------------------------------ */

function MerchantDashboard({ data }: { data: MerchantData }) {
  const { t, locale } = useTranslation();

  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'guide'>('overview');

  const maskedKey = (key: string) => key.slice(0, 8) + '••••••••' + key.slice(-4);

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gold/15">
            <Store className="size-6 text-gold" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{data.businessName}</h3>
            {data.website && (
              <p className="text-xs text-muted-foreground flex items-center gap-1" dir="ltr">
                <Globe className="size-3" />
                {data.website}
              </p>
            )}
          </div>
        </div>
        <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          <CheckCircle2 className="size-3.5" />
          {t('gateway.statusActive')}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
          <p className="text-xs text-muted-foreground">{t('gateway.totalPayments')}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatNumber(data.totalPayments, locale)}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
          <p className="text-xs text-muted-foreground">{t('gateway.totalVolume')}</p>
          <p className="text-2xl font-bold gold-gradient-text mt-1">
            {formatNumber(data.totalVolume, locale)} <span className="text-sm font-normal">{t('common.gram')}</span>
          </p>
        </div>
      </div>

      {/* Fee */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('gateway.feePercent')}</span>
          <span className="text-lg font-bold text-gold">{data.feePercent}%</span>
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm space-y-4">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Key className="size-4 text-gold" />
          {t('gateway.apiKeys')}
        </h4>

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">API Key</label>
          <div className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2">
            <code className="flex-1 text-xs font-mono text-zinc-300 truncate" dir="ltr">
              {showApiKey ? data.apiKey : maskedKey(data.apiKey)}
            </code>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showApiKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
            <CopyButton text={data.apiKey} />
          </div>
        </div>

        {/* API Secret */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">API Secret</label>
          <div className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2">
            <code className="flex-1 text-xs font-mono text-zinc-300 truncate" dir="ltr">
              {showApiSecret ? data.apiSecret : maskedKey(data.apiSecret)}
            </code>
            <button
              onClick={() => setShowApiSecret(!showApiSecret)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showApiSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
            <CopyButton text={data.apiSecret} />
          </div>
        </div>

        {/* Callback URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Link2 className="size-3" />
            {t('gateway.callbackUrl')}
          </label>
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2">
            <code className="text-xs font-mono text-zinc-300 break-all" dir="ltr">
              {data.callbackUrl}
            </code>
          </div>
        </div>
      </div>

      {/* Tabs: Overview / Integration Guide */}
      <div className="rounded-2xl border border-border/50 overflow-hidden backdrop-blur-sm">
        <div className="flex border-b border-border/50 bg-card/30">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors border-b-2',
              activeTab === 'overview'
                ? 'border-gold text-gold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t('gateway.overview')}
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors border-b-2',
              activeTab === 'guide'
                ? 'border-gold text-gold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Code2 className="size-4 inline-block me-1.5" />
            {t('gateway.integrationGuide')}
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'overview' ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                  ۱
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('gateway.step1Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('gateway.step1Desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                  ۲
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('gateway.step2Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('gateway.step2Desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                  ۳
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('gateway.step3Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('gateway.step3Desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                  ۴
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('gateway.step4Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('gateway.step4Desc')}</p>
                </div>
              </div>

              {/* API Endpoints */}
              <Separator className="my-4 bg-border/30" />
              <h4 className="text-sm font-bold text-foreground mb-3">{t('gateway.apiEndpoints')}</h4>
              <div className="space-y-2">
                {[
                  { method: 'POST', path: '/api/gateway/pay/create', desc: t('gateway.createPayment') },
                  { method: 'GET', path: '/api/gateway/pay/:id/detail', desc: t('gateway.getDetail') },
                  { method: 'POST', path: '/api/gateway/pay/:id/verify', desc: t('gateway.verifyPayment') },
                ].map((endpoint) => (
                  <div key={endpoint.path} className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2">
                    <span className={cn(
                      'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded',
                      endpoint.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    )}>
                      {endpoint.method}
                    </span>
                    <code className="text-xs font-mono text-zinc-300" dir="ltr">{endpoint.path}</code>
                    <span className="text-xs text-zinc-500 ms-auto">{endpoint.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground">{t('gateway.codeExamples')}</h4>
              <CodeBlock code={getPHPSnippet(data.apiKey, data.callbackUrl)} language="PHP" />
              <CodeBlock code={getJSSnippet(data.apiKey, data.callbackUrl)} language="JavaScript" />
              <CodeBlock code={getCurlSnippet(data.apiKey, data.callbackUrl)} language="cURL" />
            </div>
          )}
        </div>
      </div>

      {/* Chat support link */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm text-center">
        <p className="text-sm text-muted-foreground mb-2">سوال دارید؟</p>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-chat-support'));
          }}
          className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-amber-400 transition-colors"
        >
          <MessageCircle className="size-4" />
          گفتگو با پشتیبانی
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main MerchantPanel Component                                       */
/* ------------------------------------------------------------------ */

export default function MerchantPanel() {
  const { t } = useTranslation();
  const { user, token } = useAppStore();
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMerchant = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gateway/merchant/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMerchant(data.merchant);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    fetchMerchant();
  }, [fetchMerchant, refreshKey]);

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Store className="size-6 text-gold" />
          {t('gateway.merchantPanel')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('gateway.merchantPanelDesc')}</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 rounded-2xl bg-muted" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
          </div>
          <div className="h-48 rounded-2xl bg-muted" />
        </div>
      )}

      {/* Content */}
      {!loading && !merchant && (
        <RegistrationForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      )}

      {!loading && merchant && !merchant.isActive && (
        <PendingState data={merchant} />
      )}

      {!loading && merchant && merchant.isActive && (
        <MerchantDashboard data={merchant} />
      )}
    </div>
  );
}
