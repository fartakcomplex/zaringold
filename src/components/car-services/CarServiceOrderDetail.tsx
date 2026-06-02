'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { Car, Clock, Zap, MapPin, Loader2, Star, XCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { CarServiceOrder } from './types';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { const r = localStorage.getItem('zarrin-gold-auth'); if (!r) return null; const p = JSON.parse(r); return p?.token || p?.session?.token || null; } catch { return null; }
}

const TIMELINE_STEPS = ['pending', 'confirmed', 'in_progress', 'completed'];
const STATUS_STYLES: Record<string, string> = { pending: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/20', confirmed: 'text-blue-400 bg-blue-500/15 border-blue-500/20', in_progress: 'text-purple-400 bg-purple-500/15 border-purple-500/20', completed: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20', cancelled: 'text-red-400 bg-red-500/15 border-red-500/20' };

export default function CarServiceOrderDetail({ order }: { order: CarServiceOrder }) {
  const { t, dir } = useTranslation();
  const [rating, setRating] = useState(order.rating || 0);
  const [feedback, setFeedback] = useState(order.userFeedback || '');
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const currentStepIdx = TIMELINE_STEPS.indexOf(order.status);

  const handleRate = async () => {
    if (rating === 0) return; setSaving(true);
    try { const token = getAuthToken(); if (!token) return; await fetch(`/api/car-services/orders/${order.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ rating, userFeedback: feedback }) }); } catch {} finally { setSaving(false); }
  };
  const handleCancel = async () => {
    setCancelling(true);
    try { const token = getAuthToken(); if (!token) return; await fetch(`/api/car-services/orders/${order.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: 'cancelled' }) }); } catch {} finally { setCancelling(false); }
  };

  const formatPrice = (p: number) => { if (p === 0) return t('carServices.free'); return new Intl.NumberFormat('fa-IR').format(p) + ' ' + t('carServices.toman'); };
  const formatDate = (ds: string) => { try { return new Intl.DateTimeFormat(dir === 'rtl' ? 'fa-IR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ds)); } catch { return ds; } };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: (order.category?.color || '#8B5CF6') + '20' }}><Car className="size-4" style={{ color: order.category?.color || '#8B5CF6' }} /></div>
          <div><h4 className="font-bold text-sm">{order.category?.name || '—'}</h4><p className="text-[10px] text-muted-foreground">{formatDate(order.createdAt)}</p></div>
        </div>
        <Badge variant="outline" className={cn('text-xs border', STATUS_STYLES[order.status] || '')}>{t(`carServices.status.${order.status}`)}</Badge>
      </div>
      <div className="flex items-center gap-2">
        {order.urgency === 'urgent' ? <Badge className="bg-red-500/15 text-red-400 border-0 text-[10px] gap-1"><Zap className="size-3" />{t('carServices.urgent')}</Badge> : <Badge className="bg-zinc-700 text-zinc-300 border-0 text-[10px] gap-1"><Clock className="size-3" />{t('carServices.normal')}</Badge>}
      </div>
      {order.car && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3"><p className="text-xs text-muted-foreground mb-1">{t('carServices.selectCar')}</p><p className="text-sm font-medium">{order.car.carBrand} {order.car.carModel}</p><p className="text-xs font-mono mt-1" dir="ltr"><span className="text-emerald-400">{order.car.plateTwoChar}</span>{' '}<span className="text-white font-bold">{order.car.plateNumber}</span>{' '}<span className="text-blue-400">{order.car.plateThreeChar}</span>{' '}<span className="text-muted-foreground">{order.car.plateRegion}</span></p></div>
      )}
      {order.status !== 'cancelled' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
          <p className="text-xs text-muted-foreground mb-3">پیشرفت سفارش</p>
          <div className="relative flex items-center justify-between">
            <div className="absolute inset-x-0 top-3 h-0.5 bg-zinc-700" />
            <div className="absolute start-0 top-3 h-0.5 bg-violet-500 transition-all" style={{ width: `${(currentStepIdx / (TIMELINE_STEPS.length - 1)) * 100}%` }} />
            {TIMELINE_STEPS.map((step, idx) => { const isReached = idx <= currentStepIdx; const isCurrent = idx === currentStepIdx; return (
              <div key={step} className="relative z-10 flex flex-col items-center gap-1.5">
                <div className={cn('flex size-6 items-center justify-center rounded-full border-2 transition-all', isReached ? 'border-violet-500 bg-violet-500' : 'border-zinc-600 bg-zinc-800')}>{isReached && <CheckCircle2 className="size-3 text-white" />}</div>
                <span className={cn('text-[9px] whitespace-nowrap', isCurrent ? 'text-violet-400 font-bold' : isReached ? 'text-zinc-300' : 'text-zinc-600')}>{t(`carServices.status.${step}`)}</span>
              </div>
            ); })}
          </div>
        </div>
      )}
      {order.description && <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3"><p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MessageSquare className="size-3" />{t('carServices.description')}</p><p className="text-sm">{order.description}</p></div>}
      {order.location && <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3"><p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="size-3" />{t('carServices.location')}</p><p className="text-sm">{order.location}</p></div>}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 text-center"><p className="text-[10px] text-muted-foreground">{t('carServices.estimatedPrice')}</p><p className="text-sm font-bold text-teal-400" dir="ltr">{formatPrice(order.estimatedPrice)}</p></div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 text-center"><p className="text-[10px] text-muted-foreground">قیمت نهایی</p><p className="text-sm font-bold" dir="ltr">{formatPrice(order.finalPrice || 0)}</p></div>
      </div>
      {order.status === 'completed' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4 space-y-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Star className="size-3 text-yellow-400" />{t('carServices.rateService')}</p>
          <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((s) => (<button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110"><Star className={cn('size-6', s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600')} /></button>))}</div>
          <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="نظر خود را بنویسید..." className="bg-zinc-800 border-zinc-700 min-h-[60px] resize-none text-sm" />
          <Button onClick={handleRate} disabled={saving || rating === 0} size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black gap-1">{saving ? <Loader2 className="size-3 animate-spin" /> : <Star className="size-3" />}ثبت امتیاز</Button>
        </div>
      )}
      {order.status === 'pending' && (
        <Button onClick={handleCancel} disabled={cancelling} variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2">{cancelling ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}{t('carServices.cancelOrder')}</Button>
      )}
    </div>
  );
}
