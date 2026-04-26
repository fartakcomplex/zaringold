import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/auth-guard';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      return NextResponse.json({ message: 'احراز هویت نشده' }, { status: 401 });
    }

    // Check if data already exists
    const existingUtility = await db.utilityPayment.count();
    if (existingUtility > 0) {
      return NextResponse.json({
        success: true,
        message: 'داده‌های نمونه از قبل وجود دارد',
        counts: { utility: existingUtility },
      });
    }

    // Find first user
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربری یافت نشد' },
        { status: 400 }
      );
    }

    // Create car service categories if needed
    const existingCats = await db.carServiceCategory.count();
    if (existingCats === 0) {
      await db.carServiceCategory.createMany([
        { slug: 'oil-change', name: 'تعویض روغن', nameEn: 'Oil Change', icon: 'Droplets', color: '#8B5CF6', basePrice: 350000, sortOrder: 1 },
        { slug: 'tire-change', name: 'تعویض لاستیک', nameEn: 'Tire Change', icon: 'Circle', color: '#F59E0B', basePrice: 500000, sortOrder: 2 },
        { slug: 'car-wash', name: 'کارواش', nameEn: 'Car Wash', icon: 'Sparkles', color: '#06B6D4', basePrice: 150000, sortOrder: 3 },
        { slug: 'mechanic', name: 'مکانیکی', nameEn: 'Mechanic', icon: 'Wrench', color: '#EF4444', basePrice: 200000, sortOrder: 4 },
        { slug: 'battery', name: 'باطری‌سازی', nameEn: 'Battery', icon: 'Battery', color: '#10B981', basePrice: 800000, sortOrder: 5 },
        { slug: 'diagnostic', name: 'عیب‌یابی', nameEn: 'Diagnostic', icon: 'Search', color: '#EC4899', basePrice: 250000, sortOrder: 6 },
      ]);
    }

    // Create user car if needed
    const existingCars = await db.userCar.count({ where: { userId: user.id } });
    let carId: string | null = null;
    if (existingCars === 0) {
      const car = await db.userCar.create({
        data: {
          userId: user.id,
          brand: 'ایران خودرو',
          model: 'پژو ۲۰۶',
          year: 1400,
          plate: '۷۷۷-۱۲-۱۱۱۱',
          color: 'سفید',
          chasisNumber: 'IR123456789',
        },
      });
      carId = car.id;
    } else {
      const car = await db.userCar.findFirst({ where: { userId: user.id } });
      carId = car?.id || null;
    }

    const categories = await db.carServiceCategory.findMany();

    // Seed utility payments
    const utilityData = [];
    const types = ['topup', 'internet', 'bill'] as const;
    const operators = ['mci', 'irancell', 'rightel'] as const;
    const statuses = ['success', 'success', 'success', 'success', 'success', 'success', 'pending', 'failed'] as const;
    const billTypes = ['electricity', 'water', 'gas', 'landline'] as const;
    const packageTitles = ['بسته روزانه ۱گیگ', 'بسته هفتگی ۵گیگ', 'بسته ماهانه ۳۰گیگ', 'بسته فصلی ۶۰گیگ'];

    for (let i = 0; i < 25; i++) {
      const type = types[i % 3];
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      utilityData.push({
        userId: user.id,
        type,
        operator: type === 'topup' ? operators[i % 3] : type === 'internet' ? operators[i % 3] : '',
        phoneNumber: `0912${String(Math.floor(Math.random() * 9000000 + 1000000))}`,
        amount: type === 'topup' ? [10000, 20000, 50000, 100000][i % 4] : type === 'internet' ? [25000, 35000, 50000, 75000][i % 4] : [50000, 100000, 150000, 200000, 300000][i % 5],
        fee: 0,
        totalPrice: type === 'topup' ? [10000, 20000, 50000, 100000][i % 4] : type === 'internet' ? [25000, 35000, 50000, 75000][i % 4] : [50000, 100000, 150000, 200000, 300000][i % 5],
        status: statuses[i % statuses.length],
        paymentMethod: 'wallet',
        billType: type === 'bill' ? billTypes[i % 4] : '',
        billNumber: type === 'bill' ? `98${String(i + 1000).padStart(8, '0')}` : '',
        packageTitle: type === 'internet' ? packageTitles[i % 4] : '',
        packageDays: type === 'internet' ? [1, 7, 30, 30][i % 4] : 0,
        packageDataMb: type === 'internet' ? [1024, 5120, 30720, 61440][i % 4] : 0,
        referenceCode: `REF${String(Date.now()).slice(-8)}${i}`,
        createdAt: date,
      });
    }

    await db.utilityPayment.createMany({ data: utilityData });

    // Seed car service orders
    const carOrders = [];
    const carStatuses = ['completed', 'completed', 'completed', 'pending', 'cancelled'] as const;

    for (let i = 0; i < 15; i++) {
      const cat = categories[i % categories.length];
      const daysAgo = Math.floor(Math.random() * 20);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      carOrders.push({
        userId: user.id,
        carId: carId!,
        categoryId: cat.id,
        status: carStatuses[i % carStatuses.length],
        urgency: i % 3 === 0 ? 'urgent' : 'normal',
        description: 'درخواست خدمات ' + cat.name,
        location: 'تهران',
        estimatedPrice: cat.basePrice + Math.floor(Math.random() * 200000),
        finalPrice: i % 4 === 0 ? 0 : cat.basePrice + Math.floor(Math.random() * 200000),
        paymentStatus: i % 4 === 0 ? 'unpaid' : 'paid',
        createdAt: date,
      });
    }

    await db.carServiceOrder.createMany({ data: carOrders });

    // Seed insurance orders
    const insOrders = [];
    const providers = ['پارسیان', 'البرز', 'آسیا', 'دانا', 'معلم'];
    const plans = ['بیمه شخص ثالث', 'بیمه بدنه', 'بیمه آتش‌سوزی', 'بیمه مسئولیت', 'بیمه عمر'];
    const insStatuses = ['active', 'active', 'active', 'pending', 'cancelled', 'expired'] as const;

    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const startDate = new Date(date);
      startDate.setFullYear(startDate.getFullYear() + 1);

      insOrders.push({
        userId: user.id,
        planId: `plan-${i}`,
        providerId: `provider-${i % 5}`,
        categoryId: 'third-party',
        planName: plans[i % plans.length],
        providerName: providers[i % providers.length],
        amountPaid: [500000, 750000, 1000000, 1500000, 2000000, 3000000][i % 6],
        commissionEarned: [25000, 37500, 50000, 75000, 100000, 150000][i % 6],
        status: insStatuses[i % insStatuses.length],
        policyNumber: insStatuses[i % insStatuses.length] === 'active' ? `INS-${String(i + 1000).padStart(6, '0')}` : null,
        holderName: user.fullName || 'کاربر نمونه',
        holderPhone: user.phone,
        startDate: insStatuses[i % insStatuses.length] === 'active' ? date : null,
        endDate: insStatuses[i % insStatuses.length] === 'active' ? startDate : null,
        issuedAt: insStatuses[i % insStatuses.length] === 'active' ? date : null,
        createdAt: date,
      });
    }

    await db.insuranceOrder.createMany({ data: insOrders });

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه با موفقیت ایجاد شد',
      counts: {
        utility: 25,
        carService: 15,
        insurance: 20,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد داده‌های نمونه' },
      { status: 500 }
    );
  }
}
