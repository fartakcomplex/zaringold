
import React, { useState, useCallback } from 'react';
import {BookOpen, Copy, Check, Key, Send, ShieldCheck, Globe, Terminal, AlertTriangle, Info, ExternalLink, Zap, RefreshCw, CreditCard, Clock, ArrowLeftRight, Coins, FileCode, FlaskConical, TestTube, CheckCircle2, XCircle, Download} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Accordion, AccordionItem, AccordionTrigger, AccordionContent} from '@/components/ui/accordion';
import {Badge} from '@/components/ui/badge';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Copy-to-Clipboard Code Block                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CodeBlock({
  code,
  language = 'javascript',
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="group relative mt-3 overflow-hidden rounded-xl border border-gold/15 bg-[#0d1117]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {filename || language}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-gold hover:bg-gold/10"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">کپی شد!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>کپی</span>
            </>
          )}
        </Button>
      </div>
      {/* Code content */}
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed font-mono text-gray-300" dir="ltr">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Section Title                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SectionTitle({
  icon: Icon,
  title,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex items-center gap-2 flex-1">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {badge && (
          <Badge
            variant="outline"
            className="border-gold/30 text-gold text-[10px] font-semibold px-2 py-0"
          >
            {badge}
          </Badge>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Method Badge                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MethodBadge({ method }: { method: string }) {
  const config: Record<string, string> = {
    GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    POST: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    DELETE: 'bg-red-500/15 text-red-400 border-red-500/25',
  };
  return (
    <Badge
      className={cn(
        'font-mono text-[11px] font-bold tracking-wider border px-2.5 py-0.5',
        config[method] || config.GET
      )}
    >
      {method}
    </Badge>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Parameter Table                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ParamTable({
  params,
}: {
  params: Array<{
    name: string;
    type: string;
    required: string;
    description: string;
  }>;
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-gold/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gold/10 bg-gold/[0.04]">
            <th className="px-4 py-2.5 text-right font-semibold text-gold text-xs">پارامتر</th>
            <th className="px-4 py-2.5 text-right font-semibold text-gold text-xs">نوع</th>
            <th className="px-4 py-2.5 text-center font-semibold text-gold text-xs">اجباری</th>
            <th className="px-4 py-2.5 text-right font-semibold text-gold text-xs">توضیحات</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={p.name}
              className={cn(
                'border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.02]',
                i % 2 === 0 && 'bg-white/[0.01]'
              )}
            >
              <td className="px-4 py-2.5 font-mono text-xs text-emerald-400" dir="ltr">
                {p.name}
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.type}</td>
              <td className="px-4 py-2.5 text-center">
                {p.required === 'بله' ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0">
                    بله
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                    خیر
                  </Badge>
                )}
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ApiDocsView() {
  /* ── Navigation state ── */
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="page-transition min-h-screen" dir="rtl">
      <div className="mx-auto max-w-3xl p-4 pb-28">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  Section 1: Header                                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 via-card to-gold/5 p-6 sm:p-8 mb-8">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-gold/5 blur-2xl" />

          <div className="relative flex flex-col items-center gap-4 text-center">
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15 shadow-[0_0_24px_oklch(0.75_0.15_85/0.15)]">
              <BookOpen className="h-8 w-8 text-gold" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
                مستندات API درگاه طلایی
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                راهنمای کامل اتصال به درگاه پرداخت زرین گلد
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge className="bg-gold/15 text-gold border-gold/30 px-3 py-1 text-xs font-bold">
                نسخه ۱.۰
              </Badge>
              <Badge variant="outline" className="border-gold/20 text-muted-foreground text-xs">
                <ShieldCheck className="ml-1.5 h-3 w-3" />
                RESTful API
              </Badge>
              <Badge variant="outline" className="border-gold/20 text-muted-foreground text-xs">
                <Globe className="ml-1.5 h-3 w-3" />
                JSON Response
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <Card className="border-gold/10 bg-card mb-6">
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Info className="h-3.5 w-3.5 text-gold" />
              <span className="font-semibold">فهرست مطالب</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {[
                { id: 'auth', label: 'احراز هویت' },
                { id: 'endpoints', label: 'اندپوینت‌ها' },
                { id: 'wordpress', label: 'پلاگین وردپرس' },
                { id: 'webhooks', label: 'وب‌هوک' },
                { id: 'sdk', label: 'SDK' },
                { id: 'errors', label: 'خطاها' },
                { id: 'sandbox', label: 'تست' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={cn(
                    'flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                    'hover:border-gold/30 hover:bg-gold/5 hover:text-gold',
                    'border-border text-muted-foreground',
                    activeSection === item.id && 'border-gold/30 bg-gold/10 text-gold'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  Section 2: Authentication                                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section id="auth" className="mb-8 scroll-mt-4">
          <SectionTitle icon={Key} title="احراز هویت" badge="Required" />

          <Card className="border-gold/10 bg-card">
            <CardContent className="p-5 space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">
                تمام درخواست‌های API باید شامل هدر <code className="rounded bg-gold/10 px-1.5 py-0.5 text-xs font-mono text-gold" dir="ltr">Authorization</code> باشند. کلید API خود را از پنل پذیرندگان دریافت کنید.
              </p>

              <div className="flex items-start gap-3 rounded-xl border border-gold/15 bg-gold/[0.04] p-4">
                <ShieldCheck className="h-5 w-5 shrink-0 text-gold mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">نکات امنیتی</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>کلید API را هرگز در کد فرانت‌اند قرار ندهید</li>
                    <li>از HTTPS برای تمام درخواست‌ها استفاده کنید</li>
                    <li>کلید محیط تست با محیط عملیاتی متفاوت است</li>
                    <li>در صورت لو رفتن کلید، فوراً آن را بازنشانی کنید</li>
                  </ul>
                </div>
              </div>

              <CodeBlock
                language="javascript"
                filename="auth-headers.js"
                code={`// Authentication Header
headers: {
  'Authorization': 'Bearer gp_live_xxxxxxxxxxxxxxxx',
  'Content-Type': 'application/json'
}`}
              />
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  Section 3: API Endpoints                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section id="endpoints" className="mb-8 scroll-mt-4">
          <SectionTitle icon={Terminal} title="اندپوینت‌های API" badge="۵ مورد" />

          <Accordion
            type="multiple"
            defaultValue={['endpoint-1']}
            className="space-y-3"
          >
            {/* ── Endpoint 1: Create Payment Request ── */}
            <AccordionItem
              value="endpoint-1"
              className="rounded-xl border border-gold/10 bg-card overflow-hidden data-[state=open]:border-gold/25 data-[state=open]:shadow-[0_0_20px_oklch(0.75_0.15_85/0.06)]"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3 text-right">
                  <MethodBadge method="POST" />
                  <div>
                    <p className="font-mono text-sm text-foreground" dir="ltr">
                      /api/v1/payment/request
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ایجاد درخواست پرداخت جدید
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <ParamTable
                  params={[
                    { name: 'amount', type: 'number', required: 'بله', description: 'مبلغ به واحد طلایی (حداقل ۱,۰۰۰)' },
                    { name: 'callback_url', type: 'string', required: 'بله', description: 'آدرس بازگشت پس از پرداخت' },
                    { name: 'description', type: 'string', required: 'خیر', description: 'توضیحات تراکنش' },
                    { name: 'payment_method', type: 'string', required: 'خیر', description: 'toman | gold | mixed' },
                    { name: 'metadata', type: 'object', required: 'خیر', description: 'داده‌های اضافی' },
                  ]}
                />

                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-gold" />
                    نمونه درخواست
                  </p>
                  <CodeBlock
                    language="javascript"
                    filename="payment-request.js"
                    code={`const response = await fetch('https://api.zarringold.ir/api/v1/payment/request', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer gp_live_xxxxxxxxxxxxxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 5000000,
    callback_url: 'https://yoursite.ir/callback',
    description: 'خرید محصول شماره ۱۲۳',
    payment_method: 'toman',
    metadata: {
      order_id: 'ORD-123',
      customer_id: 'CUS-456'
    }
  })
});

const result = await response.json();`}
                  />

                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    نمونه پاسخ موفق
                  </p>
                  <CodeBlock
                    language="json"
                    filename="response.json"
                    code={`{
  "success": true,
  "data": {
    "authority": "a1b2c3d4e5f6...",
    "payment_url": "https://zarringold.ir/checkout/a1b2c3d4e5f6",
    "amount": 5000000,
    "fee": 25000,
    "gold_price": 5150000,
    "expires_at": "2025-01-15T14:30:00Z"
  }
}`}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Endpoint 2: Verify Payment ── */}
            <AccordionItem
              value="endpoint-2"
              className="rounded-xl border border-gold/10 bg-card overflow-hidden data-[state=open]:border-gold/25 data-[state=open]:shadow-[0_0_20px_oklch(0.75_0.15_85/0.06)]"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3 text-right">
                  <MethodBadge method="POST" />
                  <div>
                    <p className="font-mono text-sm text-foreground" dir="ltr">
                      /api/v1/payment/verify
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      تأیید و نهایی‌سازی پرداخت
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <ParamTable
                  params={[
                    { name: 'authority', type: 'string', required: 'بله', description: 'توکن یکتای تراکنش' },
                    { name: 'amount', type: 'number', required: 'بله', description: 'مبلغ پرداختی به واحد طلایی' },
                  ]}
                />

                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-gold" />
                    نمونه درخواست
                  </p>
                  <CodeBlock
                    language="javascript"
                    filename="verify.js"
                    code={`const response = await fetch('https://api.zarringold.ir/api/v1/payment/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer gp_live_xxxxxxxxxxxxxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    authority: 'a1b2c3d4e5f6...',
    amount: 5000000
  })
});

const result = await response.json();`}
                  />

                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    نمونه پاسخ
                  </p>
                  <CodeBlock
                    language="json"
                    filename="verify-response.json"
                    code={`{
  "success": true,
  "data": {
    "ref_id": "GPG-9827364510",
    "status": "paid",
    "amount": 5000000,
    "fee": 25000,
    "gold_amount": 0.970,
    "payment_method": "toman",
    "card_pan": "6037****1234",
    "verified_at": "2025-01-15T14:25:00Z"
  }
}`}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Endpoint 3: Payment History ── */}
            <AccordionItem
              value="endpoint-3"
              className="rounded-xl border border-gold/10 bg-card overflow-hidden data-[state=open]:border-gold/25 data-[state=open]:shadow-[0_0_20px_oklch(0.75_0.15_85/0.06)]"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3 text-right">
                  <MethodBadge method="GET" />
                  <div>
                    <p className="font-mono text-sm text-foreground" dir="ltr">
                      /api/v1/payment/history
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      لیست تراکنش‌ها
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <ParamTable
                  params={[
                    { name: 'merchantId', type: 'string', required: 'خیر', description: 'شناسه پذیرنده' },
                    { name: 'status', type: 'string', required: 'خیر', description: 'paid | pending | failed' },
                    { name: 'from_date', type: 'string', required: 'خیر', description: 'تاریخ شروع (ISO 8601)' },
                    { name: 'to_date', type: 'string', required: 'خیر', description: 'تاریخ پایان (ISO 8601)' },
                    { name: 'limit', type: 'number', required: 'خیر', description: 'تعداد آیتم (پیش‌فرض: ۲۰)' },
                    { name: 'offset', type: 'number', required: 'خیر', description: 'شروع از آیتم (پیش‌فرض: ۰)' },
                  ]}
                />

                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    نمونه پاسخ
                  </p>
                  <CodeBlock
                    language="json"
                    filename="history-response.json"
                    code={`{
  "success": true,
  "data": {
    "payments": [
      {
        "ref_id": "GPG-9827364510",
        "authority": "a1b2c3d4e5f6...",
        "amount": 5000000,
        "status": "paid",
        "payment_method": "toman",
        "gold_grams": 0.970,
        "description": "خرید محصول شماره ۱۲۳",
        "created_at": "2025-01-15T14:20:00Z",
        "verified_at": "2025-01-15T14:25:00Z"
      }
    ],
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}`}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Endpoint 4: Refund ── */}
            <AccordionItem
              value="endpoint-4"
              className="rounded-xl border border-gold/10 bg-card overflow-hidden data-[state=open]:border-gold/25 data-[state=open]:shadow-[0_0_20px_oklch(0.75_0.15_85/0.06)]"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3 text-right">
                  <MethodBadge method="POST" />
                  <div>
                    <p className="font-mono text-sm text-foreground" dir="ltr">
                      /api/v1/payment/refund
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      درخواست بازگشت وجه
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <ParamTable
                  params={[
                    { name: 'authority', type: 'string', required: 'بله', description: 'توکن یکتای تراکنش' },
                    { name: 'amount', type: 'number', required: 'بله', description: 'مبلغ بازگشتی به واحد طلایی' },
                    { name: 'reason', type: 'string', required: 'خیر', description: 'دلیل بازگشت وجه' },
                  ]}
                />

                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    نمونه پاسخ
                  </p>
                  <CodeBlock
                    language="json"
                    filename="refund-response.json"
                    code={`{
  "success": true,
  "data": {
    "refund_id": "REF-8472936150",
    "authority": "a1b2c3d4e5f6...",
    "amount": 5000000,
    "refund_gold_grams": 0.970,
    "status": "processing",
    "estimated_completion": "2025-01-17T14:25:00Z",
    "message": "درخواست بازگشت وجه ثبت شد"
  }
}`}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ── Endpoint 5: Gold Price ── */}
            <AccordionItem
              value="endpoint-5"
              className="rounded-xl border border-gold/10 bg-card overflow-hidden data-[state=open]:border-gold/25 data-[state=open]:shadow-[0_0_20px_oklch(0.75_0.15_85/0.06)]"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex items-center gap-3 text-right">
                  <MethodBadge method="GET" />
                  <div>
                    <p className="font-mono text-sm text-foreground" dir="ltr">
                      /api/v1/prices/gold
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      قیمت لحظه‌ای طلا
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4 mb-3">
                  <Info className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    این اندپوینت نیازی به احراز هویت ندارد و قابل فراخوانی عمومی است.
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    نمونه پاسخ
                  </p>
                  <CodeBlock
                    language="json"
                    filename="gold-price.json"
                    code={`{
  "success": true,
  "data": {
    "buy_price": 51480000,
    "sell_price": 51320000,
    "market_price": 51500000,
    "change_24h": 1.35,
    "change_24h_sign": "positive",
    "ounce_price": 2650.50,
    "spread_percent": 0.31,
    "updated_at": "2025-01-15T14:30:00Z"
  }
}`}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  Section: WordPress Plugin                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section id="wordpress" className="mb-8 scroll-mt-4">
          <SectionTitle icon={Download} title="پلاگین وردپرس / ووکامرس" badge="WooCommerce" />

          <Card className="border-gold/10 bg-card">
            <CardContent className="p-5 space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">
                پلاگین رسمی زرین گلد برای وردپرس و ووکامرس — بدون نیاز به کدنویسی، درگاه طلایی را روی سایت وردپرسی خود فعال کنید.
              </p>

              {/* Features grid */}
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { title: 'پرداخت فقط با طلا 💰', desc: 'بدون نمایش واحد طلایی و واحد طلایی' },
                  { title: 'قیمت لحظه‌ای طلا', desc: 'نمایش معادل طلایی مبلغ سبد خرید' },
                  { title: 'وب‌هوک خودکار', desc: 'تأیید پرداخت بدون بازگشت کاربر' },
                  { title: 'بازگشت وجه', desc: 'Refund مستقیم از پنل ووکامرس' },
                  { title: 'تست اتصال', desc: 'دکمه تست از پنل مدیریت' },
                  { title: 'آمار تراکنش‌ها', desc: 'داشبورد با جزئیات کامل' },
                  { title: 'حالت ترکیبی', desc: 'پرداخت بخشی طلا، بخشی واحد طلایی' },
                  { title: 'لاگ‌گیری', desc: 'عیب‌یابی آسان با لاگ کامل' },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-2 rounded-lg border border-gold/10 bg-gold/[0.03] p-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{f.title}</p>
                      <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="bg-gold/10" />

              {/* Installation */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Download className="h-4 w-4 text-gold" />
                  نصب و راه‌اندازی (۳ مرحله)
                </p>

                <CodeBlock
                  language="bash"
                  filename="install"
                  code={`# ۱. پلاگین را در پوشه wp-content/plugins آپلود کنید
# یا از منوی افزونه‌ها → افزودن → بارگذاری افزونه

# ۲. پلاگین را فعال کنید
# افزونه‌ها → درگاه طلایی زرین گلد → فعال‌سازی

# ۳. تنظیمات:
#    ووکامرس → تنظیمات → پرداخت → درگاه طلایی زرین گلد
#    - کلید API: gp_live_xxxxxxxxxxxxxxxx
#    - آدرس سرور: https://your-zarringold-site.com
#    - حالت پرداخت: فقط طلا 💰
`}
                />
              </div>

              {/* PHP Code Sample for non-WooCommerce */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-gold" />
                  نمونه PHP (بدون ووکامرس)
                </p>

                <CodeBlock
                  language="php"
                  filename="payment.php"
                  code={`<?php
// ─── ایجاد پرداخت ───
$ch = curl_init('https://YOUR-SITE.com/api/v1/payment/request');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode([
        'api_key'        => 'gp_live_XXXXXXXXXXXXXXXXXXXXXXXX',
        'amount'         => 500000,
        'currency'       => 'gold',
        'payment_method' => 'gold',
        'callback_url'   => 'https://yoursite.com/callback.php',
        'description'    => 'سفارش #1234',
        'customer_name'  => 'علی محمدی',
        'customer_phone' => '09120000000',
    ]),
]);

$response = curl_exec($ch);
$data = json_decode($response, true);

if ($data['success']) {
    // هدایت به صفحه پرداخت
    header("Location: " . $data['data']['payment_url']);
    exit;
}

// ─── تأیید پرداخت (callback.php) ───
$authority = $_GET['authority'] ?? '';
$ch = curl_init('https://YOUR-SITE.com/api/v1/payment/verify');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode([
        'authority' => $authority,
        'status'    => 'OK',
    ]),
]);

$result = json_decode(curl_exec($ch), true);
if (!empty($result['success'])) {
    $ref_id    = $result['data']['ref_id'];
    $paid_gold = $result['data']['paid_gold'];
    // ✅ سفارش تکمیل شود
}`}
                />
              </div>

              {/* Webhook URL */}
              <div className="flex items-start gap-3 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-4">
                <Info className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">آدرس وب‌هوک</p>
                  <p className="text-xs mb-2">
                    این آدرس را در تنظیمات وب‌هوک پنل فروشندگان وارد کنید:
                  </p>
                  <code className="block rounded bg-[#0d1117] px-3 py-2 text-xs font-mono text-emerald-400" dir="ltr">
                    https://your-wp-site.com/wc-api/zg_webhook
                  </code>
                </div>
              </div>

              {/* Plugin file structure */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-gold" />
                  ساختار فایل‌های پلاگین
                </p>
                <CodeBlock
                  language="text"
                  filename="plugin-structure"
                  code={`zarrin-gold-gateway/
├── zarrin-gold-gateway.php      # فایل اصلی پلاگین
├── includes/
│   ├── class-zg-api.php          # کلایت API
│   ├── class-zg-gateway.php      # کلاس درگاه ووکامرس
│   └── class-zg-logger.php       # سیستم لاگ‌گیری
├── admin/
│   └── class-zg-admin-settings.php  # تنظیمات ادمین
├── assets/
│   ├── admin.js                  # جاوااسکریپت ادمین
│   ├── admin.css                 # استایل ادمین
│   └── gold-icon.svg             # آیکون درگاه
└── languages/                    # فایل‌های ترجمه`}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  Section 4: Webhook Events                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section id="webhooks" className="mb-8 scroll-mt-4">
          <SectionTitle icon={RefreshCw} title="رویدادهای وب‌هوک" badge="Real-time" />

          <Card className="border-gold/10 bg-card">
            <CardContent className="p-5 space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">
                زرین گلد پس از انجام هر تراکنش، یک نوتیفیکیشن POST به آدرس وب‌هوک شما ارسال می‌کند. برای تأیید اصالت، امضای <code className="rounded bg-gold/10 px-1.5 py-0.5 text-xs font-mono text-gold" dir="ltr">signature</code> را با کلید وب‌هوک خود بررسی کنید.
              </p>

              <CodeBlock
                language="json"
                filename="webhook-payload.json"
                code={`{
  "event": "payment.verified",
  "data": {
    "authority": "...",
    "ref_id": "GPG-...",
    "amount": 5000000,
    "gold_grams": 0.970,
    "status": "paid",
    "created_at": "2025-01-15T14:25:00Z"
  },
  "signature": "sha256=..."
}`}
              />

              <Separator className="bg-gold/10" />

              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-gold" />
                لیست رویدادها
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { event: 'payment.created', desc: 'تراکنش جدید ایجاد شد', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                  { event: 'payment.verified', desc: 'پرداخت تأیید و نهایی شد', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                  { event: 'payment.failed', desc: 'پرداخت ناموفق بود', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                  { event: 'refund.created', desc: 'درخواست بازگشت وجه ثبت شد', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                  { event: 'settlement.processed', desc: 'تسویه حساب انجام شد', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                ].map((item) => (
                  <div
                    key={item.event}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3',
                      item.color
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-bold" dir="ltr">{item.event}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  Section 5: SDK & Libraries                                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section id="sdk" className="mb-8 scroll-mt-4">
          <SectionTitle icon={FileCode} title="کتابخانه‌ها و SDK" />

          <Card className="border-gold/10 bg-card">
            <CardContent className="p-5 space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">
                برای تسریع فرآیند اتصال، از SDK رسمی زرین گلد استفاده کنید:
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* JavaScript/Node.js */}
                <div className="rounded-xl border border-gold/10 bg-gold/[0.03] p-4 transition-colors hover:border-gold/20 hover:bg-gold/[0.06]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-400">
                      <Terminal className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">JavaScript / Node.js</span>
                  </div>
                  <CodeBlock
                    code={`npm install @zarringold/sdk`}
                    language="bash"
                    filename="terminal"
                  />
                </div>

                {/* PHP */}
                <div className="rounded-xl border border-gold/10 bg-gold/[0.03] p-4 transition-colors hover:border-gold/20 hover:bg-gold/[0.06]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                      <FileCode className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">PHP</span>
                  </div>
                  <CodeBlock
                    code={`composer require zarringold/sdk`}
                    language="bash"
                    filename="terminal"
                  />
                </div>

                {/* Python */}
                <div className="rounded-xl border border-gold/10 bg-gold/[0.03] p-4 transition-colors hover:border-gold/20 hover:bg-gold/[0.06]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                      <FlaskConical className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Python</span>
                  </div>
                  <CodeBlock
                    code={`pip install zarringold-sdk`}
                    language="bash"
                    filename="terminal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  Section 6: Error Codes                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section id="errors" className="mb-8 scroll-mt-4">
          <SectionTitle icon={AlertTriangle} title="کدهای خطا" />

          <Card className="border-gold/10 bg-card">
            <CardContent className="p-5">
              <p className="text-sm leading-7 text-muted-foreground mb-4">
                در صورت بروز خطا، API یک پاسخ JSON با فیلد <code className="rounded bg-gold/10 px-1.5 py-0.5 text-xs font-mono text-gold" dir="ltr">error</code> برمی‌گرداند.
              </p>

              <div className="overflow-x-auto rounded-xl border border-gold/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gold/10 bg-gold/[0.04]">
                      <th className="px-4 py-2.5 text-right font-semibold text-gold text-xs">کد</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-gold text-xs">وضعیت</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-gold text-xs">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { code: '400', status: 'Bad Request', desc: 'پارامترهای نامعتبر', color: 'text-amber-400' },
                      { code: '401', status: 'Unauthorized', desc: 'API Key نامعتبر', color: 'text-red-400' },
                      { code: '403', status: 'Forbidden', desc: 'دسترسی غیرمجاز', color: 'text-red-400' },
                      { code: '404', status: 'Not Found', desc: 'پرداخت یافت نشد', color: 'text-amber-400' },
                      { code: '422', status: 'Unprocessable', desc: 'مبلغ کمتر از حداقل', color: 'text-amber-400' },
                      { code: '429', status: 'Too Many Requests', desc: 'محدودیت درخواست', color: 'text-orange-400' },
                      { code: '500', status: 'Server Error', desc: 'خطای سرور', color: 'text-red-400' },
                    ].map((err, i) => (
                      <tr
                        key={err.code}
                        className={cn(
                          'border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.02]',
                          i % 2 === 0 && 'bg-white/[0.01]'
                        )}
                      >
                        <td className="px-4 py-2.5 font-mono text-xs font-bold" dir="ltr">
                          <span className={err.color}>{err.code}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground" dir="ltr">
                          {err.status}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{err.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold/15 bg-gold/[0.04] p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-gold mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">مدیریت نرخ درخواست</p>
                  <p className="text-xs">
                    محدودیت نرخ درخواست: <span className="font-mono text-gold" dir="ltr">۱۰۰ درخواست در دقیقه</span> برای هر کلید API.
                    در صورت دریافت خطای ۴۲۹، با تأخیر مجدد (Retry-After) تلاش کنید.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  Section 7: Test / Sandbox                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section id="sandbox" className="mb-8 scroll-mt-4">
          <SectionTitle icon={FlaskConical} title="محیط تست (Sandbox)" badge="Test" />

          <Card className="border-gold/10 bg-card">
            <CardContent className="p-5 space-y-5">
              <p className="text-sm leading-7 text-muted-foreground">
                پیش از انتقال به محیط عملیاتی، با استفاده از کلید تست و شماره کارت‌های نمونه، عملکرد اتصال خود را بررسی کنید.
              </p>

              {/* Sandbox API Key */}
              <div className="rounded-xl border border-gold/15 bg-gold/[0.04] p-4">
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-gold" />
                  کلید API محیط تست
                </p>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 overflow-x-auto rounded-lg bg-[#0d1117] px-4 py-2.5 text-sm font-mono text-emerald-400"
                    dir="ltr"
                  >
                    gp_test_sandbox_demo_key_12345
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-10 w-10 border-gold/20 text-gold hover:bg-gold/10 hover:text-gold"
                    onClick={() => {
                      navigator.clipboard.writeText('gp_test_sandbox_demo_key_12345');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Base URL تست: <code className="rounded bg-gold/10 px-1.5 py-0.5 text-xs font-mono text-gold" dir="ltr">https://sandbox-api.zarringold.ir</code>
                </p>
              </div>

              {/* Test Card Numbers */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-gold" />
                  شماره کارت‌های تستی
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    {
                      number: '6037-9975-1234-5678',
                      label: 'پرداخت موفق',
                      result: 'success',
                    },
                    {
                      number: '6104-3388-1234-5678',
                      label: 'پرداخت ناموفق (موجودی ناکافی)',
                      result: 'failed',
                    },
                    {
                      number: '5892-1010-1234-5678',
                      label: 'پرداخت در انتظار',
                      result: 'pending',
                    },
                    {
                      number: '9919-7500-1234-5678',
                      label: 'پرداخت ترکیبی (طلایی)',
                      result: 'mixed',
                    },
                  ].map((card) => (
                    <div
                      key={card.number}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                        card.result === 'success'
                          ? 'border-emerald-500/15 bg-emerald-500/[0.04]'
                          : card.result === 'failed'
                            ? 'border-red-500/15 bg-red-500/[0.04]'
                            : card.result === 'pending'
                              ? 'border-amber-500/15 bg-amber-500/[0.04]'
                              : 'border-gold/15 bg-gold/[0.04]'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          card.result === 'success' && 'bg-emerald-500/15 text-emerald-400',
                          card.result === 'failed' && 'bg-red-500/15 text-red-400',
                          card.result === 'pending' && 'bg-amber-500/15 text-amber-400',
                          card.result === 'mixed' && 'bg-gold/15 text-gold',
                        )}
                      >
                        {card.result === 'success' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : card.result === 'failed' ? (
                          <XCircle className="h-4 w-4" />
                        ) : card.result === 'pending' ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <ArrowLeftRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-bold text-foreground" dir="ltr">
                          {card.number}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Amounts */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-gold" />
                  مبالغ پیشنهادی تست
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { amount: '۱,۰۰۰', toman: 1000, desc: 'حداقل مبلغ' },
                    { amount: '۵۰,۰۰۰', toman: 50000, desc: 'مبلغ متوسط' },
                    { amount: '۵۰۰,۰۰۰', toman: 500000, desc: 'مبلغ بالا' },
                    { amount: '۵,۰۰۰,۰۰۰', toman: 5000000, desc: 'مبلغ حداکثر تست' },
                  ].map((item) => (
                    <div
                      key={item.toman}
                      className="flex items-center gap-2 rounded-lg border border-gold/10 bg-gold/[0.03] px-3 py-2"
                    >
                      <span className="text-sm font-bold text-gold">{item.amount}</span>
                      <span className="text-[10px] text-muted-foreground">واحد طلایی</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sandbox Info */}
              <div className="flex items-start gap-3 rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-4">
                <TestTube className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">توجه</p>
                  <p className="text-xs">
                    تراکنش‌های محیط تست واقعی نیستند و تأثیری بر حساب اصلی ندارند.
                    تمام پرداخت‌ها پس از ۳۰ روز خودکار حذف می‌شوند.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/*  Footer                                                               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <Separator className="bg-gold/10 mb-6" />

        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            سوال دیگری دارید؟ به{' '}
            <button
              onClick={() => window.open('#', '_blank')}
              className="text-gold font-semibold hover:underline inline-flex items-center gap-1"
            >
              پشتیبانی فنی
              <ExternalLink className="h-3.5 w-3.5" />
            </button>{' '}
            مراجعه کنید.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground/60">Powered by</span>
            <span className="text-xs font-bold gold-gradient-text">Zarrin Gold</span>
          </div>
        </div>
      </div>
    </div>
  );
}
