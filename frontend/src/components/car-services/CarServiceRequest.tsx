
import React, { useState } from 'react';
import {cn} from '@/lib/utils';
import {useTranslation} from '@/lib/i18n';
import {Car, Clock, Zap, MapPin, Calendar, Loader2, CheckCircle, MessageSquare, Send} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import type { UserCar, CarServiceCategory } from './types';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { const r = localStorage.getItem('zarrin-gold-auth'); if (!r) return null; const p = JSON.parse(r); return p?.token || p?.session?.token || null; } catch { return null; }
}

interface Props { category: CarServiceCategory; cars: UserCar[]; onSuccess: () => void; }

export default function CarServiceRequest({ category, cars, onSuccess }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [success, setSuccess] = useState(false);
  const estimatedPrice = category.basePrice * (urgency === 'urgent' ? 1.5 : 1);

  const handleSubmit = async () => {
    if (!selectedCarId) return;
    setLoading(true);
    try {
      const token = getAuthToken(); if (!token) return;
      const res = await fetch('/api/car-services/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ carId: selectedCarId, categoryId: category.id, urgency, description, location, scheduledAt: scheduleMode === 'scheduled' && scheduledAt ? scheduledAt : null }) });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { setOpen(false); setSuccess(false); setDescription(''); setLocation(''); setScheduleMode('now'); setScheduledAt(''); setUrgency('normal'); setSelectedCarId(''); onSuccess(); }, 2000);
      }
    } catch {} finally { setLoading(false); }
  };

  const formatPrice = (p: number) => { if (p === 0) return t('carServices.free'); return new Intl.NumberFormat('fa-IR').format(p) + ' ' + t('carServices.toman'); };

  return (
    <>
      <Button onClick={() => { if (cars.length > 0) setOpen(true); }} disabled={cars.length === 0} className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white mt-3">{t('carServices.requestService')}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-zinc-950 border-zinc-800 max-w-lg mx-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: category.color + '20' }}><Car className="size-4" style={{ color: category.color }} /></div><span>{category.name}</span></DialogTitle></DialogHeader>
          {success ? (
            <div className="flex flex-col items-center gap-4 py-10"><div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15"><CheckCircle className="size-8 text-emerald-400" /></div><p className="text-lg font-bold text-emerald-400">{t('carServices.orderPlaced')}</p></div>
          ) : (
            <div className="space-y-4 pt-2">
              <div><label className="mb-1 block text-xs text-muted-foreground flex items-center gap-1"><Car className="size-3" />{t('carServices.selectCar')}</label><select value={selectedCarId} onChange={(e) => setSelectedCarId(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none appearance-none"><option value="">{t('carServices.selectCar')}...</option>{cars.map((c) => <option key={c.id} value={c.id}>{c.carBrand} {c.carModel} - {c.plateTwoChar} {c.plateNumber} {c.plateThreeChar}</option>)}</select></div>
              <div><label className="mb-1 block text-xs text-muted-foreground flex items-center gap-1"><Zap className="size-3" />{t('carServices.urgency')}</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setUrgency('normal')} className={cn('rounded-lg border p-3 text-center transition-all text-sm', urgency === 'normal' ? 'border-teal-500 bg-teal-500/10 text-teal-400' : 'border-zinc-700 bg-zinc-800 text-muted-foreground hover:border-zinc-600')}><Clock className="mx-auto size-4 mb-1" />{t('carServices.normal')}</button><button type="button" onClick={() => setUrgency('urgent')} className={cn('rounded-lg border p-3 text-center transition-all text-sm', urgency === 'urgent' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-zinc-700 bg-zinc-800 text-muted-foreground hover:border-zinc-600')}><Zap className="mx-auto size-4 mb-1" />{t('carServices.urgent')}<span className="block text-[10px] opacity-70">+۵۰٪</span></button></div></div>
              <div><label className="mb-1 block text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="size-3" />{t('carServices.description')}</label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('carServices.description')} className="bg-zinc-800 border-zinc-700 min-h-[80px] resize-none" /></div>
              <div><label className="mb-1 block text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" />{t('carServices.location')}</label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('carServices.location')} className="bg-zinc-800 border-zinc-700" /></div>
              <div><label className="mb-1 block text-xs text-muted-foreground flex items-center gap-1"><Calendar className="size-3" />{t('carServices.schedule')}</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setScheduleMode('now')} className={cn('rounded-lg border p-2.5 text-center transition-all text-sm', scheduleMode === 'now' ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-zinc-700 bg-zinc-800 text-muted-foreground')}>{t('carServices.now')}</button><button type="button" onClick={() => setScheduleMode('scheduled')} className={cn('rounded-lg border p-2.5 text-center transition-all text-sm', scheduleMode === 'scheduled' ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-zinc-700 bg-zinc-800 text-muted-foreground')}>{t('carServices.scheduled')}</button></div>{scheduleMode === 'scheduled' && <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="bg-zinc-800 border-zinc-700 mt-2" />}</div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{t('carServices.estimatedPrice')}</span><span className="font-bold text-teal-400" dir="ltr">{formatPrice(estimatedPrice)}</span></div></div>
              <Button onClick={handleSubmit} disabled={loading || !selectedCarId} className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2">{loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{t('carServices.submitRequest')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
