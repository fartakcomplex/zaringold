export interface UserCar {
  id: string;
  userId: string;
  country: string;
  province: string;
  city: string;
  carType: string;
  carBrand: string;
  carModel: string;
  productionYear: number;
  plateNumber: string;
  plateTwoChar: string;
  plateThreeChar: string;
  plateRegion: string;
  color: string;
  vin: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CarServiceCategory {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  basePrice: number;
  sortOrder: number;
  isActive: boolean;
}

export interface CarServiceOrder {
  id: string;
  userId: string;
  carId: string;
  categoryId: string;
  status: string;
  urgency: string;
  description: string;
  location: string;
  scheduledAt?: string;
  estimatedPrice: number;
  finalPrice: number;
  paymentStatus: string;
  rating?: number;
  userFeedback?: string;
  adminNote?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  car?: UserCar;
  category?: CarServiceCategory;
}

export const PROVINCES = [
  'تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی',
  'مازندران', 'گیلان', 'خوزستان', 'البرز', 'قم',
  'مرکزی', 'گلستان', 'لرستان', 'کرمان', 'کردستان',
  'همدان', 'اردبیل', 'یزد', 'هرمزگان', 'سمنان',
  'بوشهر', 'زنجان', 'قزوین', 'ایلام', 'چهارمحال و بختیاری',
  'سیستان و بلوچستان', 'کهگیلویه و بویراحمد', 'خراسان شمالی',
  'خراسان جنوبی', 'آذربایجان غربی', 'سمنان',
];

export const CAR_TYPES: Record<string, string> = {
  sedan: 'سواری',
  suv: 'شاسی‌بلند',
  pickup: 'وانت',
  truck: 'کامیون',
  van: 'وانت بار',
  motorcycle: 'موتورسیکلت',
};

export const CAR_BRANDS: Record<string, string> = {
  ikco: 'ایران‌خودرو',
  saipa: 'سایپا',
  bahman: 'بهمن موتور',
  modiran: 'مدیران خودرو',
  other: 'سایر',
};

export const YEARS = Array.from({ length: 25 }, (_, i) => 1404 - i);

export const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string; labelEn: string }> = {
  pending: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', label: 'در انتظار تایید', labelEn: 'Pending' },
  confirmed: { color: 'text-blue-400', bgColor: 'bg-blue-400/10', label: 'تایید شده', labelEn: 'Confirmed' },
  in_progress: { color: 'text-purple-400', bgColor: 'bg-purple-400/10', label: 'در حال انجام', labelEn: 'In Progress' },
  completed: { color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', label: 'تکمیل شده', labelEn: 'Completed' },
  cancelled: { color: 'text-red-400', bgColor: 'bg-red-400/10', label: 'لغو شده', labelEn: 'Cancelled' },
};
