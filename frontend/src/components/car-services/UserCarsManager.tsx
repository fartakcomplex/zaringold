
import React, { useState, useEffect, useCallback } from 'react';
import {cn} from '@/lib/utils';
import {useTranslation} from '@/lib/i18n';
import {Car, Plus, Pencil, Trash2, Star, ChevronDown, Loader2, CheckCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import type { UserCar } from './types';

const PROVINCES = ['تهران','اصفهان','فارس','خراسان رضوی','آذربایجان شرقی','مازندران','گیلان','خوزستان','البرز','قم','مرکزی','گلستان','لرستان','کرمان','کردستان','همدان','اردبیل','یزد','هرمزگان','سمنان','بوشهر','زنجان','قزوین','ایلام','چهارمحال و بختیاری','سیستان و بلوچستان','کهگیلویه و بویراحمد','خراسان شمالی','خراسان جنوبی'];
const CAR_TYPES = [{ value: 'sedan', labelKey: 'carServices.carTypes.sedan' },{ value: 'suv', labelKey: 'carServices.carTypes.suv' },{ value: 'pickup', labelKey: 'carServices.carTypes.pickup' },{ value: 'truck', labelKey: 'carServices.carTypes.truck' },{ value: 'van', labelKey: 'carServices.carTypes.van' },{ value: 'motorcycle', labelKey: 'carServices.carTypes.motorcycle' }];
const CAR_BRANDS = [{ value: 'ikco', labelKey: 'carServices.carBrands.ikco' },{ value: 'saipa', labelKey: 'carServices.carBrands.saipa' },{ value: 'bahman', labelKey: 'carServices.carBrands.bahman' },{ value: 'modiran', labelKey: 'carServices.carBrands.modiran' },{ value: 'other', labelKey: 'carServices.carBrands.other' }];

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { const r = localStorage.getItem('zarrin-gold-auth'); if (!r) return null; const p = JSON.parse(r); return p?.token || p?.session?.token || null; } catch { return null; }
}

export default function UserCarsManager() {
  const { t } = useTranslation();
  const [cars, setCars] = useState<UserCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<UserCar | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ province: '', city: '', carType: '', carBrand: '', carModel: '', productionYear: '1400', plateNumber: '', plateTwoChar: '', plateThreeChar: '', plateRegion: '', color: '', vin: '', isDefault: false });

  const fetchCars = useCallback(async () => {
    try { const token = getAuthToken(); if (!token) return; const res = await fetch('/api/car-services/cars', { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { const d = await res.json(); setCars(d.cars || []); } } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const openAdd = () => { setEditingCar(null); setForm({ province: '', city: '', carType: '', carBrand: '', carModel: '', productionYear: '1400', plateNumber: '', plateTwoChar: '', plateThreeChar: '', plateRegion: '', color: '', vin: '', isDefault: false }); setDialogOpen(true); };
  const openEdit = (c: UserCar) => { setEditingCar(c); setForm({ province: c.province, city: c.city, carType: c.carType, carBrand: c.carBrand, carModel: c.carModel, productionYear: String(c.productionYear), plateNumber: c.plateNumber, plateTwoChar: c.plateTwoChar, plateThreeChar: c.plateThreeChar, plateRegion: c.plateRegion, color: c.color, vin: c.vin, isDefault: c.isDefault }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try { const token = getAuthToken(); if (!token) return; const url = editingCar ? `/api/car-services/cars/${editingCar.id}` : '/api/car-services/cars'; const res = await fetch(url, { method: editingCar ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) }); if (res.ok) { setDialogOpen(false); fetchCars(); } } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { const token = getAuthToken(); if (!token) return; const res = await fetch(`/api/car-services/cars/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (res.ok) fetchCars(); } catch {} finally { setDeleting(null); }
  };

  const formatPlate = (c: UserCar) => (
    <div className="flex items-center gap-1 text-sm font-mono" dir="ltr">
      <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-white text-xs">{c.plateRegion || '--'}</span>
      <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-emerald-400 font-bold text-xs">{c.plateTwoChar || '--'}</span>
      <span className="rounded bg-zinc-700 px-2 py-0.5 text-white font-bold text-xs">{c.plateNumber || '--'}</span>
      <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-blue-400 font-bold text-xs">{c.plateThreeChar || '---'}</span>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-violet-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15"><Car className="size-4 text-violet-400" /></span>
          <h3 className="text-lg font-bold">{t('carServices.myCars')}</h3>
          <Badge variant="secondary" className="bg-violet-500/15 text-violet-400 text-xs">{cars.length}</Badge>
        </div>
        <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700 text-white gap-2"><Plus className="size-4" />{t('carServices.addCar')}</Button>
      </div>
      {cars.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-800"><Car className="size-8 text-zinc-600" /></div>
          <p className="text-muted-foreground">{t('carServices.noCars')}</p>
          <Button onClick={openAdd} variant="outline" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 gap-2"><Plus className="size-4" />{t('carServices.addCar')}</Button>
        </div>
      ) : (
        <div className="space-y-3">{cars.map((car) => (
          <div key={car.id} className="group rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-violet-500/30 hover:bg-zinc-900/80">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{car.carBrand || '—'} {car.carModel || ''}</span>
                  {car.isDefault && <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]"><Star className="size-3 me-1" />{t('carServices.default')}</Badge>}
                </div>
                {formatPlate(car)}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">{car.city && <span>{car.city}</span>}<span>{car.productionYear}</span>{car.color && <span>{t('carServices.color')}: {car.color}</span>}</div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(car)} className="rounded-lg p-2 text-muted-foreground hover:bg-zinc-800 hover:text-violet-400 transition-colors"><Pencil className="size-4" /></button>
                <button onClick={() => handleDelete(car.id)} disabled={deleting === car.id} className="rounded-lg p-2 text-muted-foreground hover:bg-zinc-800 hover:text-red-400 transition-colors">{deleting === car.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</button>
              </div>
            </div>
          </div>
        ))}</div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-zinc-950 border-zinc-800 max-w-lg mx-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-violet-400"><Car className="size-5" />{editingCar ? t('carServices.editCar') : t('carServices.addCar')}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><label className="mb-1 block text-xs text-muted-foreground">{t('carServices.province')}</label><div className="relative"><select value={form.province} onChange={(e) => setForm({...form, province: e.target.value})} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none appearance-none"><option value="">انتخاب استان...</option>{PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}</select><ChevronDown className="pointer-events-none absolute top-1/2 end-3 -translate-y-1/2 size-4 text-muted-foreground" /></div></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">{t('carServices.city')}</label><Input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} placeholder={t('carServices.city')} className="bg-zinc-800 border-zinc-700" /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">{t('carServices.carType')}</label><div className="relative"><select value={form.carType} onChange={(e) => setForm({...form, carType: e.target.value})} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none appearance-none"><option value="">انتخاب نوع...</option>{CAR_TYPES.map((ct) => <option key={ct.value} value={ct.value}>{t(ct.labelKey)}</option>)}</select><ChevronDown className="pointer-events-none absolute top-1/2 end-3 -translate-y-1/2 size-4 text-muted-foreground" /></div></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">{t('carServices.carBrand')}</label><div className="relative"><select value={form.carBrand} onChange={(e) => setForm({...form, carBrand: e.target.value})} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none appearance-none"><option value="">انتخاب برند...</option>{CAR_BRANDS.map((cb) => <option key={cb.value} value={cb.value}>{t(cb.labelKey)}</option>)}</select><ChevronDown className="pointer-events-none absolute top-1/2 end-3 -translate-y-1/2 size-4 text-muted-foreground" /></div></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">{t('carServices.carModel')}</label><Input value={form.carModel} onChange={(e) => setForm({...form, carModel: e.target.value})} placeholder={t('carServices.carModel')} className="bg-zinc-800 border-zinc-700" /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">{t('carServices.year')}</label><div className="relative"><select value={form.productionYear} onChange={(e) => setForm({...form, productionYear: e.target.value})} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none appearance-none">{Array.from({ length: 25 }, (_, i) => 1404 - i).map((y) => <option key={y} value={y}>{y}</option>)}</select><ChevronDown className="pointer-events-none absolute top-1/2 end-3 -translate-y-1/2 size-4 text-muted-foreground" /></div></div>
            <div><label className="mb-2 block text-xs text-muted-foreground">{t('carServices.plate')}</label><div className="flex items-center gap-2" dir="ltr"><div className="flex-1"><Input value={form.plateRegion} onChange={(e) => setForm({...form, plateRegion: e.target.value})} maxLength={2} placeholder="کد" className="bg-zinc-800 border-zinc-700 text-center" /></div><div className="flex-1"><Input value={form.plateTwoChar} onChange={(e) => setForm({...form, plateTwoChar: e.target.value})} maxLength={2} placeholder="حروف" className="bg-zinc-800 border-zinc-700 text-center" /></div><div className="flex-1"><Input value={form.plateNumber} onChange={(e) => setForm({...form, plateNumber: e.target.value})} maxLength={3} placeholder="عدد" className="bg-zinc-800 border-zinc-700 text-center" /></div><div className="flex-1"><Input value={form.plateThreeChar} onChange={(e) => setForm({...form, plateThreeChar: e.target.value})} maxLength={3} placeholder="حرف" className="bg-zinc-800 border-zinc-700 text-center" /></div></div></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">{t('carServices.color')}</label><Input value={form.color} onChange={(e) => setForm({...form, color: e.target.value})} placeholder={t('carServices.color')} className="bg-zinc-800 border-zinc-700" /></div>
            <div><label className="mb-1 block text-xs text-muted-foreground">{t('carServices.vin')} (اختیاری)</label><Input value={form.vin} onChange={(e) => setForm({...form, vin: e.target.value})} placeholder={t('carServices.vin')} className="bg-zinc-800 border-zinc-700" /></div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({...form, isDefault: e.target.checked})} className="accent-violet-500" /><span className="text-sm">{t('carServices.default')}</span></label>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 mt-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}{t('carServices.registerCar')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
