'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  Car,
  Wrench,
  ShieldAlert,
  Truck,
  Building2,
  SquareParking,
  Search,
  BadgeCheck,
  Plus,
  AlertTriangle,
  Shield,
  ClipboardList,
  ChevronLeft,
  Star,
  Clock,
  MapPin,
  Zap,
  Loader2,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PROVINCES,
  CAR_TYPES,
  CAR_BRANDS,
  YEARS,
  STATUS_CONFIG,
  type UserCar,
  type CarServiceCategory,
  type CarServiceOrder,
} from './types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  ShieldAlert,
  Car,
  Truck,
  Building2,
  SquareParking,
  Search,
  BadgeCheck,
};

function formatPrice(price: number): string {
  if (price === 0) return 'رایگان';
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
}

function formatPlate(car: UserCar): string {
  if (car.plateTwoChar && car.plateNumber && car.plateRegion) {
    return `${car.plateTwoChar} - ${car.plateNumber} - ${car.plateRegion}`;
  }
  return 'پلاک ثبت نشده';
}

export default function CarServicesView() {
  const { t, dir } = useTranslation();
  const [activeTab, setActiveTab] = useState('services');
  const [cars, setCars] = useState<UserCar[]>([]);
  const [categories, setCategories] = useState<CarServiceCategory[]>([]);
  const [orders, setOrders] = useState<CarServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CarServiceCategory | null>(null);
  const [showCarDialog, setShowCarDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingCar, setEditingCar] = useState<UserCar | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Car form state
  const [carForm, setCarForm] = useState({
    province: '',
    city: '',
    carType: '',
    carBrand: '',
    carModel: '',
    productionYear: '1400',
    plateTwoChar: '',
    plateNumber: '',
    plateRegion: '',
    color: '',
    vin: '',
    isDefault: false,
  });

  // Service request form state
  const [serviceForm, setServiceForm] = useState({
    carId: '',
    urgency: 'normal',
    description: '',
    location: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [carsRes, catsRes, ordersRes] = await Promise.all([
        fetch('/api/car-services/cars', { headers: { 'x-user-id': 'demo-user' } }).catch(() => ({ json: async () => ({ data: [] }) })),
        fetch('/api/car-services/categories').catch(() => ({ json: async () => ({ data: [] }) })),
        fetch('/api/car-services/orders', { headers: { 'x-user-id': 'demo-user' } }).catch(() => ({ json: async () => ({ data: [] }) })),
      ]);
      const [carsData, catsData, ordersData] = await Promise.all([
        carsRes.json(),
        catsRes.json(),
        ordersRes.json(),
      ]);
      setCars(carsData.data || []);
      setCategories(catsData.data || []);
      setOrders(ordersData.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Seed categories if empty
  useEffect(() => {
    if (categories.length === 0) {
      fetch('/api/car-services/seed', { method: 'POST' })
        .then((r) => r.json())
        .then((d) => {
          if (d.data || d.created) {
            fetchData();
          }
        })
        .catch(() => {});
    }
  }, [categories.length, fetchData]);

  const resetCarForm = () => {
    setCarForm({
      province: '',
      city: '',
      carType: '',
      carBrand: '',
      carModel: '',
      productionYear: '1400',
      plateTwoChar: '',
      plateNumber: '',
      plateRegion: '',
      color: '',
      vin: '',
      isDefault: false,
    });
    setEditingCar(null);
  };

  const openAddCarDialog = () => {
    resetCarForm();
    setShowCarDialog(true);
  };

  const openEditCarDialog = (car: UserCar) => {
    setEditingCar(car);
    setCarForm({
      province: car.province,
      city: car.city,
      carType: car.carType,
      carBrand: car.carBrand,
      carModel: car.carModel,
      productionYear: String(car.productionYear),
      plateTwoChar: car.plateTwoChar,
      plateNumber: car.plateNumber,
      plateRegion: car.plateRegion,
      color: car.color,
      vin: car.vin,
      isDefault: car.isDefault,
    });
    setShowCarDialog(true);
  };

  const handleSaveCar = async () => {
    if (!carForm.province || !carForm.carType || !carForm.carBrand) return;
    setSubmitting(true);
    try {
      const url = editingCar
        ? `/api/car-services/cars/${editingCar.id}`
        : '/api/car-services/cars';
      const method = editingCar ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
        body: JSON.stringify({ ...carForm, productionYear: parseInt(carForm.productionYear) }),
      });
      const data = await res.json();
      if (data.success || data.data) {
        setShowCarDialog(false);
        resetCarForm();
        fetchData();
      }
    } catch (err) {
      console.error('Error saving car:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    try {
      await fetch(`/api/car-services/cars/${carId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'demo-user' },
      });
      fetchData();
    } catch (err) {
      console.error('Error deleting car:', err);
    }
  };

  const handleRequestService = () => {
    if (!serviceForm.carId) return;
    setSubmitting(true);
    try {
      fetch('/api/car-services/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
        body: JSON.stringify({
          carId: serviceForm.carId,
          categoryId: selectedCategory?.id,
          urgency: serviceForm.urgency,
          description: serviceForm.description,
          location: serviceForm.location,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success || data.data) {
            setShowServiceDialog(false);
            setSelectedCategory(null);
            setServiceForm({ carId: '', urgency: 'normal', description: '', location: '' });
            setActiveTab('orders');
            fetchData();
          }
        })
        .catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await fetch(`/api/car-services/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      fetchData();
    } catch (err) {
      console.error('Error cancelling order:', err);
    }
  };

  const handleRateOrder = async (orderId: string, rating: number) => {
    try {
      await fetch(`/api/car-services/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
        body: JSON.stringify({ rating }),
      });
      fetchData();
    } catch (err) {
      console.error('Error rating order:', err);
    }
  };

  const openServiceDialog = (category: CarServiceCategory) => {
    setSelectedCategory(category);
    setServiceForm({ carId: cars[0]?.id || '', urgency: 'normal', description: '', location: '' });
    setShowServiceDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir={dir}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/5">
            <Car className="h-4.5 w-4.5 text-purple-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-foreground leading-tight">
              {t('carServices.title')}
            </h1>
            <p className="text-[10px] text-muted-foreground">{t('carServices.qualityGuarantee')}</p>
          </div>
          <Button
            onClick={openAddCarDialog}
            size="sm"
            className="h-8 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white text-xs gap-1 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('carServices.addCar')}
          </Button>
        </div>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-teal-500 p-5">
          <div className="absolute top-0 left-0 w-28 h-28 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/5 rounded-full translate-x-6 translate-y-6" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">خدمات حرفه‌ای خودرو</h2>
              <p className="text-white/70 text-xs mt-0.5">تضمین کیفیت با بهترین تعمیرگاه‌ها</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
            <TabsTrigger
              value="services"
              className="rounded-lg data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
            >
              <Wrench className="w-4 h-4 ml-1.5" />
              {t('carServices.services')}
            </TabsTrigger>
            <TabsTrigger
              value="cars"
              className="rounded-lg data-[state=active]:bg-teal-600/20 data-[state=active]:text-teal-400"
            >
              <Car className="w-4 h-4 ml-1.5" />
              {t('carServices.myCars')}
              {cars.length > 0 && (
                <Badge variant="secondary" className="mr-1.5 text-xs bg-teal-600/20 text-teal-400">
                  {cars.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="rounded-lg data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400"
            >
              <ClipboardList className="w-4 h-4 ml-1.5" />
              {t('carServices.orders')}
            </TabsTrigger>
          </TabsList>

          {/* SERVICES TAB */}
          <TabsContent value="services" className="space-y-4 mt-4">
            {/* Alert banner if no cars */}
            {cars.length === 0 && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-amber-200 font-medium text-sm">
                      {t('carServices.addCarFirst')}
                    </p>
                    <p className="text-amber-300/60 text-xs mt-1">
                      {t('carServices.addCarFirstDesc')}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => { setActiveTab('cars'); openAddCarDialog(); }}
                      className="mt-2 bg-amber-500 hover:bg-amber-600 text-black text-xs h-7"
                    >
                      <Plus className="w-3 h-3 ml-1" />
                      {t('carServices.addCar')} +
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Promotional banner */}
            <Card className="bg-gradient-to-l from-purple-600/20 via-purple-500/10 to-teal-600/20 border-purple-500/20 overflow-hidden">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">
                    {t('carServices.qualityGuarantee')}
                  </h3>
                  <p className="text-zinc-300 text-xs mt-0.5">
                    بهترین کیفیت خدمات با تضمین بازگشت وجه
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Service categories grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const IconComponent = ICON_MAP[cat.icon] || Wrench;
                return (
                  <button
                    key={cat.id}
                    onClick={() => cars.length > 0 && openServiceDialog(cat)}
                    disabled={cars.length === 0}
                    className={cn(
                      'group relative rounded-2xl border p-4 text-center transition-all duration-300',
                      'hover:scale-[1.03] active:scale-[0.98]',
                      'border-zinc-700/50 bg-zinc-800/50',
                      'hover:border-purple-500/30 hover:bg-zinc-800',
                      cars.length === 0 && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {/* Color accent on hover */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${cat.color}15, transparent 70%)`,
                      }}
                    />
                    <div className="relative z-10 space-y-3">
                      <div
                        className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${cat.color}30, ${cat.color}10)`,
                          border: `1px solid ${cat.color}30`,
                        }}
                      >
                        <IconComponent className="w-7 h-7" style={{ color: cat.color }} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium leading-tight">{cat.name}</p>
                        {cat.basePrice > 0 ? (
                          <p className="text-zinc-400 text-xs mt-1.5">
                            {t('carServices.fromPrice')} {formatPrice(cat.basePrice)}
                          </p>
                        ) : (
                          <span className="inline-block mt-1.5 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                            {t('carServices.free')}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* MY CARS TAB */}
          <TabsContent value="cars" className="space-y-4 mt-4">
            {cars.length === 0 ? (
              <Card className="border-dashed border-zinc-700">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                    <Car className="w-8 h-8 text-zinc-500" />
                  </div>
                  <p className="text-zinc-400 font-medium">{t('carServices.noCars')}</p>
                  <Button
                    onClick={openAddCarDialog}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    {t('carServices.addCar')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {cars.map((car) => (
                  <Card
                    key={car.id}
                    className="border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600/50 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/20 border border-purple-500/20 flex items-center justify-center">
                            <Car className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">
                                {CAR_BRANDS[car.carBrand] || car.carBrand}
                                {car.carModel ? ` ${car.carModel}` : ''}
                              </p>
                              {car.isDefault && (
                                <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px] px-1.5 py-0">
                                  {t('carServices.default')}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {car.city || car.province}
                              </span>
                              <span>{CAR_TYPES[car.carType] || car.carType}</span>
                              <span>{car.productionYear}</span>
                            </div>
                            {/* Iranian plate display */}
                            <div className="mt-2 inline-flex items-center gap-0.5 bg-zinc-900 rounded-lg px-3 py-1.5 border border-zinc-700">
                              <div className="bg-blue-600 text-white text-xs font-bold rounded px-1.5 py-0.5">
                                {car.plateRegion || '---'}
                              </div>
                              <div className="bg-zinc-800 text-white text-xs font-bold rounded px-1.5 py-0.5">
                                {car.plateNumber || '---'}
                              </div>
                              <div className="bg-yellow-500 text-black text-xs font-bold rounded px-1.5 py-0.5">
                                ایران
                              </div>
                              <div className="bg-zinc-800 text-white text-xs font-bold rounded px-1.5 py-0.5">
                                {car.plateTwoChar || '---'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditCarDialog(car)}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700"
                          >
                            <Wrench className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCar(car.id)}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="space-y-4 mt-4">
            {orders.length === 0 ? (
              <Card className="border-dashed border-zinc-700">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                    <ClipboardList className="w-8 h-8 text-zinc-500" />
                  </div>
                  <p className="text-zinc-400 font-medium">{t('carServices.noOrders')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const CategoryIcon = order.category
                    ? ICON_MAP[order.category.icon] || Wrench
                    : Wrench;
                  return (
                    <Card
                      key={order.id}
                      className="border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600/50 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center"
                              style={{
                                background: `linear-gradient(135deg, ${order.category?.color || '#8B5CF6'}30, ${order.category?.color || '#8B5CF6'}10)`,
                                border: `1px solid ${order.category?.color || '#8B5CF6'}30`,
                              }}
                            >
                              <CategoryIcon
                                className="w-5 h-5"
                                style={{ color: order.category?.color || '#8B5CF6' }}
                              />
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">
                                {order.category?.name || 'خدمت'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {order.urgency === 'urgent' && (
                                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] px-1.5 py-0">
                                    <Zap className="w-2.5 h-2.5 ml-0.5" />
                                    {t('carServices.urgent')}
                                  </Badge>
                                )}
                                <span className="text-zinc-500 text-xs flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                                </span>
                              </div>
                              {order.car && (
                                <p className="text-zinc-500 text-xs mt-0.5">
                                  {order.car.carBrand} {order.car.carModel} — {formatPlate(order.car)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-left space-y-1.5">
                            <Badge className={cn('text-[10px] px-2 py-0.5', statusCfg.bgColor, statusCfg.color)}>
                              {statusCfg.label}
                            </Badge>
                            {order.estimatedPrice > 0 && (
                              <p className="text-xs text-zinc-400">
                                {formatPrice(order.estimatedPrice)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-700/50">
                          <div className="flex items-center gap-1">
                            {/* Rating for completed orders */}
                            {order.status === 'completed' && !order.rating && (
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => handleRateOrder(order.id, star)}
                                    className="text-zinc-600 hover:text-yellow-400 transition-colors"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                  </button>
                                ))}
                              </div>
                            )}
                            {order.rating && (
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      'w-3.5 h-3.5',
                                      star <= order.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          {order.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7"
                            >
                              {t('carServices.cancelOrder')}
                            </Button>
                          )}
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

      {/* Add/Edit Car Dialog */}
      <Dialog open={showCarDialog} onOpenChange={(open) => { setShowCarDialog(open); if (!open) resetCarForm(); }}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md max-h-[85vh] overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <Car className="w-5 h-5 text-purple-400" />
              {editingCar ? t('carServices.editCar') : t('carServices.addCar')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Province */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.province')} *</label>
              <Select value={carForm.province} onValueChange={(v) => setCarForm({ ...carForm, province: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder={t('carServices.province')} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.city')}</label>
              <Input
                value={carForm.city}
                onChange={(e) => setCarForm({ ...carForm, city: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder={t('carServices.city')}
              />
            </div>

            {/* Car Type */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.carType')} *</label>
              <Select value={carForm.carType} onValueChange={(v) => setCarForm({ ...carForm, carType: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder={t('carServices.carType')} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {Object.entries(CAR_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Car Brand */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.carBrand')} *</label>
              <Select value={carForm.carBrand} onValueChange={(v) => setCarForm({ ...carForm, carBrand: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder={t('carServices.carBrand')} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {Object.entries(CAR_BRANDS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-white">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Car Model */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.carModel')}</label>
              <Input
                value={carForm.carModel}
                onChange={(e) => setCarForm({ ...carForm, carModel: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder={t('carServices.carModel')}
              />
            </div>

            {/* Year */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.year')}</label>
              <Select value={carForm.productionYear} onValueChange={(v) => setCarForm({ ...carForm, productionYear: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-48">
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-white">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plate Number - Iranian style */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.plate')}</label>
              <div className="flex items-center gap-2">
                <Input
                  value={carForm.plateTwoChar}
                  onChange={(e) => setCarForm({ ...carForm, plateTwoChar: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white text-center w-16"
                  placeholder="الف"
                  maxLength={2}
                />
                <Input
                  value={carForm.plateNumber}
                  onChange={(e) => setCarForm({ ...carForm, plateNumber: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white text-center w-24"
                  placeholder="123"
                  maxLength={3}
                />
                <Input
                  value={carForm.plateRegion}
                  onChange={(e) => setCarForm({ ...carForm, plateRegion: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white text-center w-16"
                  placeholder="11"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.color')}</label>
              <Input
                value={carForm.color}
                onChange={(e) => setCarForm({ ...carForm, color: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder={t('carServices.color')}
              />
            </div>

            {/* VIN */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.vin')}</label>
              <Input
                value={carForm.vin}
                onChange={(e) => setCarForm({ ...carForm, vin: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder={t('carServices.vin')}
                maxLength={17}
              />
            </div>

            {/* Default toggle */}
            <button
              onClick={() => setCarForm({ ...carForm, isDefault: !carForm.isDefault })}
              className="flex items-center gap-2 text-sm text-zinc-300"
            >
              <div
                className={cn(
                  'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                  carForm.isDefault ? 'bg-teal-500 border-teal-500' : 'border-zinc-600 bg-zinc-800'
                )}
              >
                {carForm.isDefault && <Check className="w-3 h-3 text-white" />}
              </div>
              {t('carServices.default')}
            </button>

            {/* Submit */}
            <Button
              onClick={handleSaveCar}
              disabled={submitting || !carForm.province || !carForm.carType || !carForm.carBrand}
              className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white h-11 mt-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 ml-2" />
              )}
              {t('carServices.registerCar')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Request Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={(open) => { setShowServiceDialog(open); if (!open) setSelectedCategory(null); }}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md max-h-[85vh] overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              {selectedCategory && (() => {
                const Icon = ICON_MAP[selectedCategory.icon] || Wrench;
                return <Icon className="w-5 h-5" style={{ color: selectedCategory.color }} />;
              })()}
              {selectedCategory?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Select Car */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.selectCar')} *</label>
              <Select value={serviceForm.carId} onValueChange={(v) => setServiceForm({ ...serviceForm, carId: v })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder={t('carServices.selectCar')} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {cars.map((car) => (
                    <SelectItem key={car.id} value={car.id} className="text-white">
                      {car.carBrand} {car.carModel} — {formatPlate(car)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Urgency */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.urgency')}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setServiceForm({ ...serviceForm, urgency: 'normal' })}
                  className={cn(
                    'rounded-xl p-3 text-center text-sm border transition-all',
                    serviceForm.urgency === 'normal'
                      ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                      : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                  )}
                >
                  <Clock className="w-4 h-4 mx-auto mb-1" />
                  {t('carServices.normal')}
                </button>
                <button
                  onClick={() => setServiceForm({ ...serviceForm, urgency: 'urgent' })}
                  className={cn(
                    'rounded-xl p-3 text-center text-sm border transition-all',
                    serviceForm.urgency === 'urgent'
                      ? 'border-red-500/50 bg-red-500/10 text-red-400'
                      : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                  )}
                >
                  <Zap className="w-4 h-4 mx-auto mb-1" />
                  {t('carServices.urgent')}
                  <span className="text-[10px] block mt-0.5 text-zinc-500">× ۱.۵</span>
                </button>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.location')}</label>
              <Input
                value={serviceForm.location}
                onChange={(e) => setServiceForm({ ...serviceForm, location: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="آدرس یا موقعیت فعلی"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-zinc-400 text-xs mb-1 block">{t('carServices.description')}</label>
              <Textarea
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
                placeholder="توضیحات مشکل یا خدمت مورد نظر..."
              />
            </div>

            {/* Estimated Price */}
            {selectedCategory && (
              <Card className="bg-zinc-800/50 border-zinc-700/50">
                <CardContent className="p-3 flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">{t('carServices.estimatedPrice')}</span>
                  <span className="text-white font-bold">
                    {formatPrice(
                      selectedCategory.basePrice * (serviceForm.urgency === 'urgent' ? 1.5 : 1)
                    )}
                  </span>
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            <Button
              onClick={handleRequestService}
              disabled={submitting || !serviceForm.carId}
              className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white h-11"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 ml-2" />
              )}
              {t('carServices.submitRequest')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
