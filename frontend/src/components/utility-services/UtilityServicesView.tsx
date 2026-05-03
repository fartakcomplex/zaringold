
import {useState, useEffect} from 'react';
import {useTranslation} from '@/lib/i18n';
import {cn} from '@/lib/utils';
import {Smartphone, Wifi, Receipt, Zap, Droplets, Flame, Phone, Globe, Check, Clock, History, Loader2, Plus, ChevronLeft, Info, Copy, CheckCircle2, AlertCircle, Search} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants                                                          */
/* ═══════════════════════════════════════════════════════════════ */

const OPERATORS = [
  { id: 'mci', name: 'همراه اول', nameEn: 'MCI', color: '#FFD700', bgColor: '#FFD70015', icon: '📱' },
  { id: 'irancell', name: 'ایرانسل', nameEn: 'Irancell', color: '#FF6B00', bgColor: '#FF6B0015', icon: '📲' },
  { id: 'rightel', name: 'رایتل', nameEn: 'Rightel', color: '#A855F7', bgColor: '#A855F715', icon: '📶' },
  { id: 'taliya', name: 'تالیا', nameEn: 'Taliya', color: '#06B6D4', bgColor: '#06B6D415', icon: '☕' },
];

const TOPUP_AMOUNTS = [10000, 20000, 50000, 100000, 200000];

const INTERNET_PACKAGES: Record<string, Array<{
  title: string;
  data: string;
  dataMb: number;
  days: number;
  price: number;
  badge?: string;
}>> = {
  mci: [
    { title: 'روزانه ۵۰ مگابایت', data: '۵۰ مگابایت', dataMb: 50, days: 1, price: 1500 },
    { title: 'هفتگی ۱ گیگابایت', data: '۱ گیگابایت', dataMb: 1024, days: 7, price: 15000, badge: 'محبوب' },
    { title: 'ماهانه ۳ گیگابایت', data: '۳ گیگابایت', dataMb: 3072, days: 30, price: 35000 },
    { title: 'ماهانه ۱۰ گیگابایت', data: '۱۰ گیگابایت', dataMb: 10240, days: 30, price: 85000, badge: 'ویژه' },
    { title: 'ماهانه ۳۰ گیگابایت', data: '۳۰ گیگابایت', dataMb: 30720, days: 30, price: 165000 },
    { title: 'ماهانه نامحدود', data: 'نامحدود', dataMb: 99999, days: 30, price: 299000, badge: 'پرفروش' },
  ],
  irancell: [
    { title: 'روزانه ۱ گیگابایت', data: '۱ گیگابایت', dataMb: 1024, days: 1, price: 3000 },
    { title: 'هفتگی ۲ گیگابایت', data: '۲ گیگابایت', dataMb: 2048, days: 7, price: 22000, badge: 'محبوب' },
    { title: 'ماهانه ۴ گیگابایت', data: '۴ گیگابایت', dataMb: 4096, days: 30, price: 45000 },
    { title: 'ماهانه ۱۵ گیگابایت', data: '۱۵ گیگابایت', dataMb: 15360, days: 30, price: 110000, badge: 'ویژه' },
    { title: 'ماهانه ۴۰ گیگابایت', data: '۴۰ گیگابایت', dataMb: 40960, days: 30, price: 210000 },
    { title: 'ماهانه نامحدود', data: 'نامحدود', dataMb: 99999, days: 30, price: 349000, badge: 'پرفروش' },
  ],
  rightel: [
    { title: 'روزانه ۵۰۰ مگابایت', data: '۵۰۰ مگابایت', dataMb: 500, days: 1, price: 2500 },
    { title: 'هفتگی ۱.۵ گیگابایت', data: '۱.۵ گیگابایت', dataMb: 1536, days: 7, price: 18000, badge: 'محبوب' },
    { title: 'ماهانه ۵ گیگابایت', data: '۵ گیگابایت', dataMb: 5120, days: 30, price: 40000 },
    { title: 'ماهانه ۲۰ گیگابایت', data: '۲۰ گیگابایت', dataMb: 20480, days: 30, price: 120000, badge: 'ویژه' },
    { title: 'ماهانه نامحدود', data: 'نامحدود', dataMb: 99999, days: 30, price: 279000, badge: 'پرفروش' },
  ],
  taliya: [
    { title: 'هفتگی ۱ گیگابایت', data: '۱ گیگابایت', dataMb: 1024, days: 7, price: 16000, badge: 'محبوب' },
    { title: 'ماهانه ۳ گیگابایت', data: '۳ گیگابایت', dataMb: 3072, days: 30, price: 32000 },
    { title: 'ماهانه ۱۰ گیگابایت', data: '۱۰ گیگابایت', dataMb: 10240, days: 30, price: 80000, badge: 'ویژه' },
    { title: 'ماهانه ۲۵ گیگابایت', data: '۲۵ گیگابایت', dataMb: 25600, days: 30, price: 170000 },
  ],
};

const BILL_TYPES = [
  { id: 'electricity', name: 'برق', nameEn: 'Electricity', icon: Zap, color: '#F59E0B', bgColor: '#F59E0B15', borderColor: '#F59E0B30' },
  { id: 'water', name: 'آب', nameEn: 'Water', icon: Droplets, color: '#3B82F6', bgColor: '#3B82F615', borderColor: '#3B82F630' },
  { id: 'gas', name: 'گاز', nameEn: 'Gas', icon: Flame, color: '#EF4444', bgColor: '#EF444415', borderColor: '#EF444430' },
  { id: 'landline', name: 'تلفن ثابت', nameEn: 'Landline', icon: Phone, color: '#06B6D4', bgColor: '#06B6D415', borderColor: '#06B6D430' },
  { id: 'internet', name: 'اینترنت', nameEn: 'Internet', icon: Globe, color: '#8B5CF6', bgColor: '#8B5CF615', borderColor: '#8B5CF630' },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                     */
/* ═══════════════════════════════════════════════════════════════ */

export default function UtilityServicesView() {
  const { t, dir } = useTranslation();
  const [activeTab, setActiveTab] = useState('topup');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

  // Topup state
  const [topupOperator, setTopupOperator] = useState('mci');
  const [topupPhone, setTopupPhone] = useState('');
  const [topupAmount, setTopupAmount] = useState(10000);

  // Internet state
  const [netOperator, setNetOperator] = useState('mci');
  const [netPhone, setNetPhone] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  // Bill state
  const [billType, setBillType] = useState('electricity');
  const [billNumber, setBillNumber] = useState('');
  const [billId, setBillId] = useState('');
  const [billInquiry, setBillInquiry] = useState<Record<string, unknown> | null>(null);
  const [inquiryLoading, setInquiryLoading] = useState(false);

  // History state
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [summary, setSummary] = useState({ totalSpent: 0, totalFee: 0, totalCount: 0 });
  const [historyType, setHistoryType] = useState('all');
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async (type = 'all') => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/utility/history?type=${type}`, {
        headers: { 'x-user-id': 'demo-user' },
      });
      const data = await res.json();
      setHistory(data.data || []);
      setSummary(data.summary || { totalSpent: 0, totalFee: 0, totalCount: 0 });
    } catch {}
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyType]);

  const handleTopup = async () => {
    if (!topupPhone || !/^09\d{9}$/.test(topupPhone)) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/utility/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
        body: JSON.stringify({ operator: topupOperator, phoneNumber: topupPhone, amount: topupAmount }),
      });
      const data = await res.json();
      if (data.success) {
        setLastResult(data.data);
        setShowSuccess(true);
        setTopupPhone('');
      }
    } catch {}
    setSubmitting(false);
  };

  const handleInternetPurchase = async () => {
    if (!netPhone || !/^09\d{9}$/.test(netPhone) || selectedPackage === null) return;
    const pkg = INTERNET_PACKAGES[netOperator]?.[selectedPackage];
    if (!pkg) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/utility/internet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
        body: JSON.stringify({
          operator: netOperator,
          phoneNumber: netPhone,
          packageTitle: pkg.title,
          amount: pkg.price,
          packageDays: pkg.days,
          packageDataMb: pkg.dataMb,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastResult(data.data);
        setShowSuccess(true);
        setNetPhone('');
        setSelectedPackage(null);
      }
    } catch {}
    setSubmitting(false);
  };

  const handleBillInquiry = async () => {
    if (!billNumber) return;
    setInquiryLoading(true);
    try {
      const res = await fetch('/api/utility/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
        body: JSON.stringify({ billType, billNumber, billId, action: 'inquiry' }),
      });
      const data = await res.json();
      if (data.success) {
        setBillInquiry(data.data);
      }
    } catch {}
    setInquiryLoading(false);
  };

  const handleBillPay = async () => {
    if (!billNumber || !billInquiry) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/utility/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
        body: JSON.stringify({
          billType,
          billNumber,
          billId,
          amount: billInquiry.amount as number,
          action: 'pay',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastResult(data.data);
        setShowSuccess(true);
        setBillNumber('');
        setBillId('');
        setBillInquiry(null);
      }
    } catch {}
    setSubmitting(false);
  };

  const selectedOp = OPERATORS.find((o) => o.id === topupOperator);
  const selectedNetOp = OPERATORS.find((o) => o.id === netOperator);
  const currentPackages = INTERNET_PACKAGES[netOperator] || [];
  const currentBillType = BILL_TYPES.find((b) => b.id === billType);

  return (
    <div className="min-h-screen" dir={dir}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            {t('utility.title')}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">{t('utility.subtitle')}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
            <TabsTrigger
              value="topup"
              className="rounded-lg data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 text-xs sm:text-sm"
            >
              <Smartphone className="w-4 h-4 ml-1" />
              <span className="hidden sm:inline">{t('utility.topup')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="internet"
              className="rounded-lg data-[state=active]:bg-violet-600/20 data-[state=active]:text-violet-400 text-xs sm:text-sm"
            >
              <Wifi className="w-4 h-4 ml-1" />
              <span className="hidden sm:inline">{t('utility.internet')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="bills"
              className="rounded-lg data-[state=active]:bg-teal-600/20 data-[state=active]:text-teal-400 text-xs sm:text-sm"
            >
              <Receipt className="w-4 h-4 ml-1" />
              <span className="hidden sm:inline">{t('utility.bills')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-400 text-xs sm:text-sm"
            >
              <History className="w-4 h-4 ml-1" />
              <span className="hidden sm:inline">{t('utility.history')}</span>
            </TabsTrigger>
          </TabsList>

          {/* ═════════════ TOPUP TAB ═════════════ */}
          <TabsContent value="topup" className="space-y-4 mt-4">
            {/* Operator Selection */}
            <Card className="border-zinc-700/50 bg-zinc-800/30">
              <CardContent className="p-4">
                <p className="text-zinc-400 text-xs mb-3">{t('utility.selectOperator')}</p>
                <div className="grid grid-cols-4 gap-2">
                  {OPERATORS.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => setTopupOperator(op.id)}
                      className={cn(
                        'rounded-xl p-3 text-center border transition-all',
                        topupOperator === op.id
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600'
                      )}
                    >
                      <span className="text-2xl block mb-1">{op.icon}</span>
                      <span className={cn(
                        'text-xs font-medium',
                        topupOperator === op.id ? 'text-amber-400' : 'text-zinc-400'
                      )}>
                        {op.name}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Phone Number */}
            <Card className="border-zinc-700/50 bg-zinc-800/30">
              <CardContent className="p-4 space-y-3">
                <p className="text-zinc-400 text-xs">{t('utility.phoneNumber')}</p>
                <Input
                  value={topupPhone}
                  onChange={(e) => setTopupPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="bg-zinc-800 border-zinc-700 text-white text-center text-lg tracking-widest h-12"
                  maxLength={11}
                  dir="ltr"
                />
                {/* Operator hint based on number prefix */}
                {topupPhone.length >= 4 && (
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <span className="text-zinc-500">اپراتور شناسایی شده:</span>
                    {topupPhone.startsWith('0910') || topupPhone.startsWith('0911') || topupPhone.startsWith('0912') || topupPhone.startsWith('0913') || topupPhone.startsWith('0914') || topupPhone.startsWith('0915') || topupPhone.startsWith('0916') || topupPhone.startsWith('0917') || topupPhone.startsWith('0918') || topupPhone.startsWith('0919') ? (
                      <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">همراه اول</Badge>
                    ) : topupPhone.startsWith('0930') || topupPhone.startsWith('0933') || topupPhone.startsWith('0935') || topupPhone.startsWith('0936') || topupPhone.startsWith('0937') || topupPhone.startsWith('0938') || topupPhone.startsWith('0939') ? (
                      <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">ایرانسل</Badge>
                    ) : topupPhone.startsWith('0920') || topupPhone.startsWith('0921') || topupPhone.startsWith('0922') ? (
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">رایتل</Badge>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Amount Selection */}
            <Card className="border-zinc-700/50 bg-zinc-800/30">
              <CardContent className="p-4">
                <p className="text-zinc-400 text-xs mb-3">{t('utility.selectAmount')}</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {TOPUP_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTopupAmount(amt)}
                      className={cn(
                        'rounded-xl py-3 text-center border transition-all',
                        topupAmount === amt
                          ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                          : 'border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600'
                      )}
                    >
                      <span className={cn(
                        'text-sm font-bold',
                        topupAmount === amt ? 'text-amber-400' : 'text-zinc-300'
                      )}>
                        {formatPrice(amt)}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Custom amount */}
                <div className="mt-3">
                  <Input
                    value={topupAmount === 10000 && ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value.replace(/[^0-9]/g, ''));
                      if (v > 0) setTopupAmount(v);
                    }}
                    placeholder="مبلغ دلخواه..."
                    className="bg-zinc-800 border-zinc-700 text-white text-center h-10"
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary & Submit */}
            <Card className="border-amber-500/20 bg-gradient-to-l from-amber-500/5 to-orange-500/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{t('utility.operator')}</span>
                  <span className="text-white">{selectedOp?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{t('utility.amount')}</span>
                  <span className="text-white font-bold">{formatPrice(topupAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{t('utility.fee')}</span>
                  <span className="text-zinc-300">{formatPrice(Math.round(topupAmount * 0.01))}</span>
                </div>
                <div className="border-t border-zinc-700/50 pt-2 flex justify-between">
                  <span className="text-zinc-300 font-medium">{t('utility.total')}</span>
                  <span className="text-amber-400 font-bold">{formatPrice(topupAmount + Math.round(topupAmount * 0.01))}</span>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleTopup}
              disabled={submitting || !topupPhone || !/^09\d{9}$/.test(topupPhone)}
              className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-base font-bold rounded-xl"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Smartphone className="w-5 h-5 ml-2" />}
              {t('utility.buyTopup')}
            </Button>
          </TabsContent>

          {/* ═════════════ INTERNET TAB ═════════════ */}
          <TabsContent value="internet" className="space-y-4 mt-4">
            {/* Operator Selection */}
            <Card className="border-zinc-700/50 bg-zinc-800/30">
              <CardContent className="p-4">
                <p className="text-zinc-400 text-xs mb-3">{t('utility.selectOperator')}</p>
                <div className="grid grid-cols-4 gap-2">
                  {OPERATORS.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => { setNetOperator(op.id); setSelectedPackage(null); }}
                      className={cn(
                        'rounded-xl p-3 text-center border transition-all',
                        netOperator === op.id
                          ? 'border-violet-500/50 bg-violet-500/10'
                          : 'border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600'
                      )}
                    >
                      <span className="text-2xl block mb-1">{op.icon}</span>
                      <span className={cn(
                        'text-xs font-medium',
                        netOperator === op.id ? 'text-violet-400' : 'text-zinc-400'
                      )}>
                        {op.name}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Phone Number */}
            <Card className="border-zinc-700/50 bg-zinc-800/30">
              <CardContent className="p-4 space-y-3">
                <p className="text-zinc-400 text-xs">{t('utility.phoneNumber')}</p>
                <Input
                  value={netPhone}
                  onChange={(e) => setNetPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="bg-zinc-800 border-zinc-700 text-white text-center text-lg tracking-widest h-12"
                  maxLength={11}
                  dir="ltr"
                />
              </CardContent>
            </Card>

            {/* Internet Packages */}
            <Card className="border-zinc-700/50 bg-zinc-800/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-zinc-400 text-xs">{t('utility.internetPackages')}</p>
                  <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">
                    {selectedNetOp?.name}
                  </Badge>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {currentPackages.map((pkg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPackage(idx)}
                      className={cn(
                        'w-full rounded-xl p-3 border text-right transition-all flex items-center justify-between',
                        selectedPackage === idx
                          ? 'border-violet-500/50 bg-violet-500/10'
                          : 'border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            selectedPackage === idx ? 'bg-violet-500/20' : 'bg-zinc-800'
                          )}
                        >
                          <Wifi className={cn('w-5 h-5', selectedPackage === idx ? 'text-violet-400' : 'text-zinc-500')} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={cn('text-sm font-medium', selectedPackage === idx ? 'text-white' : 'text-zinc-300')}>
                              {pkg.title}
                            </p>
                            {pkg.badge && (
                              <Badge className={cn(
                                'text-[9px] px-1.5 py-0',
                                pkg.badge === 'پرفروش' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                pkg.badge === 'ویژه' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              )}>
                                {pkg.badge}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                              <Wifi className="w-3 h-3" />
                              {pkg.data}
                            </span>
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {pkg.days} روز
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={cn(
                        'text-sm font-bold whitespace-nowrap',
                        selectedPackage === idx ? 'text-violet-400' : 'text-zinc-400'
                      )}>
                        {formatPrice(pkg.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              onClick={handleInternetPurchase}
              disabled={submitting || !netPhone || !/^09\d{9}$/.test(netPhone) || selectedPackage === null}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-base font-bold rounded-xl"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Wifi className="w-5 h-5 ml-2" />}
              {t('utility.buyPackage')}
            </Button>
          </TabsContent>

          {/* ═════════════ BILLS TAB ═════════════ */}
          <TabsContent value="bills" className="space-y-4 mt-4">
            {/* Bill Type Selection */}
            <Card className="border-zinc-700/50 bg-zinc-800/30">
              <CardContent className="p-4">
                <p className="text-zinc-400 text-xs mb-3">{t('utility.selectBillType')}</p>
                <div className="grid grid-cols-5 gap-2">
                  {BILL_TYPES.map((bt) => (
                    <button
                      key={bt.id}
                      onClick={() => { setBillType(bt.id); setBillInquiry(null); }}
                      className={cn(
                        'rounded-xl p-3 text-center border transition-all',
                        billType === bt.id
                          ? ''
                          : 'border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600'
                      )}
                      style={billType === bt.id ? {
                        borderColor: bt.borderColor,
                        background: bt.bgColor,
                      } : {}}
                    >
                      <bt.icon className={cn('w-6 h-6 mx-auto mb-1.5', billType === bt.id ? '' : 'text-zinc-500')} style={billType === bt.id ? { color: bt.color } : {}} />
                      <span className={cn('text-[11px] font-medium block', billType === bt.id ? 'text-white' : 'text-zinc-400')}>
                        {bt.name}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bill Info Card */}
            <Card className="border-zinc-700/50 bg-zinc-800/30">
              <CardContent className="p-4 space-y-3">
                <p className="text-zinc-400 text-xs">{t('utility.billInfo')}</p>
                <p className="text-zinc-300 text-[13px]">
                  {t('utility.billDescription')}
                </p>
                <div className="flex items-center gap-2 bg-teal-500/5 border border-teal-500/20 rounded-lg p-3">
                  <Info className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span className="text-teal-300/70 text-[11px]">{t('utility.billInfoHint')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Bill Number Input */}
            <Card className="border-zinc-700/50 bg-zinc-800/30">
              <CardContent className="p-4 space-y-3">
                <p className="text-zinc-400 text-xs">{t('utility.billNumber')}</p>
                <Input
                  value={billNumber}
                  onChange={(e) => { setBillNumber(e.target.value.replace(/[^0-9]/g, '')); setBillInquiry(null); }}
                  placeholder="شماره قبض"
                  className="bg-zinc-800 border-zinc-700 text-white text-center text-lg tracking-widest h-12"
                  dir="ltr"
                />
                {(billType === 'electricity' || billType === 'gas' || billType === 'landline') && (
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">{t('utility.billId')} <span className="text-zinc-600">(اختیاری)</span></p>
                    <Input
                      value={billId}
                      onChange={(e) => { setBillId(e.target.value.replace(/[^0-9]/g, '')); setBillInquiry(null); }}
                      placeholder="شناسه قبض"
                      className="bg-zinc-800 border-zinc-700 text-white text-center text-lg tracking-widest h-12"
                      dir="ltr"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inquiry Result */}
            {billInquiry && (
              <Card className="border-teal-500/20 bg-gradient-to-l from-teal-500/5 to-cyan-500/5">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span className="text-teal-400 text-sm font-medium">{t('utility.billFound')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{t('utility.billType')}</span>
                    <span className="text-white">{currentBillType?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{t('utility.billNumber')}</span>
                    <span className="text-white font-mono" dir="ltr">{billInquiry.billNumber}</span>
                  </div>
                  <div className="border-t border-zinc-700/50 pt-2 flex justify-between">
                    <span className="text-zinc-300 font-medium">{t('utility.billAmount')}</span>
                    <span className="text-teal-400 font-bold">{formatPrice(billInquiry.amount as number)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleBillInquiry}
                disabled={!billNumber || inquiryLoading}
                variant="outline"
                className="flex-1 h-12 border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300 rounded-xl"
              >
                {inquiryLoading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Search className="w-5 h-5 ml-2" />}
                {t('utility.inquireBill')}
              </Button>
              <Button
                onClick={handleBillPay}
                disabled={submitting || !billNumber || !billInquiry}
                className="flex-1 h-12 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-xl"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Receipt className="w-5 h-5 ml-2" />}
                {t('utility.payBill')}
              </Button>
            </div>
          </TabsContent>

          {/* ═════════════ HISTORY TAB ═════════════ */}
          <TabsContent value="history" className="space-y-4 mt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="border-zinc-700/50 bg-zinc-800/30">
                <CardContent className="p-3 text-center">
                  <p className="text-zinc-500 text-[10px]">{t('utility.totalTransactions')}</p>
                  <p className="text-white font-bold text-lg mt-0.5">{summary.totalCount}</p>
                </CardContent>
              </Card>
              <Card className="border-zinc-700/50 bg-zinc-800/30">
                <CardContent className="p-3 text-center">
                  <p className="text-zinc-500 text-[10px]">{t('utility.totalSpent')}</p>
                  <p className="text-amber-400 font-bold text-sm mt-0.5">{formatPrice(summary.totalSpent)}</p>
                </CardContent>
              </Card>
              <Card className="border-zinc-700/50 bg-zinc-800/30">
                <CardContent className="p-3 text-center">
                  <p className="text-zinc-500 text-[10px]">{t('utility.totalFee')}</p>
                  <p className="text-zinc-300 font-bold text-sm mt-0.5">{formatPrice(summary.totalFee)}</p>
                </CardContent>
              </Card>
            </div>

            {/* History Type Filter */}
            <div className="flex gap-2">
              {['all', 'topup', 'internet', 'bill'].map((type) => (
                <button
                  key={type}
                  onClick={() => setHistoryType(type)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs border transition-all',
                    historyType === type
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                      : 'border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                  )}
                >
                  {type === 'all' ? t('utility.all') :
                   type === 'topup' ? t('utility.topup') :
                   type === 'internet' ? t('utility.internet') :
                   t('utility.bills')}
                </button>
              ))}
            </div>

            {/* History List */}
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
              </div>
            ) : history.length === 0 ? (
              <Card className="border-dashed border-zinc-700">
                <CardContent className="p-12 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-zinc-500" />
                  </div>
                  <p className="text-zinc-400 font-medium">{t('utility.noHistory')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {(history as Array<Record<string, string | number>>).map((item) => {
                  const typeIcon = item.type === 'topup' ? Smartphone :
                    item.type === 'internet' ? Wifi : Receipt;
                  const typeColor = item.type === 'topup' ? 'amber' :
                    item.type === 'internet' ? 'violet' : 'teal';
                  const TypeIcon = typeIcon;
                  const op = OPERATORS.find((o) => o.id === item.operator);
                  const bt = BILL_TYPES.find((b) => b.id === item.billType);

                  return (
                    <Card key={item.id} className="border-zinc-700/50 bg-zinc-800/30">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', `bg-${typeColor}-500/10`)}>
                            <TypeIcon className={cn('w-5 h-5', `text-${typeColor}-400`)} />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {item.type === 'topup' ? t('utility.topup') :
                               item.type === 'internet' ? (item.packageTitle as string || t('utility.internet')) :
                               (bt?.name || item.billType)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {op && <span className="text-zinc-500 text-[11px]">{op.name}</span>}
                              {item.phoneNumber && (
                                <span className="text-zinc-500 text-[11px]" dir="ltr">{item.phoneNumber as string}</span>
                              )}
                              <span className="text-zinc-600 text-[10px] flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(item.createdAt as string).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className={cn('text-sm font-bold', `text-${typeColor}-400`)}>
                            {formatPrice(item.totalPrice as number)}
                          </p>
                          <Badge className={cn(
                            'text-[9px] px-1.5 py-0 mt-0.5',
                            item.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            item.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          )}>
                            {item.status === 'success' ? 'موفق' :
                             item.status === 'failed' ? 'ناموفق' : 'در انتظار'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Success Dialog */}
      {showSuccess && lastResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSuccess(false)}>
          <Card className="bg-zinc-900 border-zinc-700 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{t('utility.paymentSuccess')}</h3>
                <p className="text-zinc-400 text-sm mt-1">{t('utility.paymentSuccessDesc')}</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3 space-y-2 text-right">
                {lastResult.referenceCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Copy className="w-3 h-3" />
                      {t('utility.refCode')}
                    </span>
                    <span className="text-white font-mono text-xs" dir="ltr">{lastResult.referenceCode as string}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">{t('utility.amount')}</span>
                  <span className="text-emerald-400 font-bold">{formatPrice(lastResult.totalPrice as number)}</span>
                </div>
              </div>
              <Button
                onClick={() => setShowSuccess(false)}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {t('utility.close')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
